// src/modules/security/security.service.ts
import * as securityModel from './security.model.js';

// -------------------------
// SERVICE FUNCTIONS
// -------------------------

export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  return await securityModel.changePassword(userId, oldPassword, newPassword);
};

export const toggleTwoFactorAuth = async (userId: string, enabled: boolean) => {
  return await securityModel.toggleTwoFactorAuth(userId, enabled);
};
