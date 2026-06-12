import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { backendGet, backendPatch } from "@/lib/backendFetch";
import { decodeUserId } from "@/lib/decodeUserId";
import type { Notification } from "@/features/notifications/types";

interface BackendNotification {
  id: number;
  recipient_id: number;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}
interface BackendPage<T> {
  items: T[];
  total: number;
}

async function currentUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get("access-token")?.value;
  return token ? decodeUserId(token) : null;
}

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json([], { status: 401 });

    const data = await backendGet<BackendPage<BackendNotification>>(
      `/comms/notifications?recipient_id=${userId}&size=50`,
    );

    const notifications: Notification[] = data.items.map((n) => ({
      id: String(n.id),
      title: n.title,
      body: n.body ?? "",
      read: n.read_at !== null,
      createdAt: n.created_at,
    }));

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/** Mark all of the current user's unread notifications as read. */
export async function PATCH() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const unread = await backendGet<BackendPage<BackendNotification>>(
      `/comms/notifications?recipient_id=${userId}&unread_only=true&size=100`,
    );

    await Promise.all(
      unread.items.map((n) => backendPatch(`/comms/notifications/${n.id}/read`, {})),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
