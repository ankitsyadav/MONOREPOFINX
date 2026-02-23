import * as campaignService from './campaign.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign(req.user.id, req.body);
  res.status(201).json(campaign);
});

export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await campaignService.getCampaigns(req.user.id);
  res.status(200).json(campaigns);
});

export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.user.id, req.params.id);
  res.status(200).json(campaign);
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  await campaignService.deleteCampaign(req.user.id, req.params.id);
  res.status(204).send();
});
