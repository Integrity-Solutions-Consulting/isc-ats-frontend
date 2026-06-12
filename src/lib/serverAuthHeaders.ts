/**
 * Returns auth headers for server-component → route-handler self-calls.
 * When called server-side, reads the access-token cookie and forwards it
 * so the route handler can authenticate against the backend.
 * Returns an empty object on the client (where cookies flow automatically).
 */
export async function serverAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') return {};
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = store.get('access-token')?.value;
  return token ? { Cookie: `access-token=${token}` } : {};
}
