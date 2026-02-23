import * as webhookService from './webhook.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const handleMetaWebhook = asyncHandler(async (req, res) => {
  await webhookService.handleMetaWebhook(req.body);
  res.status(200).json({ status: 'ok' });
});

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ message: 'Forbidden' });
};
