'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { formatTimeAgoEs } from '@/shared/utils';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Clock,
  Users,
  GraduationCap,
  Briefcase,
  User,
  Shield,
  ChevronRight,
  Monitor,
} from 'lucide-react';

import { applyToVacancy } from '../api/candidateApi';
import type { CandidateVacancy } from '../types';

interface VacancyDetailPageProps {
  vacancy: CandidateVacancy;
}

const WORK_MODE_LABEL: Record<CandidateVacancy['workMode'], string> = {
  remote: 'Remoto',
  onsite: 'Presencial',
  hybrid: 'Híbrido',
};

function ConditionRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-ink-subtle shrink-0 mt-0.5" />
      <div>
        <p className="text-[12px] text-ink-subtle">{label}</p>
        <p className="text-[13px] text-ink font-medium">{value}</p>
      </div>
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 bg-surface-2 text-ink text-[12px] rounded-md">
      {label}
    </span>
  );
}

export function VacancyDetailPage({ vacancy }: VacancyDetailPageProps) {
  const [applied, setApplied] = useState(vacancy.applicationStatus === 'applied');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!salary.trim() || submitting) return;
    setSubmitting(true);
    setApplyError(null);
    try {
      await applyToVacancy(vacancy.id, Number(salary));
      setApplied(true);
    } catch {
      setApplyError('No fue posible enviar tu postulación. Por favor, intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <Link
          href={ROUTES.candidato.vacantes}
          className="flex items-center gap-1.5 text-[13px] text-primary hover:underline transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Vacantes
        </Link>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Header card */}
            <div className="bg-card rounded-xl border border-border p-5 sm:p-7">
              <h1 className="text-[22px] font-bold text-ink mb-5">{vacancy.title}</h1>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-[11px] text-ink-subtle uppercase font-semibold tracking-wide mb-3">
                  Descripción del puesto
                </h3>
                <p className="text-[14px] text-ink leading-relaxed">{vacancy.description}</p>
              </div>

              {/* Technical requirements */}
              <div className="mb-6">
                <h3 className="text-[11px] text-ink-subtle uppercase font-semibold tracking-wide mb-3">
                  Requisitos técnicos
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {vacancy.requirements.knowledge.length > 0 && (
                    <div>
                      <p className="text-[13px] text-ink-muted mb-2">Conocimientos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vacancy.requirements.knowledge.map((k) => <TagPill key={k} label={k} />)}
                      </div>
                    </div>
                  )}
                  {vacancy.requirements.tools.length > 0 && (
                    <div>
                      <p className="text-[13px] text-ink-muted mb-2">Herramientas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vacancy.requirements.tools.map((t) => <TagPill key={t} label={t} />)}
                      </div>
                    </div>
                  )}
                  {vacancy.requirements.skills.length > 0 && (
                    <div>
                      <p className="text-[13px] text-ink-muted mb-2">Habilidades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vacancy.requirements.skills.map((s) => <TagPill key={s} label={s} />)}
                      </div>
                    </div>
                  )}
                  {vacancy.requirements.certifications.length > 0 && (
                    <div>
                      <p className="text-[13px] text-ink-muted mb-2">Certificaciones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vacancy.requirements.certifications.map((c) => <TagPill key={c} label={c} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h3 className="text-[11px] text-ink-subtle uppercase font-semibold tracking-wide mb-3">
                  Condiciones
                </h3>
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <ConditionRow icon={Monitor} label="Modalidad" value={WORK_MODE_LABEL[vacancy.workMode]} />
                  <ConditionRow icon={MapPin} label="Ciudad" value={vacancy.city} />
                  <ConditionRow icon={Briefcase} label="Nivel" value={vacancy.conditions.level} />
                  <ConditionRow icon={Clock} label="Horario" value={vacancy.conditions.schedule} />
                  <ConditionRow icon={Clock} label="Experiencia mínima" value={`${vacancy.experienceYears} año${vacancy.experienceYears !== 1 ? 's' : ''}`} />
                  <ConditionRow icon={GraduationCap} label="Formación" value={vacancy.conditions.education} />
                  <ConditionRow icon={Users} label="Posiciones" value={`${vacancy.conditions.openings} disponible${vacancy.conditions.openings !== 1 ? 's' : ''}`} />
                </div>
              </div>
            </div>

          </div>

          {/* Right sidebar — stacks below content on mobile, sticky aside on desktop */}
          <div className="w-full shrink-0 lg:w-[35%] lg:sticky lg:top-6">
            <div className="bg-card rounded-xl border border-border p-6">
              {applied ? (
                <div className="text-center flex flex-col items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-[15px] font-bold text-ink">Ya postulaste a esta vacante</h3>
                  <Link
                    href={ROUTES.candidato.misPostulaciones}
                    className="w-full mt-1 h-11 bg-card border border-primary text-primary font-semibold text-[14px] rounded-lg hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
                  >
                    Ver mi postulación
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="text-[16px] font-bold text-ink mb-1">Postular a esta vacante</h3>
                  <p className="text-[13px] text-ink-subtle mb-5">Completa el campo y envía tu postulación</p>

                  <div className="bg-primary/8 rounded-lg p-3 flex items-start gap-3 mb-5">
                    <User size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-[13px] text-ink-muted">
                      Tu CV y perfil serán enviados automáticamente
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-[13px] font-semibold text-ink mb-2 uppercase tracking-wide">
                      Aspiración salarial <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle text-[14px] pointer-events-none">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value.replace(/\D/g, ''))}
                        placeholder="0"
                        className="w-full h-12 pl-8 pr-24 bg-surface-2 border-[1.5px] border-border rounded-lg text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none focus:border-primary transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle text-[14px] pointer-events-none">
                        USD / mes
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-subtle mt-1">
                      Este dato es confidencial y solo lo verá Talento Humano
                    </p>
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={!salary.trim() || submitting}
                    className="w-full h-[52px] bg-primary text-white font-bold text-[15px] rounded-lg hover:opacity-90 active:scale-[0.99] transition-all mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enviando…' : 'Postular ahora →'}
                  </button>

                  {applyError && (
                    <p className="mb-3 rounded-md bg-danger/5 px-3 py-2 text-[12px] text-danger">
                      {applyError}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2 text-[12px] text-ink-subtle mb-5">
                    <Shield size={14} />
                    Tu información está protegida
                  </div>

                  <div className="w-full h-px bg-border mb-4" />

                  <p className="text-[12px] text-ink-subtle">
                    Publicada {formatTimeAgoEs(vacancy.publishedAt)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
