import prisma from '../../config/prisma.js';

export const getStats = async (userId) => {
  const [campaigns, aggregates] = await Promise.all([
    prisma.campaign.count({ where: { userId } }),
    prisma.campaign.aggregate({
      where: { userId },
      _sum: {
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
      },
    }),
  ]);

  const totals = aggregates._sum;
  const totalMessages = totals.totalRecipients ?? 0;
  const deliveredCount = totals.deliveredCount ?? 0;
  const readCount = totals.readCount ?? 0;
  const failedCount = totals.failedCount ?? 0;

  const deliveryRate = totalMessages > 0 ? ((deliveredCount / totalMessages) * 100).toFixed(2) : '0.00';
  const readRate = totalMessages > 0 ? ((readCount / totalMessages) * 100).toFixed(2) : '0.00';
  const failedRate = totalMessages > 0 ? ((failedCount / totalMessages) * 100).toFixed(2) : '0.00';

  const recentCampaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      deliveredCount: true,
      readCount: true,
      failedCount: true,
      createdAt: true,
    },
  });

  return {
    totalCampaigns: campaigns,
    totalMessages,
    sentCount: totals.sentCount ?? 0,
    deliveredCount,
    readCount,
    failedCount,
    deliveryRate: parseFloat(deliveryRate),
    readRate: parseFloat(readRate),
    failedRate: parseFloat(failedRate),
    recentCampaigns,
  };
};
