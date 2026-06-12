import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPatch } from "@/lib/backendFetch";
import {
  buildItemsByCategory, replaceItems, CATEGORY_KEYS,
  type BackendPage, type BackendParam, type BackendTemplate, type BackendTemplateItem, type CategoryKey,
} from "./_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const templateId = Number(id);
  try {
    const [categories, template, items] = await Promise.all([
      backendGet<BackendPage<BackendParam>>("/org/parameters?type=template_item_category&size=100"),
      backendGet<BackendTemplate>(`/org/profile-templates/${templateId}`),
      backendGet<BackendPage<BackendTemplateItem>>(`/org/profile-template-items?template_id=${templateId}&size=100`),
    ]);

    const categoryMap = new Map(categories.items.map((p) => [p.id, p.code]));
    const req: Record<string, string[]> = { knowledge: [], tools: [], skills: [], certifications: [] };
    for (const item of items.items) {
      if (!item.is_active) continue;
      const catCode = categoryMap.get(item.category_id);
      if (catCode && catCode in req) req[catCode as keyof typeof req].push(item.name);
    }

    return NextResponse.json({ id: String(template.id), name: template.name, ...req, isActive: template.is_active });
  } catch (error) {
    const msg = String(error);
    if (msg.includes("404")) return NextResponse.json(null, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const templateId = Number(id);
  try {
    const body = (await request.json()) as {
      name?: string;
      isActive?: boolean;
    } & Partial<Record<CategoryKey, string[]>>;

    const patchPayload: Record<string, unknown> = {};
    if (body.name !== undefined) patchPayload.name = body.name;
    if (body.isActive !== undefined) patchPayload.is_active = body.isActive;

    const updatedTemplate = await backendPatch<BackendTemplate>(
      `/org/profile-templates/${templateId}`,
      patchPayload,
    );

    const hasCategories = CATEGORY_KEYS.some((c) => c in body);
    const itemsByCategory = hasCategories
      ? await replaceItems(templateId, body)
      : await buildItemsByCategory(templateId);

    return NextResponse.json({
      id: String(updatedTemplate.id),
      name: updatedTemplate.name,
      ...itemsByCategory,
      isActive: updatedTemplate.is_active,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await backendPatch(`/org/profile-templates/${Number(id)}`, { is_active: false });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
