import prisma from '../../config/prisma.js';
import { encrypt, decrypt } from '../../utils/crypto.js';
import { AppError } from '../../middleware/error.middleware.js';

export const upsertCredential = async (userId, { wabaId, phoneNumberId, accessToken }) => {
  const updateData = { wabaId, phoneNumberId };
  if (accessToken) updateData.encryptedAccessToken = encrypt(accessToken);

  const existing = await prisma.credential.findUnique({ where: { userId } });
  if (!existing && !accessToken) throw new AppError('Access token is required for initial setup', 400);
  if (!existing) updateData.encryptedAccessToken = encrypt(accessToken);

  const credential = await prisma.credential.upsert({
    where: { userId },
    create: { userId, wabaId, phoneNumberId, encryptedAccessToken: encrypt(accessToken) },
    update: updateData,
    select: { id: true, wabaId: true, phoneNumberId: true, createdAt: true, updatedAt: true },
  });
  return credential;
};

export const getCredential = async (userId) => {
  const credential = await prisma.credential.findUnique({
    where: { userId },
    select: { id: true, wabaId: true, phoneNumberId: true, createdAt: true, updatedAt: true },
  });
  if (!credential) throw new AppError('Credentials not found', 404);
  return credential;
};

export const getDecryptedCredential = async (userId) => {
  const credential = await prisma.credential.findUnique({ where: { userId } });
  if (!credential) throw new AppError('Credentials not found', 404);
  return {
    ...credential,
    accessToken: decrypt(credential.encryptedAccessToken),
  };
};
