import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ZooLogoProps {
  className?: string;
}

export function ZooLogo({ className }: ZooLogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/brand/zoo-logo.png"
        alt="Parc Zoologique et Botanique de Mulhouse"
        width={380}
        height={240}
        priority
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}
