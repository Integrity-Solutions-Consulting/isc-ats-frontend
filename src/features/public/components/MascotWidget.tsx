'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

const FRAMES = [
  '/brand/R1.png',
  '/brand/R2.png',
  '/brand/R3.png',
  '/brand/R4.png',
];

export function MascotWidget() {
  const [frame, setFrame] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    
    // Cycle through frames 0, 1, 2, 3
    const interval = setInterval(() => {
      setFrame((prev) => {
        if (prev < 3) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return 3;
        }
      });
    }, 250); // 250ms per frame for stop-motion effect

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* Robot container */}
      <div className="relative group flex items-center justify-center bg-transparent">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setVisible(false)}
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
                priority={idx === 0}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
