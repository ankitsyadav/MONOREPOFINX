import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});
