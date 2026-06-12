'use client';

import { useState } from 'react';
import { ROUTES } from '@/shared/constants/routes';
import { ProgressIndicator } from './onboarding/ProgressIndicator';
import { Step1PersonalData } from './onboarding/Step1PersonalData';
import { Step2Education } from './onboarding/Step2Education';
import { Step3Resume } from './onboarding/Step3Resume';
import { STEPS, STEP_TITLES } from './onboarding/constants';
import type { Step1Values, Step2Values, Step2FormValues, Step3Data } from './onboarding/schemas';

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState(false); // true while uploading the CV file
  const [error, setError] = useState<string | null>(null);

  // Persist values across steps so back/forward navigation preserves data
  const [step1Values, setStep1Values] = useState<Step1Values>({
    firstName: '', lastName: '', idNumber: '', birthDate: '', phone: '', homeAddress: '',
  });
  const [step2Values, setStep2Values] = useState<Step2FormValues>({
    educationLevel: '', completedCareer: '', university: '', city: '', province: '',
    isStudying: null,
    career: '',
    isWorking: null,
    currentCompany: '',
  });
  const [step3, setStep3] = useState<Step3Data>({ file: null });

  const handleStep1Next = (data: Step1Values) => {
    setStep1Values(data);
    setStep(1);
  };

  const handleStep2Next = (data: Step2Values) => {
    setStep2Values(data as Step2FormValues);
    setStep(2);
  };

  /** Upload file to MinIO through the BFF, return the stored file id. */
  const uploadCv = async (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/candidate/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al subir el CV');
    }

    const data = await res.json();
    return data.id as number;
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // --- Phase 1: upload CV (optional — user may skip) ---
      let cvFileId: number | undefined;
      if (step3.file) {
        setUploadPhase(true);
        cvFileId = await uploadCv(step3.file);
        setUploadPhase(false);
      }

      // --- Phase 2: save profile ---
      const body = {
        firstName: step1Values.firstName,
        lastName: step1Values.lastName,
        idNumber: step1Values.idNumber,
        birthDate: step1Values.birthDate,
        phone: step1Values.phone,
        homeAddress: step1Values.homeAddress || undefined,
        educationLevel: step2Values.educationLevel,
        completedCareer: step2Values.completedCareer || undefined,
        // university holds the parameter id as string; send as number if present
        universityId: step2Values.university ? Number(step2Values.university) : undefined,
        city: step2Values.city,
        province: step2Values.province || undefined,
        isStudying: step2Values.isStudying,
        career: step2Values.career || undefined,
        isWorking: step2Values.isWorking,
        currentCompany: step2Values.currentCompany || undefined,
        cvFileId,
      };

      const res = await fetch('/api/candidate/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al guardar el perfil');
      }

      // Robust redirect: the server re-issues session-user with has_profile: true
      // in the profile POST response — window.location picks up the fresh cookie
      window.location.href = ROUTES.candidato.vacantes;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado al guardar tus datos.';
      setError(message);
      setSubmitting(false);
      setUploadPhase(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[500px] rounded-2xl bg-surface p-8 shadow-xl">
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
            {error}
          </div>
        )}
        <ProgressIndicator current={step} />

        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Paso {step + 1} de {STEPS.length}
        </div>
        <h2 className="mb-1 text-xl font-bold text-ink">{STEP_TITLES[step].label}</h2>
        <p className="mb-6 text-sm text-ink-muted">{STEP_TITLES[step].sub}</p>

        {step === 0 && (
          <Step1PersonalData defaultValues={step1Values} onNext={handleStep1Next} />
        )}
        {step === 1 && (
          <Step2Education
            defaultValues={step2Values}
            onNext={handleStep2Next}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step3Resume
            data={step3}
            onChange={setStep3}
            onNext={handleFinish}
            onBack={() => setStep(1)}
            onSkip={handleFinish}
            isSubmitting={submitting}
            isUploading={uploadPhase}
          />
        )}
      </div>
    </div>
  );
}
