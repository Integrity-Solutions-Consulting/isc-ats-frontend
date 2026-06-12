'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { PasswordModal } from './PasswordModal';

export function SecurityCard() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-primary-200 p-6">
        <h3 className="text-[15px] font-bold text-primary-800 mb-4">Seguridad</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-ink-subtle" />
            <div>
              <p className="text-[14px] text-primary-800 font-medium mb-0.5">Contraseña</p>
              <p className="text-[12px] text-ink-subtle">Última actualización: hace 2 meses</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="text-primary-700 text-[13px] font-medium hover:text-primary-600 transition-colors"
          >
            Cambiar contraseña
          </button>
        </div>
      </div>

      {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}
