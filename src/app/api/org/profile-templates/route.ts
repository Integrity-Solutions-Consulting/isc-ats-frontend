import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost } from "@/lib/backendFetch";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendParam {
  id: number;
  type: string;
  code: string;
  name: string;
}
interface BackendTemplate {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}
interface BackendTemplateItem {
  id: number;
  template_id: number;
  category_id: number;
  name: string;
  is_active: boolean;
}

export async function GET() {
  try {
    const [categories, templates, items] = await Promise.all([
      backendGet<BackendPage<BackendParam>>("/org/parameters?type=template_item_category&size=100"),
      backendGet<BackendPage<BackendTemplate>>("/org/profile-templates?size=100"),
      backendGet<BackendPage<BackendTemplateItem>>("/org/profile-template-items?size=1000"),
    ]);

    const categoryMap = new Map(categories.items.map((p) => [p.id, p.code]));

    const itemsByTemplate = new Map<number, Record<string, string[]>>();
    for (const item of items.items) {
      if (!item.is_active) continue;
      const catCode = categoryMap.get(item.category_id);
      if (!catCode) continue;

      if (!itemsByTemplate.has(item.template_id)) {
        itemsByTemplate.set(item.template_id, {
          knowledge: [],
          tools: [],
          skills: [],
          certifications: [],
        });
      }
      const record = itemsByTemplate.get(item.template_id)!;
      if (catCode in record) {
        record[catCode].push(item.name);
      }
    }

    const records = templates.items.map((t) => {
      const req = itemsByTemplate.get(t.id) ?? {
        knowledge: [],
        tools: [],
        skills: [],
        certifications: [],
      };
      return {
        id: String(t.id),
        name: t.name,
        knowledge: req.knowledge,
        tools: req.tools,
        skills: req.skills,
        certifications: req.certifications,
        isActive: t.is_active,
      };
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      knowledge: string[];
      tools: string[];
      skills: string[];
      certifications: string[];
    };

    const categories = await backendGet<BackendPage<BackendParam>>(
      "/org/parameters?type=template_item_category&size=100",
    );

    const createdTemplate = await backendPost<BackendTemplate>("/org/profile-templates", {
      name: body.name,
    });

    const categoryIdByCode = new Map(categories.items.map((p) => [p.code, p.id]));
    const itemPromises: Promise<any>[] = [];
    const categoriesList = ["knowledge", "tools", "skills", "certifications"] as const;

    for (const cat of categoriesList) {
      const categoryId = categoryIdByCode.get(cat);
      if (!categoryId) continue;
      for (const itemName of body[cat] ?? []) {
        itemPromises.push(
          backendPost("/org/profile-template-items", {
            template_id: createdTemplate.id,
            category_id: categoryId,
            name: itemName,
          }),
        );
      }
    }

    await Promise.all(itemPromises);

    return NextResponse.json(
      {
        id: String(createdTemplate.id),
        name: createdTemplate.name,
        knowledge: body.knowledge,
        tools: body.tools,
        skills: body.skills,
        certifications: body.certifications,
        isActive: createdTemplate.is_active,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
