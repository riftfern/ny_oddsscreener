import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const ghost =
  'text-[11px] uppercase tracking-[0.12em] text-[#c9bde8] hover:text-[#eef2fb] bg-transparent border-0 p-0 cursor-pointer';
const solid =
  'text-[11px] uppercase tracking-[0.12em] bg-moss hover:bg-moss-2 text-[#eef2fb] px-3 py-2 rounded-full cursor-pointer border-0';

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
        {!compact && (
          <SignUpButton mode="modal">
            <button type="button" className={solid}>
              Sign up
            </button>
          </SignUpButton>
        )}
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: compact ? 'h-7 w-7 rounded-full' : 'h-8 w-8 rounded-full',
              userButtonAvatarBox: 'rounded-full',
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
