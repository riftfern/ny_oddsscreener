interface StaleBannerProps {
  cachedAt?: string;
}

export default function StaleBanner({ cachedAt }: StaleBannerProps) {
  return (
    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-3">
      <span className="text-yellow-400 text-lg">⚠</span>
      <div className="flex-1">
        <p className="text-yellow-200 text-sm font-medium">
          Showing last good lines — live fetch failed.
        </p>
        {cachedAt && (
          <p className="text-yellow-400/70 text-xs">
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
