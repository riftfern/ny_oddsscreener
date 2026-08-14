import { createContext, useContext, type ReactNode } from 'react';
import { ClerkProvider, useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

export type Plan = 'free' | 'edge' | 'pro';

interface PlanContextValue {
  plan: Plan;
  isLoaded: boolean;
}

const PlanContext = createContext<PlanContextValue>({
  plan: 'free',
  isLoaded: false,
});

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';
const devPlan = (import.meta.env.VITE_DEV_PLAN as Plan) ?? 'pro';

function isValidPlan(value: unknown): value is Plan {
  return value === 'free' || value === 'edge' || value === 'pro';
}

function PlanResolver({ children }: { children: ReactNode }) {
  if (!requireAuth) {
    return (
      <PlanContext.Provider value={{ plan: devPlan, isLoaded: true }}>
        {children}
      </PlanContext.Provider>
    );
  }

  if (!clerkPublishableKey) {
    throw new Error(
      'VITE_REQUIRE_AUTH=true but VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
        'Set the key or disable REQUIRE_AUTH.'
    );
  }

  const { user, isLoaded } = useUser();
  const plan = isValidPlan(user?.publicMetadata?.plan) ? user.publicMetadata.plan : 'free';

  return (
    <PlanContext.Provider value={{ plan, isLoaded }}>
      {children}
    </PlanContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (requireAuth && !clerkPublishableKey) {
    throw new Error(
      'VITE_REQUIRE_AUTH=true but VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
        'Set the key or disable REQUIRE_AUTH.'
    );
  }

  if (!clerkPublishableKey) {
    return <PlanResolver>{children}</PlanResolver>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <PlanResolver>{children}</PlanResolver>
    </ClerkProvider>
  );
}

export function usePlan(): PlanContextValue {
  return useContext(PlanContext);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!requireAuth) {
    return <>{children}</>;
  }

  if (!clerkPublishableKey) {
    throw new Error(
      'VITE_REQUIRE_AUTH=true but VITE_CLERK_PUBLISHABLE_KEY is not set.'
    );
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
