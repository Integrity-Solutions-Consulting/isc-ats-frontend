import { parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

import type { CandidateNote } from '@/features/candidates/types';

interface NotesReadOnlyCardProps {
  notes: CandidateNote[];
}

export function NotesReadOnlyCard({ notes }: NotesReadOnlyCardProps) {
  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
      <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
        Notas
      </p>

      {notes.length === 0 ? (
        <p className="text-sm text-ink-subtle">Sin notas registradas.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {note.authorInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-ink">{note.authorName}</span>
                  <span className="text-xs text-ink-subtle">
                    {format(parseISO(note.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{note.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
