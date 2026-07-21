'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';

const FRAMES = [
  '/brand/R1.png',
  '/brand/R2.png',
  '/brand/R3.png',
  '/brand/R4.png',
];

// Total time the mascot stays on screen before it fades out on its own —
// long enough to finish its stop-motion flow, short enough not to nag.
const AUTO_HIDE_MS = 2500;
const EXIT_DURATION_MS = 300;

export function MascotWidget() {
  const [frame, setFrame] = useState(0);
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Cycle through frames 0, 1, 2, 3
    const frameTimer = setInterval(() => {
      setFrame((prev) => {
        if (prev < 3) {
          return prev + 1;
        }
        clearInterval(frameTimer);
        return 3;
      });
    }, 250); // 250ms per frame for stop-motion effect

    const hideTimer = setTimeout(() => setClosing(true), AUTO_HIDE_MS);

    return () => {
      clearInterval(frameTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setVisible(false), EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  if (!visible) return null;

  const dismiss = () => setClosing(true);

  return (
    <div
      className={cn(
        'fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 duration-300',
        closing
          ? 'animate-out fade-out slide-out-to-bottom-5'
          : 'animate-in fade-in slide-in-from-bottom-5 duration-500',
      )}
    >
      {/* Robot container */}
      <div className="relative group flex items-center justify-center bg-transparent">
        {/* Close Button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute -top-1 -right-1 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Cerrar mascota"
        >
          <X size={13} />
        </button>

        {/* Frames stacked absolutely to prevent blinking/loading lag */}
        <div className="relative w-44 h-44 select-none pointer-events-none">
          {FRAMES.map((src, idx) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-100 ${
                idx === frame ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={src}
                alt={`Mascot Frame ${idx + 1}`}
                fill
                sizes="176px"
                priority
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
