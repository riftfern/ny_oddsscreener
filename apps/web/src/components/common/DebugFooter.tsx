interface DebugFooterProps {
  cachedAt?: string;
  remainingCredits?: number;
}

export default function DebugFooter({ cachedAt, remainingCredits }: DebugFooterProps) {
  const ageSeconds = cachedAt
    ? Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000)
    : undefined;

  return (
    <div className="text-xs text-gray-500 font-mono mt-4 border-t border-gray-700 pt-2">
      debug | cache age: {ageSeconds !== undefined ? `${ageSeconds}s` : 'n/a'}
      {remainingCredits !== undefined && ` | credits remaining: ${remainingCredits}`}
    </div>
  );
}
