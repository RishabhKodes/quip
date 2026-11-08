# Quip — Ask AI About Any Webpage

Quip is a Chrome extension for asking questions about selected text or the page
you are viewing. The repository contains a Manifest V3 extension, a Fastify API,
and shared TypeScript contracts in a pnpm workspace.

> Quip is an early-stage, bring-your-own-provider project. There are no Quip
> plans or request allowances. Your model provider’s charges and limits still apply.

## Features

- Open Quip with `Command+K` on macOS, `Ctrl+K` on Windows and Linux, the
  extension button, or the selection context menu.
- Ask about selected text, its surrounding passage, or the overall page.
- Prioritize short selections and the page sections most relevant to the
  question.
- Inspect the extracted context and the sections sent for the latest question.
- Use a personal OpenAI or Anthropic key, your self-hosted server, or a local
  OpenAI-compatible model.
- Stream Markdown answers into a minimal dialog isolated from webpage styles.
- Restrict extraction to selected text when full-page context is not wanted.

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer
- Google Chrome or another Chromium browser that can load unpacked extensions
- One of the following model configurations:
  - an OpenAI or Anthropic key in `.env` for the self-hosted server option
  - an OpenAI or Anthropic key entered in the extension settings
  - a local OpenAI-compatible model reachable by the Quip API

## Run Locally

### 1. Install the workspace

```bash
git clone https://github.com/RishabhKodes/quip.git
cd quip
pnpm install
cp .env.example .env
```

If you choose **Self-hosted server**, configure your server’s provider in
`.env`. For OpenAI:

```dotenv
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini
```

For Anthropic:

```dotenv
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

The API can start without either cloud key if you will select **Own provider**
in the extension and supply a personal key or local model there.

### 2. Start the API

Keep this process running in its own terminal:

```bash
pnpm dev:api
```

The default address is `http://127.0.0.1:3000`. Verify it from another
terminal:

```bash
curl http://127.0.0.1:3000/health
```

The expected response is:

```json
{ "ok": true }
```

### 3. Build the extension

```bash
pnpm build:extension
```

This creates `apps/extension/dist` with the content script, background service
worker, settings popup, manifest, and icons.

### 4. Load it in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `apps/extension/dist`.
5. Pin Quip if you want quick access to its settings and launch button.

The default Quip API URL is `http://localhost:3000`. Open the extension, expand
**Advanced server settings**, and change it if your API uses another address.

### 5. Choose a model

New installations default to **Own provider**. Open the extension settings and choose a connection:

- **Self-hosted server** uses the provider and key configured in your API’s `.env`.
  Existing server-mode settings continue to work, with no Quip request quota.
- **Own provider → OpenAI** stores your OpenAI key in extension-local storage.
- **Own provider → Anthropic** stores your Anthropic key in extension-local
  storage.
- **Own provider → Local** sends requests from the Quip API to a loopback,
  OpenAI-compatible endpoint.

For OpenAI and Anthropic, the model field is optional. The UI displays the
default model and uses it whenever the field is blank.

| Provider  | Default model              | Additional setting                     |
| --------- | -------------------------- | -------------------------------------- |
| OpenAI    | `gpt-4o-mini`              | OpenAI API key                         |
| Anthropic | `claude-sonnet-4-20250514` | Anthropic API key                      |
| Local     | `llama3.2`                 | `http://127.0.0.1:11434/v1` by default |

Local endpoints are restricted to `localhost`, `127.0.0.1`, or `[::1]`. The
endpoint is resolved by the machine running the Quip API. When the extension
and API run on your laptop, that means the local model must also be reachable
from your laptop.

For example, with Ollama installed:

```bash
ollama pull llama3.2
ollama serve
```

Then select **Own provider → Local**, leave the default endpoint and model in
place, and save the settings.

### 6. Ask a page

Open a normal `http://` or `https://` page and use any of these entry points:

- Select text, right-click, and choose **Ask Quip about this**.
- Select text and press `Command+K` or `Ctrl+K`.
- Open the extension and select **Open Quip**.

Type a question and press `Enter`. Use `Shift+Enter` for a new line and `Esc`
to close the dialog. **Context details** shows the extracted payload and, after
a request, the page sections selected for that question.

## Development Workflow

Keep the API watcher running in one terminal:

```bash
pnpm dev:api
```

The reliable extension development loop is:

```bash
pnpm build:extension
```

Then select **Reload** for Quip in `chrome://extensions` and refresh open website
tabs. Chrome does not replace content scripts already injected into a page.

`pnpm dev:extension` is available for focused content-script work, but it only
watches the content bundle after its initial build. Run `pnpm build:extension`
before a Chrome reload whenever popup, background-worker, manifest, or public
assets may have changed.

Run every repository check before handing off a change:

```bash
pnpm check
```

This verifies formatting, linting, TypeScript, tests, and production builds.

## How It Works

1. The extension popup or background service worker sends an open message to
   the active tab from the extension action, keyboard command, or context menu.
2. The content script captures selected text and nearby content, then extracts
   bounded headings and structured chunks from the page. Specialized adapters
   handle articles, documentation sites, GitHub, and Stack Overflow; other
   pages use the base extractor.
3. Quip ranks chunks using the question and selected text. Exact selection
   matches and nearby sections take priority, including short phrases such as
   `open-loop`; broad questions retain coverage across the page.
4. The dialog sends the bounded payload to the extension's background worker.
   The worker contacts the configured Quip API so requests are not subject to
   the host page's CORS or mixed-content behavior.
5. The Fastify API validates sizes, authentication, provider headers,
   model IDs, and local endpoint restrictions. It builds a prompt that treats
   webpage content as untrusted reference data rather than instructions.
6. The selected provider generates an answer. The API streams it back as
   server-sent events, and the dialog renders the Markdown through a restricted
   allowlist inside a Shadow DOM.

The extension sends only the bounded context shown in **Context details**. In
**Selected text only** mode, page headings, nearby text, visible text, and
structured chunks are omitted.

## Provider and Data Flow

### Self-hosted server

The API uses the provider configured by `LLM_PROVIDER` and the matching
environment key. Quip does not track installation IDs or enforce a lifetime
request allowance. API authentication and rate limiting still apply.

### Personal cloud provider

The provider key is stored in `chrome.storage.local` and sent through the
configured Quip API for each request. The API uses it in memory and does not
persist it. Browser extension storage is not an encrypted secret vault; read
[PRIVACY.md](PRIVACY.md) before distributing the extension.

### Local provider

The extension sends the chosen model ID and loopback base URL to the Quip API.
The API uses its OpenAI-compatible client to contact that endpoint without
requiring a cloud provider key. A remote Quip API cannot connect to a model on
the extension user's laptop through `127.0.0.1`; the model must run on the API
host in that deployment.

### Agent subscriptions

Quip currently calls the OpenAI Chat Completions API, Anthropic Messages API,
or a local OpenAI-compatible endpoint. It does not run Claude Code or Codex,
read their login credentials, or implement a subscription sign-in flow.
Entering a model ID does not add support for an agent or a different API.

To use Claude models, supply an Anthropic API key. To use OpenAI models,
supply an OpenAI API key for a model supported by Chat Completions. Codex
subscription access uses a separate sign-in method from API-key access; see
[official OpenAI authentication documentation](https://developers.openai.com/codex/auth/).
Supporting existing agent subscriptions would require a dedicated integration.

## Troubleshooting

### Could not reach the Quip API

- Confirm `pnpm dev:api` is still running.
- Open `http://127.0.0.1:3000/health` and expect `{"ok":true}`.
- Verify **Advanced server settings → Quip API URL**.
- Use HTTPS for remote APIs. Plain HTTP is accepted only for loopback hosts.

### Changes are not visible in Chrome

Run `pnpm build:extension`, reload Quip in `chrome://extensions`, and refresh
the webpage. Previously injected content scripts continue running until their
tab is refreshed.

### The answer ignores a selection

- Select the text before opening Quip; the context-menu entry is the most
  explicit selection path.
- Open **Context details** and confirm **Selection attached** and the nearby
  passage are present.
- Ask again after refreshing the tab if the extension was just rebuilt.

### The provider rejected the request

- Confirm the selected cloud key can access the configured model.
- Leave the model field blank to return to the displayed default model.
- For a local provider, confirm the model is installed and its OpenAI-compatible
  endpoint is listening on the configured loopback address.
- Check the API terminal for request and provider errors.

### Quip cannot open on a page

Chrome blocks extensions on internal pages such as `chrome://extensions` and
the Chrome Web Store. Test on a normal website tab.

## Environment Variables

| Variable            | Default                    | Purpose                                                   |
| ------------------- | -------------------------- | --------------------------------------------------------- |
| `NODE_ENV`          | `development`              | Set to `production` in deployed environments.             |
| `LLM_PROVIDER`      | `openai`                   | Self-hosted provider: `openai` or `anthropic`.            |
| `OPENAI_API_KEY`    | empty                      | Required when the server provider is OpenAI.              |
| `OPENAI_MODEL`      | `gpt-4o-mini`              | Default server OpenAI model ID.                           |
| `ANTHROPIC_API_KEY` | empty                      | Required when the server provider is Anthropic.           |
| `ANTHROPIC_MODEL`   | `claude-sonnet-4-20250514` | Default server Anthropic model ID.                        |
| `API_HOST`          | `127.0.0.1`                | Address the API listens on. Use `0.0.0.0` in a container. |
| `API_PORT`          | `3000`                     | API port.                                                 |
| `BODY_LIMIT_BYTES`  | `524288`                   | Maximum HTTP request-body size.                           |
| `QUIP_API_KEY`      | empty                      | Optional shared secret for self-hosted API access.        |
| `CORS_ORIGINS`      | open in development        | Comma-separated origins. Required in production.          |
| `RATE_LIMIT_MAX`    | `60`                       | Requests allowed per rate-limit window.                   |
| `RATE_LIMIT_WINDOW` | `1 minute`                 | Fastify rate-limit window.                                |
| `TRUST_PROXY`       | `false`                    | Enable only behind a trusted reverse proxy.               |
| `LOG_LEVEL`         | `info`                     | Fastify/Pino log level.                                   |

`CORS_ORIGINS=*` is convenient for local testing but is not authentication.
Use explicit origins where the deployment model permits it.

## Production Builds

Build the API and extension:

```bash
pnpm build
```

Start the compiled API:

```bash
pnpm --filter @quip/api start
```

Set a remote default API URL when building the extension:

```bash
QUIP_DEFAULT_API_URL=https://api.example.com pnpm build:extension
```

Remote API URLs must use HTTPS. Before deploying a public API, read
[SECURITY.md](SECURITY.md) and
[docs/production-readiness.md](docs/production-readiness.md).

## Repository Layout

```text
apps/
  api/          Fastify API and LLM integrations
  extension/    Chrome Manifest V3 extension
packages/
  shared/       Shared limits, model defaults, ranking, and protocol types
docs/
  architecture.md
  production-readiness.md
```

## Commands

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `pnpm dev:api`         | Start the API with reload.                         |
| `pnpm dev:extension`   | Build the extension and watch the content bundle.  |
| `pnpm build:api`       | Build the shared package and API.                  |
| `pnpm build:extension` | Build every extension entry and copy public files. |
| `pnpm build`           | Build the API and extension.                       |
| `pnpm test`            | Run API and prompt-context tests.                  |
| `pnpm typecheck`       | Type-check every workspace package.                |
| `pnpm lint`            | Run ESLint.                                        |
| `pnpm format:check`    | Verify Prettier formatting.                        |
| `pnpm check`           | Run all checks, tests, and builds.                 |

## Contributing

I'm working on adding support for more LLM providers and existing AI subscriptions.
If you'd like support for a particular provider, subscription, or integration,
please feel free to open a PR!

See [CONTRIBUTING.md](CONTRIBUTING.md). By participating, you agree to follow
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
