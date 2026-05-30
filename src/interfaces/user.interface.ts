export type UserRole = 'REPORTER' | 'EDITOR';

export interface UserRow {
  id: number;
  name: string;
  role: UserRole;
  city: string;
  is_available: boolean;
  created_at: Date;
}

export interface CreateUser {
  name: string;
  role: UserRole;
  city: string;
}

export interface UserDropdown {
  id: number;
  name: string;
  city: string;
  is_available: boolean;
}