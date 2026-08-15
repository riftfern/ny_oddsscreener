/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_REQUIRE_AUTH?: string;
  readonly VITE_DEV_PLAN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
