'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Combobox } from '@/design-system/molecules/Combobox';
import { cn } from '@/shared/utils';
import type { CandidateProfile } from '../../types';
import { FieldLabel, FieldValue, FieldInput } from './fields';
import { formatBirthDate } from './formatBirthDate';

interface CatalogOption {
  id: number;
  code: string;
  name: string;
}

interface Catalogs {
  cities: CatalogOption[];
  provinces: CatalogOption[];
  educationLevels: CatalogOption[];
  careers: CatalogOption[];
  universities: CatalogOption[];
}

const EMPTY_CATALOGS: Catalogs = {
  cities: [],
  provinces: [],
  educationLevels: [],
  careers: [],
  universities: [],
};

export function PersonalInfoCard({ profile }: { profile: CandidateProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [catalogs, setCatalogs] = useState<Catalogs>(EMPTY_CATALOGS);
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    homeAddress: profile.homeAddress,
    // ID fields start empty — user re-selects if they want to change; placeholder shows current value
    cityId: '',
    provinceId: '',
    educationLevelId: '',
    careerId: '',
    universityId: '',
    isStudying: profile.isStudying,
    isWorking: profile.isWorking,
    currentCompany: profile.currentCompany ?? '',
    degreeTitle: profile.degreeTitle ?? '',
  });

  useEffect(() => {
    if (!editing) return;
    fetch('/api/catalogs/registration')
      .then((r) => r.json())
      .then((data: Catalogs) => setCatalogs(data))
      .catch(() => {});
  }, [editing]);

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/candidate/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('upload failed');
      const uploaded = await uploadRes.json() as { id: number };
      const patchRes = await fetch('/api/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: profile.id, avatarFileId: uploaded.id }),
      });
      if (!patchRes.ok) throw new Error('patch failed');
      router.refresh();
    } catch {
      // avatar upload is optional — fail silently
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  function handleCancel() {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      homeAddress: profile.homeAddress,
      cityId: '',
      provinceId: '',
      educationLevelId: '',
      careerId: '',
      universityId: '',
      isStudying: profile.isStudying,
      isWorking: profile.isWorking,
      currentCompany: profile.currentCompany ?? '',
      degreeTitle: profile.degreeTitle ?? '',
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
        isStudying: form.isStudying,
        isWorking: form.isWorking,
        currentCompany: form.isWorking ? (form.currentCompany || null) : null,
        degreeTitle: form.degreeTitle || null,
      };
      if (form.universityId) patchBody.universityId = Number(form.universityId);
      if (form.cityId) patchBody.cityId = Number(form.cityId);
      if (form.provinceId) patchBody.provinceId = Number(form.provinceId);
      if (form.educationLevelId) patchBody.educationLevelId = Number(form.educationLevelId);
      if (form.careerId) patchBody.careerId = Number(form.careerId);

      const res = await fetch('/api/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Error al guardar los cambios');
      }
      router.refresh();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative shrink-0">
          {profile.avatarFileId ? (
            <img
              src={`/api/candidate/cv/${profile.avatarFileId}?view=1`}
              alt="Foto de perfil"
              className="w-[60px] h-[60px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[60px] h-[60px] bg-primary-700 rounded-full flex items-center justify-center text-white text-[20px] font-bold select-none">
              {initials}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            aria-label="Cambiar foto"
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-5 h-5 bg-white border border-primary-200 rounded-full flex items-center justify-center hover:bg-surface-2 transition-colors disabled:opacity-50"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-2.5 border-b border-surface-2">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-2.5 border-b border-surface-2">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-2.5 border-b border-surface-2">
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

        {/* Row 4: Ciudad y Provincia — combined in view mode, split selects in edit mode */}
        {editing ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-2.5 border-b border-surface-2">
            <div>
              <FieldLabel htmlFor="edit-city">Ciudad</FieldLabel>
              <Combobox
                id="edit-city"
                valueKey="id"
                placeholder={profile.city || 'Selecciona tu ciudad'}
                value={form.cityId}
                onChange={(val) => setForm((f) => ({ ...f, cityId: val }))}
                options={catalogs.cities.map((c) => ({ id: String(c.id), label: c.name }))}
              />
            </div>
            <div>
              <FieldLabel htmlFor="edit-province">Provincia</FieldLabel>
              <Combobox
                id="edit-province"
                valueKey="id"
                placeholder={profile.province || 'Selecciona tu provincia'}
                value={form.provinceId}
                onChange={(val) => setForm((f) => ({ ...f, provinceId: val }))}
                options={catalogs.provinces.map((p) => ({ id: String(p.id), label: p.name }))}
              />
            </div>
          </div>
        ) : (
          <div className="pb-2.5 border-b border-surface-2">
            <FieldLabel>Ciudad y provincia</FieldLabel>
            <FieldValue>
              {profile.city && profile.province
                ? `${profile.city}, ${profile.province}`
                : profile.city || profile.province || '—'}
            </FieldValue>
          </div>
        )}

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-2.5 border-b border-surface-2">
            <div>
              <FieldLabel htmlFor={editing ? 'edit-educationLevel' : undefined}>Nivel de educación</FieldLabel>
              {editing ? (
                <Combobox
                  id="edit-educationLevel"
                  valueKey="id"
                  placeholder={profile.educationLevel || 'Selecciona el nivel'}
                  value={form.educationLevelId}
                  onChange={(val) => setForm((f) => ({ ...f, educationLevelId: val }))}
                  options={catalogs.educationLevels.map((el) => ({ id: String(el.id), label: el.name }))}
                />
              ) : (
                <FieldValue>{profile.educationLevel || '—'}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel htmlFor={editing ? 'edit-career' : undefined}>Carrera</FieldLabel>
              {editing ? (
                <Combobox
                  id="edit-career"
                  valueKey="id"
                  placeholder={profile.career || 'Selecciona la carrera'}
                  value={form.careerId}
                  onChange={(val) => setForm((f) => ({ ...f, careerId: val }))}
                  options={catalogs.careers.map((c) => ({ id: String(c.id), label: c.name }))}
                />
              ) : (
                <FieldValue>{profile.career || '—'}</FieldValue>
              )}
            </div>
          </div>

          {/* Row 5c: Título obtenido */}
          <div className="pb-2.5 border-b border-surface-2">
            <FieldLabel htmlFor={editing ? 'edit-degreeTitle' : undefined}>Título obtenido</FieldLabel>
            {editing ? (
              <FieldInput
                id="edit-degreeTitle"
                value={form.degreeTitle}
                onChange={(v) => setForm((f) => ({ ...f, degreeTitle: v }))}
              />
            ) : (
              <FieldValue>{profile.degreeTitle || '—'}</FieldValue>
            )}
          </div>

          {/* Row 5b: Universidad */}
          <div className="pb-2.5 border-b border-surface-2">
            <FieldLabel htmlFor={editing ? 'edit-university' : undefined}>Universidad</FieldLabel>
            {editing ? (
              <Combobox
                id="edit-university"
                valueKey="id"
                placeholder={profile.university || 'Selecciona tu universidad'}
                value={form.universityId}
                onChange={(val) => setForm((f) => ({ ...f, universityId: val }))}
                options={catalogs.universities.map((u) => ({ id: String(u.id), label: u.name }))}
              />
            ) : (
              <FieldValue>{profile.university || '—'}</FieldValue>
            )}
          </div>

          {/* Row 6: ¿Estudia? | ¿Trabaja? */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-2.5 border-b border-surface-2">
            <div>
              <FieldLabel>¿Estudia?</FieldLabel>
              {editing ? (
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isStudying: true }))}
                    className={cn(
                      'h-7 px-3 text-xs font-medium rounded-full border transition-colors',
                      form.isStudying
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-ink-muted border-primary-200 hover:bg-surface-2',
                    )}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isStudying: false }))}
                    className={cn(
                      'h-7 px-3 text-xs font-medium rounded-full border transition-colors',
                      !form.isStudying
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-ink-muted border-primary-200 hover:bg-surface-2',
                    )}
                  >
                    No
                  </button>
                </div>
              ) : (
                <FieldValue>{profile.isStudying ? 'Sí, actualmente' : 'No'}</FieldValue>
              )}
            </div>
            <div>
              <FieldLabel>¿Trabaja?</FieldLabel>
              {editing ? (
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isWorking: true }))}
                    className={cn(
                      'h-7 px-3 text-xs font-medium rounded-full border transition-colors',
                      form.isWorking
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-ink-muted border-primary-200 hover:bg-surface-2',
                    )}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isWorking: false }))}
                    className={cn(
                      'h-7 px-3 text-xs font-medium rounded-full border transition-colors',
                      !form.isWorking
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-ink-muted border-primary-200 hover:bg-surface-2',
                    )}
                  >
                    No
                  </button>
                </div>
              ) : (
                <FieldValue>{profile.isWorking ? 'Sí, actualmente' : 'No'}</FieldValue>
              )}
            </div>
          </div>

          {/* Row 7: Empresa actual (conditional on isWorking) */}
          {(editing ? form.isWorking : profile.isWorking) && (
            <div>
              <FieldLabel htmlFor={editing ? 'edit-currentCompany' : undefined}>Empresa actual</FieldLabel>
              {editing ? (
                <FieldInput
                  id="edit-currentCompany"
                  value={form.currentCompany}
                  onChange={(v) => setForm((f) => ({ ...f, currentCompany: v }))}
                />
              ) : (
                <FieldValue>{profile.currentCompany || '—'}</FieldValue>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
