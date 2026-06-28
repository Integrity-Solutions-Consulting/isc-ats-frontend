'use client';

import { parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';
import { getClientSessionUser } from '@/shared/constants/mockSession';
import {
  useAddNote,
  useCandidateNotes,
} from '@/features/candidates/hooks/useCandidates';

interface NotesCardProps {
  applicationId: string;
  readOnly?: boolean;
}

export function NotesCard({ applicationId, readOnly }: NotesCardProps) {
  const [body, setBody] = useState('');

  const { data: notes = [], isLoading } = useCandidateNotes(applicationId);
  const addNoteMutation = useAddNote(applicationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 3) return;

    addNoteMutation.mutate(
      { body: body.trim(), author: getClientSessionUser() ?? { name: "Usuario", initials: "US" } },
      {
        onSuccess: () => setBody(''),
      },
    );
  };

  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
      <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
        Notas
      </p>

      {/* Notes list */}
      {isLoading ? (
        <p className="text-sm text-ink-subtle">Cargando notas…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-ink-subtle mb-4">Sin notas registradas.</p>
      ) : (
        <ul className="space-y-4 mb-5">
          {[...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((note) => (
            <li key={note.id} className="flex gap-3">
              {/* Author avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {note.authorInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-ink">{note.authorName}</span>
                  <span className="text-xs text-ink-subtle">
                    {format(parseISO(note.createdAt), "d MMM yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{note.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add note form */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Agregar una nota sobre este candidato…"
            rows={3}
            className={cn(
              'w-full resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink',
              'placeholder:text-ink-subtle',
              'focus:outline-none focus:ring-2 focus:ring-primary-300',
              'disabled:opacity-50',
            )}
            disabled={addNoteMutation.isPending}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={body.trim().length < 3 || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? 'Guardando…' : 'Agregar nota'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
