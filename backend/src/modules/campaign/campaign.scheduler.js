import cron from 'node-cron';
import prisma from '../../config/prisma.js';
import { processCampaign } from './campaign.service.js';

export const startCampaignScheduler = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      select: { id: true },
    });

    for (const campaign of dueCampaigns) {
      processCampaign(campaign.id).catch(() => {});
    }
  });
};
