'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/constants/routes';
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
  LogIn,
  Monitor,
} from 'lucide-react';

import type { CandidateVacancy } from '@/features/candidate-portal/types';
import { applyToVacancy } from '@/features/candidate-portal/api/candidateApi';

interface PublicVacancyDetailPageProps {
  vacancy: CandidateVacancy;
  /** True when the visitor has an active session (access-token cookie present). */
  isAuthenticated: boolean;
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
        <p className="text-[13px] text-primary-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 bg-surface-2 text-primary-800 text-[12px] rounded-md">
      {label}
    </span>
  );
}

export function PublicVacancyDetailPage({ vacancy, isAuthenticated }: PublicVacancyDetailPageProps) {
  const router = useRouter();
  const [applied, setApplied] = useState(vacancy.applicationStatus === 'applied');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!salary.trim() || submitting) return;

    // If not authenticated, redirect to login with returnTo pointing back here.
    if (!isAuthenticated) {
      const returnTo = ROUTES.publicVacante(vacancy.id);
      router.push(`${ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

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
          href={ROUTES.publicVacantes}
          className="flex items-center gap-1.5 text-[13px] text-primary-700 hover:underline transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Vacantes
        </Link>

        <div className="flex gap-5 items-start">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Header card */}
            <div className="bg-white rounded-xl border border-primary-200 p-7">
              <h1 className="text-[22px] font-bold text-primary-800 mb-5">{vacancy.title}</h1>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-[11px] text-ink-subtle uppercase font-semibold tracking-wide mb-3">
                  Descripción del puesto
                </h3>
                <p className="text-[14px] text-primary-800 leading-relaxed">{vacancy.description}</p>
              </div>

              {/* Technical requirements */}
              <div className="mb-6">
                <h3 className="text-[11px] text-ink-subtle uppercase font-semibold tracking-wide mb-3">
                  Requisitos técnicos
                </h3>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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

          {/* Right sidebar */}
          <div className="w-[35%] shrink-0 sticky top-6">
            <div className="bg-white rounded-xl border border-primary-200 p-6">
              {applied ? (
                <div className="text-center flex flex-col items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-[15px] font-bold text-primary-800">Ya postulaste a esta vacante</h3>
                  <p className="text-[13px] text-ink-subtle">Tu postulación está siendo revisada.</p>
                  <span className="px-3 py-1 bg-warning/15 text-warning text-[12px] font-medium rounded-full">
                    En revisión
                  </span>
                  <Link
                    href={ROUTES.candidato.misPostulaciones}
                    className="w-full mt-1 h-11 bg-white border border-primary-700 text-primary-700 font-semibold text-[14px] rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Ver mi postulación
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="text-[16px] font-bold text-primary-800 mb-1">Postular a esta vacante</h3>
                  <p className="text-[13px] text-ink-subtle mb-5">Completa el campo y envía tu postulación</p>

                  {!isAuthenticated && (
                    <div className="bg-primary-50 rounded-lg p-3 flex items-start gap-3 mb-5">
                      <LogIn size={18} className="text-primary-700 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-ink-muted">
                        Para postular necesitas iniciar sesión. Te llevaremos de vuelta a esta vacante.
                      </p>
                    </div>
                  )}

                  {isAuthenticated && (
                    <div className="bg-primary-50 rounded-lg p-3 flex items-start gap-3 mb-5">
                      <User size={18} className="text-primary-700 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-ink-muted">
                        Tu CV y perfil serán enviados automáticamente
                      </p>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-[13px] font-semibold text-primary-800 mb-2 uppercase tracking-wide">
                      Pretensión salarial <span className="text-primary-700">*</span>
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
                        className="w-full h-12 pl-8 pr-24 bg-white border-[1.5px] border-primary-200 rounded-lg text-[14px] text-primary-800 placeholder:text-ink-subtle focus:outline-none focus:border-primary-700 transition-all"
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
                    className="w-full h-[52px] bg-primary-700 text-white font-bold text-[15px] rounded-lg hover:bg-primary-600 active:scale-[0.99] transition-all mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
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

                  <div className="w-full h-px bg-primary-200 mb-4" />

                  <p className="text-[12px] text-ink-subtle">
                    Publicada hace {vacancy.publishedDaysAgo} día{vacancy.publishedDaysAgo !== 1 ? 's' : ''}
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
