import { useEffect, useMemo, useState } from 'react';

interface ImagenSimboloTintadaProps {
  base64: string;
  color: string;
  alt: string;
  className?: string;
}

function normalizarSrc(base64: string) {
  const trimmed = (base64 || '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('data:image') ? trimmed : `data:image/png;base64,${trimmed}`;
}

export function ImagenSimboloTintada({ base64, color, alt, className }: ImagenSimboloTintadaProps) {
  const src = useMemo(() => normalizarSrc(base64), [base64]);
  const [tintedSrc, setTintedSrc] = useState<string>('');

  useEffect(() => {
    let cancelado = false;

    if (!src) {
      setTintedSrc('');
      return;
    }

    const img = new window.Image();
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = Math.max(1, img.naturalWidth || img.width || 1);
        const h = Math.max(1, img.naturalHeight || img.height || 1);
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (!cancelado) setTintedSrc(src);
          return;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = color || '#0000FF';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        const url = canvas.toDataURL('image/png');
        if (!cancelado) setTintedSrc(url);
      } catch {
        if (!cancelado) setTintedSrc(src);
      }
    };

    img.onerror = () => {
      if (!cancelado) setTintedSrc(src);
    };

    return () => {
      cancelado = true;
    };
  }, [src, color]);

  return (
    <img
      src={tintedSrc || src}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}
