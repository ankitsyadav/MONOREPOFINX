import { Router } from 'express';
import * as webhookController from './webhook.controller.js';

const router = Router();

router.get('/meta', webhookController.verifyWebhook);
router.post('/meta', webhookController.handleMetaWebhook);

export default router;
