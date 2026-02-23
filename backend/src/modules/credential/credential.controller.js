import * as credentialService from './credential.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const upsertCredential = asyncHandler(async (req, res) => {
  const credential = await credentialService.upsertCredential(req.user.id, req.body);
  res.status(200).json(credential);
});

export const getCredential = asyncHandler(async (req, res) => {
  const credential = await credentialService.getCredential(req.user.id);
  res.status(200).json(credential);
});
