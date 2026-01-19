import { httpClient } from '../api/http.client';
import { UserProfile, UpdateProfileData } from './profile.types';

export class ProfileService {
  private baseUrl = '/api/v1/profile';

  async getProfile(): Promise<UserProfile> {
    return httpClient.get<UserProfile>(this.baseUrl);
  }

  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: Partial<UserProfile> }> {
    return httpClient.patch<{ message: string; user: Partial<UserProfile> }>(this.baseUrl, data);
  }
}
