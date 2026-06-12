export type UserStatus = 'active' | 'inactive';

export interface PortalUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: UserStatus;
  lastAccessAt: string | null;
  createdAt: string;
}
