'use client';

import { useState } from 'react';
import { ROUTES } from '@/shared/constants/routes';
import { ProgressIndicator } from './onboarding/ProgressIndicator';
import { Step0CvUpload, type CvPrefillData } from './onboarding/Step0CvUpload';
import { Step1PersonalData } from './onboarding/Step1PersonalData';
import { Step2Education } from './onboarding/Step2Education';
import { STEPS, STEP_TITLES } from './onboarding/constants';
import type { Step1Values, Step2Values, Step2FormValues } from './onboarding/schemas';

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CV pre-fill state set in Step 0. The PDF is held in memory and only
  // uploaded once the candidate finishes registration (data minimisation).
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [prefillData, setPrefillData] = useState<CvPrefillData>({});

  // Persist values across steps so back/forward navigation preserves data
  const [step1Values, setStep1Values] = useState<Step1Values>({
    firstName: '', lastName: '', idNumber: '', birthDate: '', phone: '', homeAddress: '',
  });
  const [step2Values, setStep2Values] = useState<Step2FormValues>({
    educationLevel: '', completedCareer: '', title: '', university: '', city: '',
    isStudying: null,
    isWorking: null,
    currentCompany: '',
  });

  const handleStep0Complete = (data: CvPrefillData, file: File) => {
    setPrefillData(data);
    setCvFile(file);
    setStep(1);
  };

  const handleStep1Next = (data: Step1Values) => {
    setStep1Values(data);
    setStep(2);
  };

  const handleStep2Next = (data: Step2Values) => {
    setStep2Values(data as Step2FormValues);
    handleFinish(data as Step2FormValues);
  };

  const handleFinish = async (step2: Step2FormValues = step2Values) => {
    setSubmitting(true);
    setError(null);
    try {
      const toId = (v?: string) => (v ? Number(v) : undefined);
      // The CV is intentionally absent here: the candidate must be created
      // first. We only persist the PDF afterwards, once registration exists.
      const body = {
        firstName: step1Values.firstName,
        lastName: step1Values.lastName,
        idNumber: step1Values.idNumber,
        birthDate: step1Values.birthDate,
        phone: step1Values.phone,
        homeAddress: step1Values.homeAddress || undefined,
        educationLevelId: toId(step2.educationLevel),
        cityId: toId(step2.city),
        universityId: toId(step2.university),
        careerId: toId(step2.completedCareer),
        titleId: toId(step2.title),
        isStudying: step2.isStudying,
        isWorking: step2.isWorking,
        currentCompany: step2.currentCompany || undefined,
      };

      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error ?? 'Error al guardar el perfil');
      }

      // Now that the candidate exists (and has consented), persist the CV and
      // link it. If this fails the candidate is already registered — they can
      // add the CV later from "Mi perfil", so we don't block the redirect.
      if (cvFile) {
        try {
          const created = (await res.json()) as { id?: number };
          const candidateId = created.id;
          if (candidateId) {
            const fd = new FormData();
            fd.append('file', cvFile);
            const uploadRes = await fetch('/api/candidate/upload', { method: 'POST', body: fd });
            if (uploadRes.ok) {
              const uploaded = (await uploadRes.json()) as { id: number };
              await fetch('/api/candidate/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId, cvFileId: uploaded.id }),
              });
            }
          }
        } catch {
          // Non-blocking: registration succeeded; the CV can be uploaded later.
        }
      }

      // Robust redirect: the server re-issues session-user with has_profile: true
      // in the profile POST response — window.location picks up the fresh cookie
      window.location.href = ROUTES.candidato.vacantes;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado al guardar tus datos.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[500px] max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl sm:p-8">
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
            {error}
          </div>
        )}
        <ProgressIndicator steps={STEPS} current={step} />

        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Paso {step + 1} de {STEPS.length}
        </div>
        <h2 className="mb-1 text-xl font-bold text-ink">{STEP_TITLES[step].label}</h2>
        <p className="mb-6 text-sm text-ink-muted">{STEP_TITLES[step].sub}</p>

        {step === 0 && (
          <Step0CvUpload
            onComplete={handleStep0Complete}
            onSkip={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <Step1PersonalData
            defaultValues={step1Values}
            onNext={handleStep1Next}
            prefill={prefillData}
          />
        )}
        {step === 2 && (
          <Step2Education
            defaultValues={step2Values}
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
            prefill={prefillData}
            isSubmitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
