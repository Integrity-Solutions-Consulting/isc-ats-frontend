import { backendGet, backendDelete, backendPost } from "@/lib/backendFetch";

export interface BackendPage<T> { items: T[]; total: number; }
export interface BackendParam { id: number; type: string; code: string; name: string; }
export interface BackendTemplate { id: number; name: string; is_active: boolean; created_at: string; }
export interface BackendTemplateItem {
  id: number; template_id: number; category_id: number; name: string; is_active: boolean;
}

export type CategoryKey = "knowledge" | "tools" | "skills" | "certifications";
export const CATEGORY_KEYS: CategoryKey[] = ["knowledge", "tools", "skills", "certifications"];

export async function buildItemsByCategory(templateId: number): Promise<Record<string, string[]>> {
  const [categories, items] = await Promise.all([
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=template_item_category&size=100"),
    backendGet<BackendPage<BackendTemplateItem>>(`/org/profile-template-items?template_id=${templateId}&size=100`),
  ]);
  const categoryMap = new Map(categories.items.map((p) => [p.id, p.code]));
  const req: Record<string, string[]> = { knowledge: [], tools: [], skills: [], certifications: [] };
  for (const item of items.items) {
    if (!item.is_active) continue;
    const catCode = categoryMap.get(item.category_id);
    if (catCode && catCode in req) req[catCode].push(item.name);
  }
  return req;
}

export async function replaceItems(
  templateId: number,
  body: Partial<Record<CategoryKey, string[]>>,
): Promise<Record<string, string[]>> {
  const [categories, existingItems] = await Promise.all([
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=template_item_category&size=100"),
    backendGet<BackendPage<BackendTemplateItem>>(`/org/profile-template-items?template_id=${templateId}&size=100`),
  ]);
  const categoryIdByCode = new Map(categories.items.map((p) => [p.code, p.id]));

  await Promise.all(
    existingItems.items
      .filter((item) => item.is_active)
      .map((item) => backendDelete(`/org/profile-template-items/${item.id}`)),
  );

  await Promise.all(
    CATEGORY_KEYS.flatMap((cat) => {
      const catId = categoryIdByCode.get(cat);
      if (!catId) return [];
      return (body[cat] ?? [])
        .filter((n) => n.trim())
        .map((n) =>
          backendPost("/org/profile-template-items", {
            template_id: templateId,
            category_id: catId,
            name: n.trim(),
          }),
        );
    }),
  );

  return Object.fromEntries(CATEGORY_KEYS.map((c) => [c, body[c] ?? []]));
}
