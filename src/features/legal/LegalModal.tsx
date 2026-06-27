'use client';

import { Modal } from '@/design-system/molecules/Modal';
import { LEGAL_DOCS, type LegalDocId } from './content';

interface LegalModalProps {
  /** Which document to show, or null when closed. */
  doc: LegalDocId | null;
  onClose: () => void;
}

/** Shows a legal document (Terms / Privacy) inside the shared Modal. */
export function LegalModal({ doc, onClose }: LegalModalProps) {
  const shown = doc ? LEGAL_DOCS[doc] : null;

  return (
    <Modal
      open={doc !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={shown?.title ?? ''}
      size="lg"
    >
      {shown && (
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-sm text-ink-muted">
          {shown.intro.map((paragraph, i) => (
            <p key={`intro-${i}`}>{paragraph}</p>
          ))}

          {shown.sections.map((section) => (
            <section key={section.heading} className="space-y-1.5">
              <h3 className="font-semibold text-ink">{section.heading}</h3>
              {section.body.map((paragraph, i) => (
                <p key={`${section.heading}-${i}`}>{paragraph}</p>
              ))}
            </section>
          ))}

          <p className="pt-2 text-xs text-ink-subtle">
            Última actualización: {shown.lastUpdated}
          </p>
        </div>
      )}
    </Modal>
  );
}
