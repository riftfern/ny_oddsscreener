import { createContext, useContext, useEffect, type ReactNode } from 'react';
import {
  ClerkProvider,
  useUser,
  useAuth,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/clerk-react';
import { setAuthTokenProvider } from '@/services/api';

export type Plan = 'free' | 'edge' | 'pro';

interface PlanContextValue {
  plan: Plan;
  isLoaded: boolean;
  getToken?: () => Promise<string | null>;
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

function ClerkPlanResolver({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const fromClerk = isValidPlan(user?.publicMetadata?.plan) ? user.publicMetadata.plan : undefined;
  // Until REQUIRE_AUTH is on, keep DEV_PLAN so the board stays usable while Jack
  // creates the first Clerk account. Signed-in metadata.plan still wins.
  const plan = fromClerk ?? (requireAuth ? 'free' : devPlan);

  useEffect(() => {
    if (getToken) {
      setAuthTokenProvider(getToken);
    }
  }, [getToken]);

  return (
    <PlanContext.Provider value={{ plan, isLoaded, getToken }}>
      {children}
    </PlanContext.Provider>
  );
}

function StubPlanResolver({ children }: { children: ReactNode }) {
  return (
    <PlanContext.Provider value={{ plan: devPlan, isLoaded: true }}>
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
    return <StubPlanResolver>{children}</StubPlanResolver>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        variables: {
          colorPrimary: '#2f5d3a',
          colorBackground: '#121411',
          colorText: '#e6e4dc',
          colorInputBackground: '#1a1d19',
          colorInputText: '#e6e4dc',
          borderRadius: '0',
          fontFamily: '"Archivo Narrow", sans-serif',
        },
      }}
    >
      <ClerkPlanResolver>{children}</ClerkPlanResolver>
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
