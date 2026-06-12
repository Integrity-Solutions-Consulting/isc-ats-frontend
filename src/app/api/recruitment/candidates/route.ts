import { NextResponse } from "next/server";

import { backendGet } from "@/lib/backendFetch";
import type { Candidate } from "@/features/candidates/types";

interface BackendCandidate {
  id: number; user_id: number; email: string;
  first_name: string; last_name: string;
  cedula: string | null; birth_date: string | null; phone: string | null;
  city: string | null; province: string | null;
  education_level: string | null; career: string | null;
  is_studying: boolean; is_working: boolean; current_company: string | null;
  cv_file_id: number | null; avatar_file_id: number | null;
  is_active: boolean; created_at: string;
}

const AVATAR_COLORS = [
  "bg-primary-600", "bg-accent-500", "bg-primary-400",
  "bg-primary-700", "bg-accent-600", "bg-primary-300",
  "bg-accent-400", "bg-primary-500",
];

function mapCandidate(c: BackendCandidate): Candidate {
  const initials = (c.first_name[0] + (c.last_name[0] ?? "")).toUpperCase();
  return {
    id: String(c.id),
    fullName: `${c.first_name} ${c.last_name}`,
    initials,
    avatarColor: AVATAR_COLORS[c.id % AVATAR_COLORS.length],
    nationalId: c.cedula ?? "",
    dateOfBirth: c.birth_date ?? "",
    email: c.email,
    phone: c.phone ?? "",
    city: c.city ?? "",
    province: c.province ?? "",
    educationLevel: c.education_level ?? "",
    degree: c.career ?? "",
    currentlyStudying: c.is_studying,
    currentlyEmployed: c.is_working,
    currentEmployer: c.current_company,
    isActive: c.is_active,
    cv: {
      fileId: c.cv_file_id ? String(c.cv_file_id) : null,
      fileName: c.cv_file_id ? "Hoja de vida (PDF)" : "",
      uploadedAt: c.created_at,
      pageCount: 0,
      fileSizeKB: 0,
      url: c.cv_file_id ? `/api/candidate/cv/${c.cv_file_id}` : "#",
    },
  };
}

export async function GET() {
  try {
    const data = await backendGet<{ items: BackendCandidate[] }>(
      "/recruitment/candidates/expanded?size=100",
    );
    return NextResponse.json(data.items.map(mapCandidate));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
