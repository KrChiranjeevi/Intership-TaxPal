// src/modules/users/users.model.ts

export interface RegisterDto {
  name: string;
  username?: string;
  email: string;
  password: string;
  country?: string | null;
  incomeBracket?: string | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RequestPasswordResetDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  newPassword: string;
  token: string;
}

export interface UpdateUserProfileDto {
  name?: string;
  username?: string;
  country?: string | null;
  incomeBracket?: string | null;
  phone?: string | null;
  currency?: string | null;
  timezone?: string | null;
  language?: string | null;
  theme?: string | null;
  avatarUrl?: string | null;
  taxRegion?: string | null;
  twoFactorEnabled?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
