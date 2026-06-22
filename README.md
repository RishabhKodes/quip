# Quip - Quick Page AI

Quip is a Chrome extension that lets you ask AI questions about selected text
or the page you are viewing. It includes a Fastify API, a React extension, and
shared TypeScript contracts in a pnpm workspace.

> Quip is an early-stage project. The local development flow is complete, but
> the included file-based free-usage store is intended for a single API
> instance, not a horizontally scaled production deployment.

## Features

- Open Quip with `Command+K` on macOS or `Ctrl+K` on Windows and Linux.
- Ask about selected text or extracted page context.
- Use OpenAI or Anthropic through the Quip API.
- Include ten server-funded requests per extension installation.
- Configure a personal provider key and model after the free allowance.
- Restrict context to selected text or block Quip on specific domains.
- Stream Markdown answers inside an isolated Shadow DOM dialog.

## Repository Layout

```text
apps/
  api/          Fastify API and LLM integrations
  extension/    Chrome Manifest V3 extension
packages/
  shared/       Shared limits and protocol types
docs/
  architecture.md
  production-readiness.md
```

## Requirements

- Node.js 20 or newer
- pnpm 9
- An OpenAI or Anthropic API key for the server-funded request path

## Local Setup

```bash
git clone https://github.com/RishabhKodes/quip.git
cd quip
pnpm install
cp .env.example .env
```

Configure at least one provider in `.env`, then start the API:

```bash
pnpm dev:api
```

Build the extension:

```bash
pnpm build:extension
```

Load `apps/extension/dist` from `chrome://extensions` using **Load unpacked**.
The default extension API URL is `http://localhost:3000`.

## Environment Variables

| Variable             | Default                    | Purpose                                                   |
| -------------------- | -------------------------- | --------------------------------------------------------- |
| `NODE_ENV`           | `development`              | Set to `production` in deployed environments.             |
| `LLM_PROVIDER`       | `openai`                   | Server-funded provider: `openai` or `anthropic`.          |
| `OPENAI_API_KEY`     | empty                      | Required when the server provider is OpenAI.              |
| `OPENAI_MODEL`       | `gpt-4o-mini`              | Default OpenAI model ID.                                  |
| `ANTHROPIC_API_KEY`  | empty                      | Required when the server provider is Anthropic.           |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-20250514` | Default Anthropic model ID.                               |
| `API_HOST`           | `127.0.0.1`                | Address the API listens on. Use `0.0.0.0` in a container. |
| `API_PORT`           | `3000`                     | API port.                                                 |
| `BODY_LIMIT_BYTES`   | `524288`                   | Maximum HTTP request-body size.                           |
| `QUIP_API_KEY`       | empty                      | Optional shared secret for self-hosted API access.        |
| `CORS_ORIGINS`       | open in development        | Comma-separated origins. Required in production.          |
| `RATE_LIMIT_MAX`     | `60`                       | Requests allowed per rate-limit window.                   |
| `RATE_LIMIT_WINDOW`  | `1 minute`                 | Fastify rate-limit window.                                |
| `FREE_REQUEST_LIMIT` | `10`                       | Server-funded requests per client installation ID.        |
| `QUIP_USAGE_FILE`    | `.data/quip-usage.json`    | Single-instance quota data file.                          |
| `TRUST_PROXY`        | `false`                    | Enable only behind a trusted reverse proxy.               |
| `LOG_LEVEL`          | `info`                     | Fastify/Pino log level.                                   |

`CORS_ORIGINS=*` is convenient for local extension testing but is not an
authentication mechanism. Use explicit origins where your deployment model
allows it.

## Production Extension Builds

Set the default API URL at build time:

```bash
QUIP_DEFAULT_API_URL=https://api.example.com pnpm build:extension
```

Remote API URLs must use HTTPS. Plain HTTP is accepted only for localhost.

## Personal API Keys

Users can select **Use my key** in the extension settings and provide:

- an OpenAI or Anthropic provider
- a model ID enabled for their account
- their provider API key

The key is stored in `chrome.storage.local` and sent through the configured Quip
API for each request. The API uses the key in memory and does not persist it.
Browser extension storage is not an encrypted secret vault; see
[PRIVACY.md](PRIVACY.md) before distributing the extension.

## Commands

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `pnpm dev:api`       | Start the API with reload.                        |
| `pnpm dev:extension` | Build the extension and watch the content script. |
| `pnpm build`         | Build the API and extension.                      |
| `pnpm test`          | Run API tests.                                    |
| `pnpm typecheck`     | Type-check every workspace package.               |
| `pnpm lint`          | Run ESLint.                                       |
| `pnpm format:check`  | Verify Prettier formatting.                       |
| `pnpm check`         | Run all repository checks and builds.             |

## Security and Deployment

Read [SECURITY.md](SECURITY.md) and
[docs/production-readiness.md](docs/production-readiness.md) before deploying a
public API. In particular:

- Replace the file quota store with an atomic shared database for multiple API
  instances.
- Treat installation IDs as a convenience quota, not strong user identity.
- Configure CORS, TLS, rate limiting, and reverse-proxy trust explicitly.
- Review Chrome Web Store permissions and publish a hosted privacy policy.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to follow
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
