interface StaleBannerProps {
  cachedAt?: string;
}

export default function StaleBanner({ cachedAt }: StaleBannerProps) {
  return (
    <div className="border border-warn p-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-warn text-[11px] uppercase tracking-[0.18em] font-medium">
          Showing last good lines — live fetch failed.
        </p>
        {cachedAt && (
          <p className="text-ink-dim font-mono text-[11px] mt-1">
            Cached at{' '}
            {new Date(cachedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
