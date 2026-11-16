import { useState } from 'react';
import { Bike } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function SafeImage({ src, alt, className = '', loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F4F6F8] text-slate-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Bike className="w-10 h-10 stroke-[1.5] text-slate-400 mb-2" />
        <span className="text-xs text-slate-500 max-w-[180px] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
