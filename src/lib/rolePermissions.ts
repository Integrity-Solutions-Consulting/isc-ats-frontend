import { backendGet } from "@/lib/backendFetch";

/** Maps frontend permission keys to backend permission codes. */
export const FRONTEND_TO_BACKEND: Record<string, string> = {
  "vacancies.view": "recruitment.vacancies.read",
  "vacancies.create": "recruitment.vacancies.create",
  "vacancies.edit": "recruitment.vacancies.update",
  "vacancies.delete": "recruitment.vacancies.delete",
  "vacancies.publish": "recruitment.vacancies.update",
  "candidates.view": "recruitment.candidates.read",
  "candidates.move": "recruitment.applications.update",
  "candidates.notes": "recruitment.application_notes.create",
  "candidates.reject": "recruitment.applications.update",
  "talent.view": "talent.talent_pool.read",
  "talent.add": "talent.talent_pool.create",
  "talent.remove": "talent.talent_pool.delete",
  "processes.view": "org.processes.read",
  "processes.create": "org.processes.create",
  "processes.edit": "org.processes.update",
  "processes.delete": "org.processes.delete",
  "reports.view": "recruitment.vacancies.read",
  "users.view": "auth.users.read",
  "users.create": "auth.users.create",
  "users.edit": "auth.users.update",
  "users.delete": "auth.users.delete",
  "roles.manage": "auth.roles.update",
  "config.manage": "org.parameters.update",
};

export const BACKEND_TO_FRONTEND: Record<string, string[]> = {};
for (const [fe, be] of Object.entries(FRONTEND_TO_BACKEND)) {
  if (!BACKEND_TO_FRONTEND[be]) {
    BACKEND_TO_FRONTEND[be] = [];
  }
  BACKEND_TO_FRONTEND[be].push(fe);
}

interface BackendUserPage {
  items: { id: number; roles: string[] }[];
  total: number;
}

/** Count of users assigned to each role, keyed by role name. */
export async function getRoleUserCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const usersData = await backendGet<BackendUserPage>("/auth/users?size=100");
    for (const user of usersData.items) {
      for (const roleName of user.roles) {
        counts.set(roleName, (counts.get(roleName) ?? 0) + 1);
      }
    }
  } catch {}
  return counts;
}
