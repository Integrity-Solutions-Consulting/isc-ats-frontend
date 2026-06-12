export interface ProfileTemplateRecord {
  id: string;
  name: string;
  knowledge: string[];
  tools: string[];
  skills: string[];
  certifications: string[];
  isActive?: boolean;
}

export const MOCK_TEMPLATES: ProfileTemplateRecord[] = [];
