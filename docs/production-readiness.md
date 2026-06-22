# Production Readiness

The repository defaults are designed for local development and small
single-instance deployments. Complete the following work before operating a
public, server-funded service.

## Required

- Replace `FileFreeUsageStore` with an atomic Redis or database implementation.
- Add real user or device attestation. Client-generated UUIDs can be reset or
  forged and are not sufficient for enforcing a paid quota.
- Serve the API only over TLS.
- Set `NODE_ENV=production`, `API_HOST`, and explicit `CORS_ORIGINS`.
- Configure rate limiting at both the application and edge/proxy layers.
- Store server provider keys in a managed secret store.
- Set log retention and access policies. Secret headers are redacted, but logs
  still contain operational request metadata.
- Publish a hosted privacy policy before Chrome Web Store submission.

## Recommended

- Move quota accounting, request identity, and abuse detection behind an
  authenticated account.
- Add request cancellation so provider streams stop when clients disconnect.
- Add end-to-end extension tests against supported Chrome versions.
- Monitor provider errors, latency, token usage, and quota-store failures.
- Pin a supported provider model through deployment configuration rather than
  relying on repository defaults.
- Review broad webpage permissions and explain them in the store listing.

## BYOK Considerations

Personal provider keys pass through the configured Quip API. They are never
persisted by this implementation, but the API process can access them while a
request is running. Operators must use HTTPS, avoid header/body logging, and
document this processing clearly.
