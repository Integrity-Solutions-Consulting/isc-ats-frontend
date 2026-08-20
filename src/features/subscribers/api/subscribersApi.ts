interface SubscriberCountResponse {
  count: number;
}

/** Number of candidates currently subscribed to marketing communications. */
export async function fetchSubscriberCount(): Promise<number> {
  const res = await fetch('/api/auth/subscribers', { cache: 'no-store' });
  if (!res.ok) throw new Error('No fue posible obtener el número de suscriptores.');
  const data = (await res.json()) as SubscriberCountResponse;
  return data.count;
}
