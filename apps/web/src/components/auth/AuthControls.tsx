import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const ghost =
  'text-[11px] uppercase tracking-[0.18em] text-ink-dim hover:text-ink bg-transparent border-0 p-0 cursor-pointer';
const solid =
  'text-[11px] uppercase tracking-[0.18em] bg-moss hover:bg-moss-2 text-ink px-4 py-2 cursor-pointer border-0';

/** Sign in / Sign up / account. Hidden until a publishable key exists. */
export default function AuthControls({ compact = false }: { compact?: boolean }) {
  if (!clerkPublishableKey) return null;
  return <AuthControlsInner compact={compact} />;
}

function AuthControlsInner({ compact }: { compact: boolean }) {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-4">
        <span className={ghost}>Sign in</span>
        <span className={solid}>Sign up</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className={ghost}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className={solid}>
            Sign up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: compact ? 'h-7 w-7' : 'h-8 w-8',
              userButtonAvatarBox: 'rounded-none',
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
