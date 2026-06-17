'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DeleteAccountDialog } from './DeleteAccountDialog';

export function DangerZoneCard() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="bg-card rounded-xl border border-danger/20 p-6">
        <h3 className="text-[15px] font-bold text-ink mb-3">Zona de riesgo</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-danger" />
            <div>
              <p className="text-[14px] text-ink font-medium mb-0.5">Eliminar mi cuenta</p>
              <p className="text-[12px] text-ink-subtle">
                Se eliminarán todos tus datos y postulaciones activas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="h-9 px-4 bg-card border border-danger text-danger font-semibold text-[13px] rounded-lg hover:bg-danger/5 transition-colors shrink-0"
          >
            Eliminar cuenta
          </button>
        </div>
      </div>

      {showDeleteDialog && <DeleteAccountDialog onClose={() => setShowDeleteDialog(false)} />}
    </>
  );
}
