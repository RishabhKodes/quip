# Contributing

## Development

1. Install Node.js 20 or newer and pnpm 9.
2. Run `pnpm install --frozen-lockfile`.
3. Copy `.env.example` to `.env` and configure a provider.
4. Create a focused branch and keep unrelated changes out of the patch.

Before opening a pull request, run:

```bash
pnpm check
```

## Pull Requests

- Explain the user-visible behavior and technical approach.
- Add or update tests for changed API behavior.
- Document new environment variables, permissions, or privacy implications.
- Do not commit `.env`, provider keys, generated `dist` files, local usage
  data, or browser profiles.
- Keep dependency upgrades separate from feature changes when practical.

## Security

Follow [SECURITY.md](SECURITY.md) for vulnerability reports. Never put secrets
or private webpage content in an issue or fixture.
