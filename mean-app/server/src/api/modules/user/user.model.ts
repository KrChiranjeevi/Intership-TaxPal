// src/modules/users/users.model.ts

export interface RegisterDto {
  name: string;
  username?: string; // optional if you want
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
