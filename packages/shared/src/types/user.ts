export enum UserRole {
  CLIENT = 'CLIENT',
  ADVISOR = 'ADVISOR',
  ADMIN = 'ADMIN',
}

export enum UserType {
  PRIVATE = 'PRIVATE',
  FREELANCER = 'FREELANCER',
  SME = 'SME',
  CORPORATE = 'CORPORATE',
}

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  userType?: UserType;
  firstName: string;
  lastName: string;
  phone?: string;
  language: string;
  timezone: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: KycStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: UserRole;
  userType?: UserType;
  firstName: string;
  lastName: string;
  phone?: string;
  language?: string;
  timezone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  language?: string;
  timezone?: string;
  avatarUrl?: string;
}
