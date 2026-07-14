"use client";

import { useEffect, useRef } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";

import { Combobox } from "@/design-system/molecules/Combobox";
import { useVacancyCatalogs, useContactsByClient } from "../../hooks/useVacancies";
import type { VacancyFormValues } from "../../types";
import { Section, RequiredLabel } from "./FormSection";

interface BasicInfoSectionProps {
  readOnly?: boolean;
}

export function BasicInfoSection({ readOnly = false }: BasicInfoSectionProps) {
  const { data: catalogs } = useVacancyCatalogs();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<VacancyFormValues>();

  const selectedClient = useWatch({ name: "clientCompany" });
  const { data: contacts = [] } = useContactsByClient(selectedClient ?? "");

  const prevClient = useRef<string | undefined>(undefined);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      if (selectedClient) {
        isFirst.current = false;
        prevClient.current = selectedClient;
      }
      return;
    }
    
    if (prevClient.current !== undefined && prevClient.current !== selectedClient) {
      setValue("contact", "");
    }
    prevClient.current = selectedClient;
  }, [selectedClient, setValue]);

  return (
    <Section num={1} title="Información básica">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="position">Nombre del cargo</RequiredLabel>
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <Combobox
                id="position"
                className="mt-1.5"                options={catalogs?.vacancyNames ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecciona o escribe un cargo"
                disabled={readOnly}
                aria-invalid={!!errors.position}
              />
            )}
          />
          {errors.position && (
            <p className="mt-1 text-xs text-danger">{errors.position.message}</p>
          )}
        </div>

        <div>
          <RequiredLabel htmlFor="clientCompany">Cliente</RequiredLabel>
          <Controller
            name="clientCompany"
            control={control}
            render={({ field }) => (
              <Combobox
                id="clientCompany"
                className="mt-1.5"                valueKey="id"
                options={catalogs?.clients ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecciona…"
                disabled={readOnly}
                aria-invalid={!!errors.clientCompany}
              />
            )}
          />
          {errors.clientCompany && (
            <p className="mt-1 text-xs text-danger">
              {errors.clientCompany.message}
            </p>
          )}
        </div>

        <div>
          <RequiredLabel htmlFor="contact">Persona de contacto</RequiredLabel>
          <Controller
            name="contact"
            control={control}
            render={({ field }) => (
              <Combobox
                id="contact"
                className="mt-1.5"                valueKey="id"
                options={contacts}
                value={field.value}
                onChange={field.onChange}
                placeholder={selectedClient ? "Selecciona…" : "Selecciona un cliente primero"}
                disabled={readOnly || !selectedClient}
                aria-invalid={!!errors.contact}
              />
            )}
          />
          {errors.contact && (
            <p className="mt-1 text-xs text-danger">{errors.contact.message}</p>
          )}
        </div>

        <div>
          <RequiredLabel htmlFor="department">Departamento</RequiredLabel>
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Combobox
                id="department"
                className="mt-1.5"                valueKey="id"
                options={catalogs?.departments ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecciona…"
                disabled={readOnly}
                aria-invalid={!!errors.department}
              />
            )}
          />
          {errors.department && (
            <p className="mt-1 text-xs text-danger">
              {errors.department.message}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
