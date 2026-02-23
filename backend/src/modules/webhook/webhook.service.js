import prisma from '../../config/prisma.js';

const STATUS_MAP = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
};

const COUNTER_MAP = {
  sent: 'sentCount',
  delivered: 'deliveredCount',
  read: 'readCount',
  failed: 'failedCount',
};

export const handleMetaWebhook = async (body) => {
  const entries = body?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const statuses = change.value?.statuses ?? [];
      for (const statusObj of statuses) {
        await processStatusUpdate(statusObj);
      }
    }
  }
};

const processStatusUpdate = async ({ id: whatsappMessageId, status }) => {
  if (!whatsappMessageId || !STATUS_MAP[status]) return;

  const recipient = await prisma.campaignRecipient.findFirst({
    where: { whatsappMessageId },
  });
  if (!recipient) return;

  await prisma.campaignRecipient.update({
    where: { id: recipient.id },
    data: { status: STATUS_MAP[status] },
  });

  const counterField = COUNTER_MAP[status];
  if (counterField) {
    await prisma.campaign.update({
      where: { id: recipient.campaignId },
      data: { [counterField]: { increment: 1 } },
    });
  }
};
