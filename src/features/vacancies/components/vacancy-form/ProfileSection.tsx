"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { Label } from "@/design-system/ui/label";
import { Combobox } from "@/design-system/molecules/Combobox";
import { TagInput } from "@/design-system/molecules/TagInput";
import { listTemplates } from "@/features/profile-templates/api/profileTemplatesApi";
import type { ProfileTemplateRecord } from "@/features/profile-templates/api/mockData";
import type { VacancyFormValues } from "../../types";
import { Section } from "./FormSection";

export function ProfileSection() {
  const { setValue, watch } = useFormContext<VacancyFormValues>();

  const requirements = watch("requirements");
  const [appliedTemplate, setAppliedTemplate] = useState<ProfileTemplateRecord | null>(null);

  const { data: allTemplates = [] } = useQuery({
    queryKey: ["profile-templates"],
    queryFn: listTemplates,
    // Fresh on open so a template created in its own screen is selectable here.
    staleTime: 0,
  });

  const filteredTemplates = allTemplates.filter((t) => t.isActive !== false);

  function applyTemplate(templateId: string) {
    const tpl = allTemplates.find((t) => t.id === templateId);
    if (!tpl) {
      setAppliedTemplate(null);
      return;
    }
    setValue("requirements", {
      knowledge: tpl.knowledge,
      tools: tpl.tools,
      skills: tpl.skills,
      certifications: tpl.certifications,
    });
    setAppliedTemplate(tpl);
  }

  return (
    <Section num={4} title="Perfil requerido">
      <div className="mb-4">
        <Label htmlFor="profileTemplate">Cargar desde plantilla</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Combobox
            id="profileTemplate"
            className="flex-1"            valueKey="id"
            options={filteredTemplates.map((t) => ({ id: t.id, label: t.name }))}
            value={appliedTemplate?.id ?? ""}
            onChange={applyTemplate}
            placeholder="Seleccionar plantilla…"
          />
          {appliedTemplate && (
            <span className="shrink-0 rounded-md bg-primary-50 px-2.5 py-1.5 text-xs text-primary-700">
              Cargado: {appliedTemplate.name}
            </span>
          )}
        </div>
        {filteredTemplates.length === 0 && (
          <p className="mt-1 text-xs text-ink-subtle">
            No hay plantillas creadas aún.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Conocimientos</Label>
          <TagInput
            className="mt-1.5"
            value={requirements.knowledge}
            onChange={(tags) =>
              setValue("requirements", { ...requirements, knowledge: tags })
            }
            placeholder="+ agregar conocimiento…"
          />
        </div>
        <div>
          <Label>Herramientas</Label>
          <TagInput
            className="mt-1.5"
            value={requirements.tools}
            onChange={(tags) =>
              setValue("requirements", { ...requirements, tools: tags })
            }
            placeholder="+ herramienta…"
          />
        </div>
        <div>
          <Label>Habilidades</Label>
          <TagInput
            className="mt-1.5"
            value={requirements.skills}
            onChange={(tags) =>
              setValue("requirements", { ...requirements, skills: tags })
            }
            placeholder="+ habilidad…"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Certificaciones</Label>
          <TagInput
            className="mt-1.5"
            value={requirements.certifications}
            onChange={(tags) =>
              setValue("requirements", { ...requirements, certifications: tags })
            }
            placeholder="+ certificación…"
          />
        </div>
      </div>
    </Section>
  );
}
