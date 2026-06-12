'use client';

import { useEffect, useState } from 'react';
import { Camera, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CandidateProfile } from '../../types';
import { FieldLabel, FieldValue, FieldInput, StatusPill } from './fields';
import { formatBirthDate } from './formatBirthDate';

interface UniversityOption {
  id: number;
  code: string;
  name: string;
}

export function PersonalInfoCard({ profile }: { profile: CandidateProfile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    homeAddress: profile.homeAddress,
    // universityName is display-only; universityId drives the select
    universityId: '',   // we don't have the id from the resolved name — user re-selects
  });

  useEffect(() => {
    if (!editing) return;
    fetch('/api/catalogs/registration')
      .then((r) => r.json())
      .then((data: { universities?: UniversityOption[] }) => {
        if (data.universities) setUniversities(data.universities);
      })
      .catch(() => {});
  }, [editing]);

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  function handleCancel() {
    // Reset form to current profile values and exit edit mode
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      homeAddress: profile.homeAddress,
      universityId: '',
    });
    setSaveError(null);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const patchBody: Record<string, unknown> = {
        candidateId: profile.id,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        homeAddress: form.homeAddress || null,
      };
      if (form.universityId) {
        patchBody.universityId = Number(form.universityId);
      }
      const res = await fetch('/api/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Error al guardar los cambios');
      }
      // Re-run the server component fetch so displayed data is fresh
      router.refresh();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-primary-200 p-6">

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative shrink-0">
          <div className="w-[60px] h-[60px] bg-primary-700 rounded-full flex items-center justify-center text-white text-[20px] font-bold select-none">
            {initials}
          </div>
          <button
            type="button"
            aria-label="Cambiar foto"
            className="absolute bottom-0 right-0 w-5 h-5 bg-white border border-primary-200 rounded-full flex items-center justify-center hover:bg-surface-2 transition-colors"
          >
            <Camera className="w-3 h-3 text-ink-muted" />
          </button>
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-primary-800">
            {profile.firstName} {profile.lastName}
          </h2>
        </div>
      </div>

      {/* Thin divider */}
      <div className="w-full h-px bg-surface-2 mb-3" />

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-primary-800">Información personal</h3>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-primary-700 text-[13px] font-medium hover:text-primary-600 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="h-8 px-3 bg-white border border-primary-200 text-ink-muted font-medium text-[13px] rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-3 bg-primary-700 text-white font-semibold text-[13px] rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Inline save error */}
      {saveError && (
        <p className="text-sm text-danger mb-3">{saveError}</p>
      )}

      {/* Fields */}
      <div className="space-y-2.5">

        {/* Row 1: Nombres | Apellidos */}
        <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-surface-2">
          <div>
            <FieldLabel htmlFor={editing ? 'edit-firstName' : undefined}>Nombres</FieldLabel>
            {editing
              ? <FieldInput id="edit-firstName" value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} />
              : <FieldValue>{profile.firstName}</FieldValue>
            }
          </div>
          <div>
            <FieldLabel htmlFor={editing ? 'edit-lastName' : undefined}>Apellidos</FieldLabel>
            {editing
              ? <FieldInput id="edit-lastName" value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} />
              : <FieldValue>{profile.lastName}</FieldValue>
            }
          </div>
        </div>

        {/* Row 2: Cédula (read-only) | Fecha de nacimiento (read-only) */}
        <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-surface-2">
          <div>
            <FieldLabel>Cédula</FieldLabel>
            <FieldValue>{profile.idNumber}</FieldValue>
          </div>
          <div>
            <FieldLabel>Fecha de nacimiento</FieldLabel>
            <FieldValue>{formatBirthDate(profile.birthDate)}</FieldValue>
          </div>
        </div>

        {/* Row 3: Celular | Correo (email always read-only — login identity) */}
        <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-surface-2">
          <div>
            <FieldLabel htmlFor={editing ? 'edit-phone' : undefined}>Celular</FieldLabel>
            {editing
              ? <FieldInput id="edit-phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              : <FieldValue>{profile.phone}</FieldValue>
            }
          </div>
          <div>
            <FieldLabel>Correo</FieldLabel>
            <FieldValue>{profile.email}</FieldValue>
          </div>
        </div>

        {/* Row 4: Ciudad y provincia (read-only, full width) */}
        <div className="pb-2.5 border-b border-surface-2">
          <FieldLabel>Ciudad y provincia</FieldLabel>
          <FieldValue>{profile.city}, {profile.province}</FieldValue>
        </div>

        {/* Row 4b: Dirección domiciliaria */}
        <div className="pb-2.5 border-b border-surface-2">
          <FieldLabel htmlFor={editing ? 'edit-homeAddress' : undefined}>
            Dirección domiciliaria
          </FieldLabel>
          {editing
            ? <FieldInput
                id="edit-homeAddress"
                value={form.homeAddress}
                onChange={(v) => setForm((f) => ({ ...f, homeAddress: v }))}
              />
            : <FieldValue>{profile.homeAddress || '—'}</FieldValue>
          }
        </div>

        {/* Education & situation subsection */}
        <div className="pt-3">
          <h4 className="text-[13px] font-semibold text-primary-800 mb-2.5">
            Educación y situación
          </h4>

          {/* Row 5: Nivel de educación | Carrera */}
          <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-surface-2">
            <div>
              <FieldLabel>Nivel de educación</FieldLabel>
              <FieldValue>{profile.educationLevel}</FieldValue>
            </div>
            <div>
              <FieldLabel>Carrera</FieldLabel>
              <FieldValue>{profile.career}</FieldValue>
            </div>
          </div>

          {/* Row 5b: Universidad */}
          <div className="pb-2.5 border-b border-surface-2">
            <FieldLabel htmlFor={editing ? 'edit-university' : undefined}>Universidad</FieldLabel>
            {editing ? (
              <select
                id="edit-university"
                value={form.universityId}
                onChange={(e) => setForm((f) => ({ ...f, universityId: e.target.value }))}
                className="w-full h-9 px-3 bg-white border border-primary-200 rounded-lg text-[14px] focus:outline-none focus:border-primary-700 transition-all"
              >
                <option value="">
                  {profile.university ? `(actual: ${profile.university})` : 'Selecciona tu universidad'}
                </option>
                {universities.map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.name}</option>
                ))}
              </select>
            ) : (
              <FieldValue>{profile.university || '—'}</FieldValue>
            )}
          </div>

          {/* Row 6: ¿Estudia? | ¿Trabaja? */}
          <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-surface-2">
            <div>
              <FieldLabel>¿Estudia?</FieldLabel>
              <StatusPill active={profile.isStudying} labelYes="Sí, actualmente" labelNo="No" />
            </div>
            <div>
              <FieldLabel>¿Trabaja?</FieldLabel>
              <StatusPill active={profile.isWorking} labelYes="Sí, actualmente" labelNo="No" />
            </div>
          </div>

          {/* Row 7: Empresa actual (only if working) */}
          {profile.isWorking && profile.currentCompany && (
            <div>
              <FieldLabel>Empresa actual</FieldLabel>
              <FieldValue>{profile.currentCompany}</FieldValue>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
