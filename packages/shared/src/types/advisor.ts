export enum AdvisorType {
  LAWYER = 'LAWYER',
  TAX_ADVISOR = 'TAX_ADVISOR',
  DUAL = 'DUAL',
}

export enum VerificationLevel {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENHANCED = 'ENHANCED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface Advisor {
  id: string;
  userId: string;
  advisorType: AdvisorType;
  specializations: string[];
  languages: string[];
  licenseNumber?: string;
  barAssociation?: string;
  yearsExperience?: number;
  bio?: string;
  hourlyRate?: number;
  verificationLevel: VerificationLevel;
  verificationStatus: VerificationStatus;
  verificationDocuments: VerificationDocument[];
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  responseTimeMinutes: number;
  acceptanceRate: number;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationDocument {
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface CreateAdvisorDto {
  advisorType: AdvisorType;
  specializations: string[];
  languages: string[];
  licenseNumber?: string;
  barAssociation?: string;
  yearsExperience?: number;
  bio?: string;
  hourlyRate?: number;
}

export interface UpdateAdvisorDto {
  specializations?: string[];
  languages?: string[];
  bio?: string;
  hourlyRate?: number;
  active?: boolean;
}
