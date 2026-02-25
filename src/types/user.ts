// --- User Types ---
export interface UserProfileResponse {
  userId?: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UserUpdateRequest {
  name?: string;
  avatarUrl?: string;
}
