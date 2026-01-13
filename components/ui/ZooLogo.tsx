import { cn } from '@/lib/utils';

const LOGO_STROKE = '#c2923b';

interface ZooLogoProps {
  className?: string;
}

export function ZooLogo({ className }: ZooLogoProps) {
  return (
    <div
      className={cn('flex items-center gap-4 text-white drop-shadow-sm', className)}
      aria-label="Parc Zoologique et Botanique de Mulhouse"
    >
      <svg
        viewBox="0 0 72 72"
        role="img"
        aria-hidden="true"
        className="h-14 w-14"
      >
        <circle
          cx="36"
          cy="36"
          r="29"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="3"
        />
        <path
          d="M36 16v40"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M36 20c-6 4-11 10-11 16 0 5.5 3.5 8.7 7.5 11.5"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M36 20c6 4 11 10 11 16 0 5.5-3.5 8.7-7.5 11.5"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M36 27c-4 3-7 6-7 10 0 3.25 1.9 5.35 4.5 7.25"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M36 27c4 3 7 6 7 10 0 3.25-1.9 5.35-4.5 7.25"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M28 32c-3-2-5.5-5-5.5-8.8"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M44 32c3-2 5.5-5 5.5-8.8"
          fill="none"
          stroke={LOGO_STROKE}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-[0.4em] text-[#caa35a]">
          Parc Zoologique & Botanique
        </span>
        <span className="mt-2 inline-flex items-center self-start rounded border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.5em] text-white">
          Mulhouse
        </span>
      </div>
    </div>
  );
}
