# Quip - Quick Page AI

A browser extension that lets you select text on any webpage, press `Cmd+K` (or `Ctrl+K`), and ask AI questions grounded in the selected text and page context.

## Project Structure

```
quip/
  apps/
    api/          # Fastify backend (handles LLM calls)
    extension/    # Chrome extension (React + Vite)
  packages/
    shared/       # Shared types and constants
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

## Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/RishabhKodes/quip.git
cd quip
pnpm install
```

2. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then fill in your API keys:

```
LLM_PROVIDER=openai           # "openai" or "anthropic"
OPENAI_API_KEY=                # required if using openai
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=             # required if using anthropic
ANTHROPIC_MODEL=claude-sonnet-4-20250514
API_PORT=3000
QUIP_API_KEY=                  # optional, protects the API with a shared secret
CORS_ORIGINS=                  # optional, comma-separated allowed origins
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW=1 minute
```

## Development

Start the API server (watches for changes):

```bash
pnpm dev:api
```

Build the browser extension (and watch for content script changes):

```bash
pnpm dev:extension
```

## Loading the Extension in Chrome

1. Run `pnpm build:extension` (or `pnpm dev:extension`)
2. Open `chrome://extensions`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `apps/extension/dist` directory

## Usage

1. Select text on any webpage
2. Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux), or right-click and choose "Ask AI about this"
3. Type your question in the floating dialog
4. Get an AI answer grounded in the selected text and page context

The extension popup (`Cmd+Shift+K` or click the extension icon) lets you configure:
- LLM provider and API key
- API server URL
- Model selection

## Scripts

| Command | Description |
|---|---|
| `pnpm dev:api` | Start API server with hot reload |
| `pnpm dev:extension` | Build extension and watch for changes |
| `pnpm build:api` | Compile API to `apps/api/dist` |
| `pnpm build:extension` | Build extension to `apps/extension/dist` |
| `pnpm --filter @quip/api test` | Run API tests |
| `pnpm --filter @quip/api test:watch` | Run API tests in watch mode |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm lint` | Lint with ESLint |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | Yes | `openai` or `anthropic` |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key |
| `OPENAI_MODEL` | No | OpenAI model (default: `gpt-4o-mini`) |
| `ANTHROPIC_API_KEY` | If using Anthropic | Anthropic API key |
| `ANTHROPIC_MODEL` | No | Anthropic model (default: `claude-sonnet-4-20250514`) |
| `API_PORT` | No | Server port (default: `3000`) |
| `QUIP_API_KEY` | No | Shared secret to protect the API |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: `60`) |
| `RATE_LIMIT_WINDOW` | No | Rate limit window (default: `1 minute`) |
