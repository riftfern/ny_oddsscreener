import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import {
  ClerkProvider,
  useUser,
  useAuth,
  useClerk,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/clerk-react';
import { hasBooksSetup, parseUserBooks } from '@ny-sharp-edge/shared';
import { api, setAuthTokenProvider } from '@/services/api';
import { useBooksStore } from '@/stores/booksStore';

export type Plan = 'free' | 'edge' | 'pro';

const PENDING_PLAN_KEY = 'le.pendingPlan';
const PENDING_PLAN_MAX_AGE_MS = 15 * 60 * 1000;

function rememberPendingPlan(plan: 'edge' | 'pro'): void {
  try {
    sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify({ plan, at: Date.now() }));
  } catch {
    /* private mode */
  }
}

function takePendingPlan(): 'edge' | 'pro' | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PLAN_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_PLAN_KEY);
    const parsed = JSON.parse(raw) as { plan?: string; at?: number };
    if (parsed.plan !== 'edge' && parsed.plan !== 'pro') return null;
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > PENDING_PLAN_MAX_AGE_MS) return null;
    return parsed.plan;
  } catch {
    return null;
  }
}

interface PlanContextValue {
  plan: Plan;
  isLoaded: boolean;
  getToken?: () => Promise<string | null>;
  signedIn: boolean;
  /** null = signed out / no filter. string[] = only these shops. */
  books: string[] | null;
  needsBookSetup: boolean;
  setBooks: (ids: string[]) => Promise<void>;
  startCheckout: (plan: 'edge' | 'pro') => Promise<{ error?: string }>;
  startPortal: () => Promise<{ error?: string }>;
}

const PlanContext = createContext<PlanContextValue>({
  plan: 'free',
  isLoaded: false,
  signedIn: false,
  books: null,
  needsBookSetup: false,
  setBooks: async () => undefined,
  startCheckout: async () => ({}),
  startPortal: async () => ({}),
});

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';
const devPlan = (import.meta.env.VITE_DEV_PLAN as Plan) ?? 'pro';

function isValidPlan(value: unknown): value is Plan {
  return value === 'free' || value === 'edge' || value === 'pro';
}

function ClerkPlanResolver({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();
  const localBooks = useBooksStore((s) => s.books);
  const setLocalBooks = useBooksStore((s) => s.setBooks);
  const fromClerk = isValidPlan(user?.publicMetadata?.plan) ? user.publicMetadata.plan : undefined;
  // Until REQUIRE_AUTH is on, keep DEV_PLAN so the board stays usable while Jack
  // creates the first Clerk account. Signed-in metadata.plan still wins.
  const plan = fromClerk ?? (requireAuth ? 'free' : devPlan);
  const signedIn = Boolean(isSignedIn && user);
  const setup = signedIn && hasBooksSetup(user?.unsafeMetadata);
  const clerkBooks = signedIn && setup ? parseUserBooks(user?.unsafeMetadata?.books) : null;
  const books = clerkBooks && clerkBooks.length > 0 ? clerkBooks : localBooks;
  const needsBookSetup = signedIn && isLoaded && !setup;
  const checkoutPoll = useRef(false);

  const setBooks = useCallback(
    async (ids: string[]) => {
      const next = parseUserBooks(ids);
      setLocalBooks(next);
      if (!user) return;
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          books: next,
          booksSet: true,
        },
      });
    },
    [user, setLocalBooks]
  );

  const startCheckout = useCallback(
    async (target: 'edge' | 'pro'): Promise<{ error?: string }> => {
      if (!isLoaded) return { error: 'loading' };
      if (!isSignedIn) {
        rememberPendingPlan(target);
        clerk.openSignIn();
        return {};
      }
      const result = await api.createCheckoutSession(target);
      if (result.url) {
        window.location.href = result.url;
        return {};
      }
      return { error: result.error ?? 'checkout_failed' };
    },
    [isLoaded, isSignedIn, clerk]
  );

  const startPortal = useCallback(async (): Promise<{ error?: string }> => {
    if (!isSignedIn) {
      clerk.openSignIn();
      return {};
    }
    const result = await api.createPortalSession();
    if (result.url) {
      window.location.href = result.url;
      return {};
    }
    return { error: result.error ?? 'portal_failed' };
  }, [isSignedIn, clerk]);

  useEffect(() => {
    if (getToken) {
      setAuthTokenProvider(getToken);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const pending = takePendingPlan();
    if (!pending) return;
    void startCheckout(pending);
  }, [isLoaded, isSignedIn, startCheckout]);

  useEffect(() => {
    if (!isLoaded || !user || checkoutPoll.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    checkoutPoll.current = true;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 12 && !cancelled; i++) {
        await user.reload();
        const next = user.publicMetadata?.plan;
        if (next === 'edge' || next === 'pro') break;
        await new Promise((r) => setTimeout(r, 750));
      }
      if (cancelled) return;
      params.delete('checkout');
      const qs = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  return (
    <PlanContext.Provider
      value={{ plan, isLoaded, getToken, signedIn, books, needsBookSetup, setBooks, startCheckout, startPortal }}
    >
      {children}
    </PlanContext.Provider>
  );
}

function StubPlanResolver({ children }: { children: ReactNode }) {
  const books = useBooksStore((s) => s.books);
  const setLocalBooks = useBooksStore((s) => s.setBooks);
  return (
    <PlanContext.Provider
      value={{
        plan: devPlan,
        isLoaded: true,
        signedIn: false,
        books,
        needsBookSetup: false,
        setBooks: async (ids) => setLocalBooks(ids),
        startCheckout: async () => {
          window.location.href = '/app';
          return {};
        },
        startPortal: async () => ({}),
      }}
    >
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
          colorPrimary: '#3d6fd8',
          colorBackground: '#eef2fb',
          colorText: '#2a1854',
          colorInputBackground: '#ffffff',
          colorInputText: '#2a1854',
          borderRadius: '14px',
          fontFamily: 'Nunito, sans-serif',
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
