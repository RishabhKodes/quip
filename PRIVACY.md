# Privacy

This document describes the behavior of the source code in this repository.
Operators distributing a modified or hosted version are responsible for
publishing a policy that reflects their deployment.

## Data Read by the Extension

Quip can read selected text, page title, page URL, headings, nearby text, and a
bounded amount of visible page text when the user opens the dialog. A
selected-text-only mode and blocked-domain list are available in settings.

## Data Sent to the API

When the user submits a question, the extension sends the question, extracted
page context, conversation history, and an installation ID to the configured
Quip API. The API forwards the prompt to the selected model provider.

## Personal Provider Keys

Personal OpenAI or Anthropic keys are stored in `chrome.storage.local`. They are
sent to the configured Quip API for requests made in personal-key mode. The API
uses them in memory and does not intentionally persist them.

Chrome local storage is not an encrypted password manager. Anyone with access
to the browser profile or a sufficiently privileged local process may be able
to read stored extension data.

## Server Storage

The included API stores only free-request counters keyed by installation ID in
the configured usage store. It does not include analytics, accounts, or
conversation persistence. Model providers process requests under their own
terms and retention policies.

## Deletion

Removing the extension deletes its local settings according to browser
behavior. A self-hosted operator must define how server-side quota records are
removed.
