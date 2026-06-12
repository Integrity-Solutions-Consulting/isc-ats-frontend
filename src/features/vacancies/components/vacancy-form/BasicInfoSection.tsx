"use client";

import { useEffect } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";

import { Combobox } from "@/design-system/atoms/Combobox";
import { Select } from "@/design-system/atoms/Select";
import { useVacancyCatalogs, useContactsByClient } from "../../hooks/useVacancies";
import type { VacancyFormValues } from "../../types";
import { Section, RequiredLabel } from "./FormSection";

export function BasicInfoSection() {
  const { data: catalogs } = useVacancyCatalogs();
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<VacancyFormValues>();

  const selectedClient = useWatch({ name: "clientCompany" });
  const { data: contacts = [] } = useContactsByClient(selectedClient ?? "");

  useEffect(() => {
    setValue("contact", "");
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
                className="mt-1.5"
                options={catalogs?.vacancyNames ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecciona o escribe un cargo"
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
          <Select
            id="clientCompany"
            className="mt-1.5"
            aria-invalid={!!errors.clientCompany}
            {...register("clientCompany")}
          >
            <option value="">Selecciona…</option>
            {catalogs?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          {errors.clientCompany && (
            <p className="mt-1 text-xs text-danger">
              {errors.clientCompany.message}
            </p>
          )}
        </div>

        <div>
          <RequiredLabel htmlFor="contact">Persona de contacto</RequiredLabel>
          <Select
            id="contact"
            className="mt-1.5"
            aria-invalid={!!errors.contact}
            disabled={!selectedClient}
            {...register("contact")}
          >
            <option value="">
              {selectedClient ? "Selecciona…" : "Selecciona un cliente primero"}
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          {errors.contact && (
            <p className="mt-1 text-xs text-danger">{errors.contact.message}</p>
          )}
        </div>

        <div>
          <RequiredLabel htmlFor="department">Departamento</RequiredLabel>
          <Select
            id="department"
            className="mt-1.5"
            aria-invalid={!!errors.department}
            {...register("department")}
          >
            <option value="">Selecciona…</option>
            {catalogs?.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
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
