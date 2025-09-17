export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  country?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
