// --- Auth Types ---
export type SocialProvider = 'google' | 'kakao';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
}
