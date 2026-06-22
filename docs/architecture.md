# Architecture

## Request Flow

1. The background service worker opens the content-script dialog after a
   keyboard shortcut or context-menu action.
2. The content script extracts bounded page context using a site adapter or the
   base extractor.
3. The dialog reads extension-local settings and sends a request to the
   configured Quip API.
4. The API validates and bounds the payload, builds an injection-resistant
   prompt, and calls OpenAI or Anthropic.
5. The answer streams back as server-sent events and is rendered through a
   restricted Markdown allowlist.

## Trust Boundaries

- Webpage text is untrusted and must never be treated as model instructions.
- Provider API keys are secrets. Server keys remain in environment variables;
  user-provided keys remain in extension-local storage and transit the API only
  for the current request.
- The extension installation ID is a quota identifier, not authentication.
- `CORS_ORIGINS` controls browser access but does not replace authentication.
- The file usage store is suitable only for a single process.

## Packages

### `apps/extension`

Chrome Manifest V3 extension built with Vite and React. The in-page dialog is
mounted into a Shadow DOM to isolate it from host-page styles.

### `apps/api`

Fastify API with request validation, optional shared-secret authentication,
rate limiting, usage accounting, and OpenAI/Anthropic adapters.

### `packages/shared`

Shared request types and hard limits used by both the extension and API.
