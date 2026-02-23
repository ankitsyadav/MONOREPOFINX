import { Router } from 'express';
import { body } from 'express-validator';
import * as campaignController from './campaign.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('recipients').isArray({ min: 1 }).withMessage('At least one recipient required'),
    body('scheduledAt').optional().isISO8601().withMessage('Invalid date format'),
    validate,
  ],
  campaignController.createCampaign
);

router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.delete('/:id', campaignController.deleteCampaign);

export default router;
