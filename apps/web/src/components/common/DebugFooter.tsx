interface DebugFooterProps {
  cachedAt?: string;
  remainingCredits?: number;
}

export default function DebugFooter({ cachedAt, remainingCredits }: DebugFooterProps) {
  const ageSeconds = cachedAt
    ? Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000)
    : undefined;

  return (
    <div className="text-[11px] text-ink-dim font-mono mt-4 border-t border-line pt-2">
      debug | cache age: {ageSeconds !== undefined ? `${ageSeconds}s` : 'n/a'}
      {remainingCredits !== undefined && ` | credits remaining: ${remainingCredits}`}
    </div>
  );
}
