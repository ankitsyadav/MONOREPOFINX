import axios from 'axios';
import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getDecryptedCredential } from '../credential/credential.service.js';

export const createCampaign = async (userId, { name, message, scheduledAt, recipients }) => {
  const phoneNumbers = [...new Set(recipients.map((r) => r.trim()).filter(Boolean))];
  if (!phoneNumbers.length) throw new AppError('At least one recipient is required', 400);

  const status = scheduledAt ? 'SCHEDULED' : 'DRAFT';

  const campaign = await prisma.campaign.create({
    data: {
      userId,
      name,
      message,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status,
      totalRecipients: phoneNumbers.length,
      recipients: {
        create: phoneNumbers.map((phoneNumber) => ({ phoneNumber })),
      },
    },
    include: { recipients: true },
  });

  return campaign;
};

export const getCampaigns = async (userId) => {
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      message: true,
      scheduledAt: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      deliveredCount: true,
      readCount: true,
      failedCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getCampaignById = async (userId, campaignId) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { recipients: { orderBy: { createdAt: 'desc' } } },
  });
  if (!campaign) throw new AppError('Campaign not found', 404);
  return campaign;
};

export const deleteCampaign = async (userId, campaignId) => {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
  if (!campaign) throw new AppError('Campaign not found', 404);
  if (['PROCESSING'].includes(campaign.status)) throw new AppError('Cannot delete a campaign that is currently processing', 400);
  await prisma.campaign.delete({ where: { id: campaignId } });
};

export const processCampaign = async (campaignId) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { recipients: { where: { status: 'PENDING' } } },
  });
  if (!campaign) return;

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PROCESSING' } });

  let credential;
  try {
    credential = await getDecryptedCredential(campaign.userId);
  } catch {
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'FAILED' } });
    return;
  }

  const BATCH_SIZE = 10;
  const pendingRecipients = campaign.recipients;

  for (let i = 0; i < pendingRecipients.length; i += BATCH_SIZE) {
    const batch = pendingRecipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((recipient) => sendWhatsAppMessage(credential, campaign, recipient))
    );
  }

  const updated = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { sentCount: true, failedCount: true, totalRecipients: true },
  });

  const finalStatus = updated.failedCount === updated.totalRecipients ? 'FAILED' : 'COMPLETED';
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: finalStatus } });
};

const sendWhatsAppMessage = async (credential, campaign, recipient) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${credential.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipient.phoneNumber,
        type: 'text',
        text: { body: campaign.message },
      },
      {
        headers: {
          Authorization: `Bearer ${credential.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const whatsappMessageId = response.data?.messages?.[0]?.id;
    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: { status: 'SENT', whatsappMessageId },
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: { increment: 1 } },
    });
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: { status: 'FAILED', errorMessage },
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { failedCount: { increment: 1 } },
    });
  }
};
