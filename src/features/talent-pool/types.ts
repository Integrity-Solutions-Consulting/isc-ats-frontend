export interface TalentPoolEntry {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateInitials: string;
  avatarColor: string;
  candidateAvatarFileId?: number;
  career: string;
  phone: string;
  email: string;
  vacancyId: string;
  vacancyTitle: string;
  matchPercent: number;
  savedAt: string;
  isActive: boolean;
}

export interface TalentPoolFilters {
  search: string;
  career: string | null;
  vacancyId: string | null;
  status: string;
}
