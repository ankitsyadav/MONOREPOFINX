import { Router } from 'express';
import { body } from 'express-validator';
import * as credentialController from './credential.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('wabaId').trim().notEmpty().withMessage('WABA ID is required'),
    body('phoneNumberId').trim().notEmpty().withMessage('Phone Number ID is required'),
    body('accessToken').trim().notEmpty().withMessage('Access Token is required'),
    validate,
  ],
  credentialController.upsertCredential
);

router.get('/', credentialController.getCredential);

export default router;
