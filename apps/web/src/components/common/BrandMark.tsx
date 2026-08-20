import { BRAND } from '@ny-sharp-edge/shared';

interface BrandMarkProps {
  className?: string;
}

/** Product wordmark. Persist keys and package names stay on the old ids. */
export default function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <span className={`font-display font-bold tracking-[0.08em] lowercase ${className}`.trim()}>
      {BRAND.wordmark}
    </span>
  );
}
