# Quick Page AI: Build Manifest

A practical, incremental technical plan for building a Cursor-style `Cmd+K` browser assistant that lets a user select text on any webpage, ask a quick question, and get an AI answer grounded in the selected text and page context.

---

## 1. Product Goal

Build a browser extension that behaves like Cursor's quick ask flow, but for webpages.

The user should be able to:

1. Select text on a webpage.
2. Press a keyboard shortcut, for example `Command+K` on macOS or `Ctrl+K` elsewhere.
3. Or right-click the selected text and choose `Ask AI about this`.
4. See a lightweight floating question dialog.
5. Ask a question.
6. Receive an answer that uses:
   - selected text
   - surrounding context
   - page title
   - page URL
   - extracted visible page content
   - optionally, previous questions on the same page

The core value is not just calling an AI model. The core value is context collection and context ranking.

---

## 2. Recommended First Version

Build the MVP as a Chrome Manifest V3 extension with a small backend API.

Use:

- Extension: TypeScript, Vite, React
- Browser platform: Chrome Manifest V3 first
- Backend: Node.js, Fastify or Express
- AI provider: OpenAI, Anthropic, or a model router abstraction
- Storage: none for v0, then local extension storage for settings, then backend database for user accounts and history

Do not start with embeddings, RAG, login, billing, page indexing, or cross-browser support. Those come after the UX works.

---

## 3. Why Browser Extension, Not Bookmarklet or Web App

### Browser extension

Best option because it can:

- read selected text from the active page
- add context menu actions
- register keyboard shortcuts
- inject a floating UI into the page
- communicate with a background service worker
- store user preferences
- later add side panel support

### Bookmarklet

Possible, but poor UX:

- no reliable global shortcut
- no extension storage
- awkward API key handling
- harder to ship a polished product

### Website-only app

Not suitable because it cannot read arbitrary webpage selections or page contents from other domains due to browser security boundaries.

Decision: build a browser extension.

---

## 4. Main User Flows

### Flow A: Right-click selected text

1. User selects text.
2. User right-clicks.
3. Browser context menu shows `Ask AI about this`.
4. User clicks it.
5. Background service worker sends a message to the content script.
6. Content script opens the question dialog.
7. User asks a question.
8. Content script extracts page context.
9. Content script sends payload to background or backend.
10. Backend calls the AI model.
11. Answer is rendered in the dialog.

### Flow B: Keyboard shortcut

1. User selects text.
2. User presses `Command+K` or `Ctrl+K`.
3. Background service worker receives the command.
4. It sends `OPEN_QUICK_ASK` to the active tab.
5. Content script opens the dialog.
6. Remaining steps are same as Flow A.

### Flow C: No selected text

1. User presses shortcut without selection.
2. Dialog still opens.
3. Extension uses page title, URL, visible content, headings, and optionally the current viewport.
4. The dialog placeholder changes to `Ask a question about this page`.

Decision: support selected-text mode first, then page-level mode.

---

## 5. Browser Extension Capabilities Used

### Required APIs

- `commands`: keyboard shortcut registration.
- `contextMenus`: right-click menu item.
- `tabs`: finding the active tab.
- `scripting`: injecting or executing scripts when needed.
- `storage`: storing settings.
- `runtime`: message passing.

### Manifest V3 notes

Chrome Manifest V3 uses a background service worker rather than a persistent background page. This means you should treat the background file as event-driven and avoid relying on long-running in-memory state.

Design decision:

- Keep per-page UI state inside the content script.
- Keep persistent user settings in `chrome.storage.local` or `chrome.storage.sync`.
- Keep API calls either in the background worker or in the content script. Prefer background for centralization, but use content script for direct DOM access.

---

## 6. Permissions Strategy

Start with the minimum useful permissions.

Recommended MVP permissions:

```json
{
  "permissions": [
    "activeTab",
    "contextMenus",
    "scripting",
    "storage"
  ]
}
```

Use `activeTab` where possible instead of requesting `<all_urls>` immediately.

Avoid this in the first public version unless necessary:

```json
{
  "host_permissions": ["<all_urls>"]
}
```

Why?

- It creates scary permission warnings.
- It weakens user trust.
- The extension only needs access when the user explicitly invokes it.

However, for a development build, `<all_urls>` is convenient. For production, move toward explicit user-triggered access.

Decision:

- Dev build: allow broad host permissions for faster testing.
- Production build: prefer `activeTab` and user-triggered access.

---

## 7. Initial `manifest.json`

Create this file at:

```txt
apps/extension/public/manifest.json
```

Example:

```json
{
  "manifest_version": 3,
  "name": "Quick Page AI",
  "description": "Ask AI quick questions about selected text and webpage context.",
  "version": "0.1.0",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "permissions": [
    "activeTab",
    "contextMenus",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ],
  "background": {
    "service_worker": "src/background/background.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["src/content/content.ts"],
      "run_at": "document_idle"
    }
  ],
  "commands": {
    "open-quick-ask": {
      "suggested_key": {
        "default": "Ctrl+K",
        "mac": "Command+K"
      },
      "description": "Ask AI about selected webpage text"
    }
  },
  "action": {
    "default_title": "Quick Page AI"
  }
}
```

Important build note:

Vite will not ship TypeScript source directly as extension runtime files unless configured. In practice, your final built manifest usually points to compiled JS files, for example:

```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["content.js"]
    }
  ]
}
```

Use a browser-extension Vite plugin or custom Rollup config to produce these files.

---

## 8. Monorepo Directory Layout

Recommended structure:

```txt
quick-page-ai/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  .env.example
  README.md

  apps/
    extension/
      package.json
      vite.config.ts
      tsconfig.json
      public/
        manifest.json
        icons/
          icon-16.png
          icon-48.png
          icon-128.png
      src/
        background/
          background.ts
          contextMenu.ts
          commands.ts
          messaging.ts
        content/
          content.ts
          selection.ts
          contextExtractor.ts
          pageAdapters/
            baseAdapter.ts
            githubAdapter.ts
            docsAdapter.ts
          dialog/
            mountDialog.tsx
            QuickAskDialog.tsx
            dialog.css
          messaging/
            messageTypes.ts
        popup/
          Popup.tsx
          popup.html
        sidepanel/
          SidePanel.tsx
          sidepanel.html
        shared/
          constants.ts
          errors.ts

    api/
      package.json
      tsconfig.json
      src/
        server.ts
        config.ts
        routes/
          ask.ts
          health.ts
        services/
          llm/
            llmClient.ts
            openaiClient.ts
            anthropicClient.ts
            modelRouter.ts
          context/
            limitContext.ts
            rankContext.ts
            buildPrompt.ts
          security/
            rateLimit.ts
            cors.ts
            auth.ts
        types/
          ask.ts

  packages/
    shared/
      package.json
      src/
        types.ts
        protocol.ts
        limits.ts
```

### Why this layout

- `apps/extension` contains all browser-specific code.
- `apps/api` contains backend and model-calling code.
- `packages/shared` contains shared request and response types.
- `content` owns DOM access.
- `background` owns extension-level events like shortcut and context menu.
- `api` owns secrets and AI provider calls.

Decision: use monorepo because the extension and backend share payload types.

---

## 9. Message Protocol

Define shared message types.

File:

```txt
packages/shared/src/protocol.ts
```

```ts
export type OpenQuickAskMessage = {
  type: "OPEN_QUICK_ASK";
  source: "keyboard" | "context-menu" | "action-button";
  selectedTextFromMenu?: string;
};

export type AskAIRequest = {
  question: string;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  pageContext: PageContextPayload;
};

export type PageContextPayload = {
  title: string;
  url: string;
  selectedText: string;
  nearbyText?: string;
  visibleText?: string;
  headings?: string[];
  metadata?: Record<string, string>;
  adapter?: "base" | "github" | "docs";
};

export type AskAIResponse = {
  answer: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};
```

Design decision:

Keep the protocol explicit. Do not pass raw DOM data or arbitrary objects between extension layers.

---

## 10. Background Service Worker

Responsibilities:

- Register context menu.
- Listen for context menu clicks.
- Listen for keyboard shortcut commands.
- Send messages to the active tab.
- Optionally proxy API calls.

File:

```txt
apps/extension/src/background/background.ts
```

```ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-ai-selection",
    title: "Ask AI about this",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "ask-ai-selection") return;
  if (!tab?.id) return;

  await chrome.tabs.sendMessage(tab.id, {
    type: "OPEN_QUICK_ASK",
    source: "context-menu",
    selectedTextFromMenu: info.selectionText,
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-quick-ask") return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) return;

  await chrome.tabs.sendMessage(tab.id, {
    type: "OPEN_QUICK_ASK",
    source: "keyboard",
  });
});
```

Potential problem:

If the content script is not loaded on the page, `sendMessage` may fail.

Mitigation:

- Use `content_scripts` in the manifest for normal pages.
- For pages where the content script was not injected, call `chrome.scripting.executeScript` before sending the message.
- Ignore restricted pages such as `chrome://`.

---

## 11. Content Script

Responsibilities:

- Receive `OPEN_QUICK_ASK`.
- Read selection from the page.
- Extract context.
- Mount the dialog.
- Send the final question payload to the backend.

File:

```txt
apps/extension/src/content/content.ts
```

```ts
import { getSelectedText } from "./selection";
import { extractPageContext } from "./contextExtractor";
import { mountQuickAskDialog } from "./dialog/mountDialog";

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "OPEN_QUICK_ASK") return;

  const selectedText =
    getSelectedText() || message.selectedTextFromMenu || "";

  const initialContext = extractPageContext({ selectedText });

  mountQuickAskDialog({
    selectedText,
    initialContext,
  });
});
```

---

## 12. Selection Extraction

File:

```txt
apps/extension/src/content/selection.ts
```

```ts
export function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  return selection.toString().trim();
}

export function getSelectionRange(): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0);
}
```

Do not depend only on `info.selectionText` from the context menu because selected text exposed through context menu APIs can be limited or less reliable than reading the live selection in the content script.

Decision: always try `window.getSelection()` first.

---

## 13. Context Extraction Strategy

### MVP extraction

File:

```txt
apps/extension/src/content/contextExtractor.ts
```

```ts
export function extractPageContext(input: { selectedText: string }) {
  const title = document.title || "";
  const url = window.location.href;
  const visibleText = document.body?.innerText || "";
  const headings = Array.from(
    document.querySelectorAll("h1, h2, h3")
  )
    .map((h) => h.textContent?.trim())
    .filter(Boolean)
    .slice(0, 40) as string[];

  return {
    title,
    url,
    selectedText: input.selectedText,
    visibleText: visibleText.slice(0, 50000),
    headings,
    adapter: "base" as const,
  };
}
```

### Better extraction

Add:

- text around the selected range
- parent block text
- sibling block text
- article extraction
- page-specific adapters

Recommended context ranking priority:

1. Selected text
2. DOM block containing the selected text
3. Previous and next sibling blocks
4. Current viewport text
5. Main article text
6. Headings
7. Full visible text fallback

### Nearby context extraction

```ts
export function getNearbyText(selectedText: string, fullText: string): string {
  if (!selectedText) return "";

  const index = fullText.indexOf(selectedText);
  if (index === -1) return "";

  const beforeStart = Math.max(0, index - 4000);
  const afterEnd = Math.min(fullText.length, index + selectedText.length + 4000);

  return fullText.slice(beforeStart, afterEnd);
}
```

Decision: start with text-based nearby extraction, then improve with DOM Range-based extraction.

---

## 14. Context Size Limits

Never blindly send unlimited page text.

Suggested limits:

```ts
export const LIMITS = {
  selectedTextChars: 12000,
  nearbyTextChars: 10000,
  visibleTextChars: 50000,
  headingsCount: 40,
  finalPromptChars: 70000,
};
```

Why:

- Keeps latency predictable.
- Reduces cost.
- Reduces privacy exposure.
- Avoids model context overflow.

Final context priority if content is too large:

1. selected text, never drop unless empty
2. user question, never drop
3. nearby text
4. title and URL
5. headings
6. visible text

Decision: context should be intentionally selected, not dumped.

---

## 15. Dialog UI

Recommended UI:

- floating centered command palette
- selected text preview collapsed by default
- textarea input
- submit button
- streaming answer area
- close button
- keyboard controls

Keyboard behavior:

- `Escape`: close
- `Command+Enter` or `Ctrl+Enter`: submit
- `Command+K`: toggle open

Mount with Shadow DOM to avoid page CSS conflicts.

File:

```txt
apps/extension/src/content/dialog/mountDialog.tsx
```

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { QuickAskDialog } from "./QuickAskDialog";

export function mountQuickAskDialog(props: any) {
  const existing = document.getElementById("quick-page-ai-root");
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = "quick-page-ai-root";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const app = document.createElement("div");
  shadow.appendChild(app);

  createRoot(app).render(
    <QuickAskDialog
      {...props}
      onClose={() => host.remove()}
    />
  );
}
```

Decision: use Shadow DOM because extension UIs frequently break when injected into arbitrary pages.

---

## 16. Ask Dialog Component

File:

```txt
apps/extension/src/content/dialog/QuickAskDialog.tsx
```

```tsx
import { useState } from "react";

export function QuickAskDialog({ selectedText, initialContext, onClose }: any) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("http://localhost:3000/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          selectedText,
          pageTitle: initialContext.title,
          pageUrl: initialContext.url,
          pageContext: initialContext,
        }),
      });

      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer("Something went wrong while asking AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="quick-ai-overlay">
      <div className="quick-ai-dialog">
        <div className="quick-ai-header">
          <strong>Ask AI</strong>
          <button onClick={onClose}>×</button>
        </div>

        {selectedText && (
          <div className="quick-ai-selection-preview">
            {selectedText.slice(0, 500)}
          </div>
        )}

        <textarea
          autoFocus
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the selected text..."
        />

        <button onClick={ask} disabled={loading}>
          {loading ? "Asking..." : "Ask"}
        </button>

        {answer && <div className="quick-ai-answer">{answer}</div>}
      </div>
    </div>
  );
}
```

Production improvements:

- streaming answer
- markdown rendering
- copy button
- retry button
- follow-up questions
- model selector
- prompt presets

---

## 17. Backend API

Backend responsibilities:

- hold AI provider API keys
- validate request payloads
- limit context size
- build prompt
- call model
- return answer
- enforce rate limits

Never ship your AI API key inside the browser extension.

File:

```txt
apps/api/src/server.ts
```

```ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import { askRoute } from "./routes/ask";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => ({ ok: true }));
app.register(askRoute, { prefix: "/api" });

await app.listen({ port: 3000, host: "0.0.0.0" });
```

File:

```txt
apps/api/src/routes/ask.ts
```

```ts
import type { FastifyInstance } from "fastify";
import { buildPrompt } from "../services/context/buildPrompt";
import { callLLM } from "../services/llm/llmClient";

export async function askRoute(app: FastifyInstance) {
  app.post("/ask", async (request, reply) => {
    const body = request.body as any;

    if (!body.question || typeof body.question !== "string") {
      return reply.code(400).send({ error: "Question is required" });
    }

    const prompt = buildPrompt({
      question: body.question,
      selectedText: body.selectedText || "",
      pageTitle: body.pageTitle || "",
      pageUrl: body.pageUrl || "",
      pageContext: body.pageContext || {},
    });

    const answer = await callLLM(prompt);

    return {
      answer,
    };
  });
}
```

---

## 18. Prompt Design

File:

```txt
apps/api/src/services/context/buildPrompt.ts
```

```ts
export function buildPrompt(input: {
  question: string;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  pageContext: any;
}) {
  return `
You are an AI assistant answering a user's quick question about a webpage.

Rules:
- Use the selected text and page context as your primary source.
- If the answer is not supported by the provided context, say what is missing.
- Do not pretend to have read parts of the page that were not provided.
- Be concise unless the user asks for depth.
- If the selected text is code, explain it technically and accurately.

Page title:
${input.pageTitle}

Page URL:
${input.pageUrl}

Selected text:
${input.selectedText}

Headings:
${(input.pageContext.headings || []).join("\n")}

Nearby or visible page context:
${input.pageContext.nearbyText || input.pageContext.visibleText || ""}

User question:
${input.question}
`.trim();
}
```

Design decision:

The prompt must explicitly tell the model to admit insufficient context. This prevents false confidence.

---

## 19. AI Provider Abstraction

File:

```txt
apps/api/src/services/llm/llmClient.ts
```

```ts
export async function callLLM(prompt: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER || "openai";

  if (provider === "openai") {
    return callOpenAI(prompt);
  }

  if (provider === "anthropic") {
    return callAnthropic(prompt);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
```

Keep model-specific code isolated so you can switch providers without touching extension code.

Environment variables:

```txt
LLM_PROVIDER=openai
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

Decision: backend owns model selection.

---

## 20. Iterative Build Plan

## Phase 0: Project setup

Goal: create the repo and run extension plus API locally.

Tasks:

1. Create monorepo.
2. Add `apps/extension`.
3. Add `apps/api`.
4. Add shared TypeScript config.
5. Add linting and formatting.
6. Add `.env.example`.

Done when:

- API returns `{ ok: true }` from `/health`.
- Extension loads in Chrome Developer Mode.

---

## Phase 1: Right-click selection MVP

Goal: prove selected text can open AI dialog.

Tasks:

1. Add `contextMenus` permission.
2. Register `Ask AI about this` menu item.
3. Listen to menu click.
4. Send message to content script.
5. Read selection in content script.
6. Render a simple dialog.
7. Show selected text inside dialog.

Done when:

- User selects text.
- Right-click menu appears.
- Clicking menu opens dialog.
- Dialog shows selected text.

No AI yet.

---

## Phase 2: Basic AI call

Goal: ask a question using selected text.

Tasks:

1. Add textarea and submit button.
2. Add backend `/api/ask` route.
3. Send selected text and question to backend.
4. Backend builds prompt.
5. Backend calls AI provider.
6. Dialog displays answer.

Done when:

- User can ask `Explain this`.
- AI answers based on selected text.

---

## Phase 3: Page context

Goal: improve answer relevance with page context.

Tasks:

1. Extract `document.title`.
2. Extract `window.location.href`.
3. Extract headings.
4. Extract `document.body.innerText`.
5. Limit visible text to 50k characters.
6. Send structured context payload.
7. Update prompt to include context.

Done when:

- AI can answer questions requiring nearby page context.

---

## Phase 4: Keyboard shortcut

Goal: support `Command+K` and `Ctrl+K`.

Tasks:

1. Add `commands` entry to manifest.
2. Listen to `chrome.commands.onCommand`.
3. Find active tab.
4. Send `OPEN_QUICK_ASK` to content script.
5. Reuse existing dialog mount logic.

Done when:

- User selects text.
- Presses `Command+K`.
- Dialog opens.

Caveat:

Some pages use `Command+K` themselves. Let users change the shortcut later.

---

## Phase 5: UI polish

Goal: make it feel like a command palette.

Tasks:

1. Use Shadow DOM.
2. Add keyboard controls.
3. Add loading state.
4. Add markdown rendering.
5. Add copy answer button.
6. Add selected text preview collapse.
7. Add error messages.
8. Add retry.

Done when:

- UI works across arbitrary webpages without CSS conflicts.

---

## Phase 6: Context ranking

Goal: avoid sending huge irrelevant page text.

Tasks:

1. Implement nearby text extraction.
2. Extract parent DOM block.
3. Extract previous and next blocks.
4. Use headings as structural hints.
5. Add a context builder that orders context by relevance.
6. Drop low-value text when size exceeds limit.

Done when:

- Long pages produce focused prompts.
- Cost and latency are stable.

---

## Phase 7: Page adapters

Goal: support important page types better.

Start with:

- GitHub
- documentation pages
- Stack Overflow
- blog/article pages

### GitHub adapter

Extract:

- repository name
- file path
- selected code
- surrounding function or block
- visible comments if on PR page

### Docs adapter

Extract:

- current heading hierarchy
- selected section
- nearby examples
- code blocks

Done when:

- GitHub and docs pages feel much better than generic pages.

---

## Phase 8: Follow-up chat per page

Goal: allow continued questioning.

Tasks:

1. Store temporary conversation state in content script.
2. Include previous user question and AI answer in next request.
3. Add `Clear chat` button.
4. Optionally persist per page in `chrome.storage.session` or backend.

Done when:

- User can ask follow-up questions without restating context.

---

## Phase 9: Privacy and settings

Goal: make it safe and trustworthy.

Tasks:

1. Add settings page or popup.
2. Add blocked domains.
3. Add `Do not send full page context` toggle.
4. Add `Selected text only` mode.
5. Add visible indicator of what context will be sent.
6. Add local-only mode placeholder if using local models later.

Done when:

- User controls what gets sent to the backend.

---

## Phase 10: Production readiness

Goal: make it deployable.

Tasks:

1. Add auth if public.
2. Add rate limiting.
3. Add request logging without storing sensitive page content.
4. Add abuse prevention.
5. Add CORS restrictions.
6. Add billing or usage limits if needed.
7. Add automated tests.
8. Add Chrome Web Store-ready metadata.
9. Remove dev-only broad permissions where possible.

Done when:

- Extension can be distributed safely.

---

## 21. Security and Privacy Decisions

### Do not expose provider API keys

Never put OpenAI, Anthropic, or any paid model API key in the extension bundle.

### Do not auto-read pages

Only collect context when the user explicitly triggers the extension.

### Do not store page content by default

Default behavior:

- process context transiently
- do not persist selected text
- do not persist full page text

### Add sensitive-site protections

Consider warning or disabling full context on:

- banking sites
- email clients
- healthcare portals
- internal company tools
- password managers
- government sites

### Show context transparency

Add a `View context being sent` section.

Decision: trust is a product feature.

---

## 22. Known Limitations

### Restricted browser pages

Extensions cannot run normally on pages like:

- `chrome://...`
- Chrome Web Store pages
- some browser settings pages
- some extension pages

### PDF pages

Browser PDF viewers are not normal DOM pages. Support PDFs later using a dedicated pipeline.

### Google Docs, Notion, Figma

These apps may not expose meaningful text through `document.body.innerText`. They may require custom adapters or official integrations.

### Keyboard shortcut conflicts

`Command+K` is often used by websites for search or command palettes. Provide user guidance and let users customize shortcuts through browser extension shortcut settings.

---

## 23. Testing Plan

### Manual test pages

Test on:

- Wikipedia article
- GitHub source file
- GitHub PR
- MDN documentation
- Stack Overflow answer
- random blog post
- news article
- long documentation page
- page with no selection

### Test cases

1. Right-click works with selected text.
2. Shortcut works with selected text.
3. Shortcut works without selected text.
4. Dialog closes on Escape.
5. Dialog does not inherit page CSS.
6. Long page does not exceed context limit.
7. API errors are displayed nicely.
8. Restricted pages fail gracefully.
9. Sensitive domains can be blocked.

---

## 24. Minimal Development Commands

Use `pnpm`.

```bash
pnpm install
pnpm --filter extension dev
pnpm --filter api dev
```

Chrome loading steps:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click `Load unpacked`.
4. Select the extension build output directory, usually `apps/extension/dist`.
5. Pin the extension if needed.
6. Test on a normal `https://` page.

---

## 25. Definition of Done for MVP

The MVP is done when this works end-to-end:

1. Select text on a webpage.
2. Right-click.
3. Choose `Ask AI about this`.
4. Dialog opens.
5. Ask `Explain this in simple terms`.
6. Backend receives selected text, page title, URL, and page context.
7. AI response appears in the dialog.
8. `Command+K` opens the same dialog.
9. No API key is exposed in the extension.
10. Page content is sent only after explicit user action.

---

## 26. Recommended Technical Defaults

Use these defaults unless there is a reason not to:

```txt
Extension language: TypeScript
Extension UI: React
Build tool: Vite
Browser target first: Chrome Manifest V3
Backend: Node.js + Fastify
AI provider abstraction: yes
Storage in MVP: no backend database
Settings storage: chrome.storage.local
UI injection: Shadow DOM
Initial context method: selected text + title + URL + headings + body.innerText slice
Initial trigger: context menu first, keyboard shortcut second
```

---

## 27. Long-term Product Direction

After the MVP works, the strongest differentiators are:

1. Better context extraction.
2. Site-specific adapters.
3. Follow-up chat grounded in the same page.
4. Transparent privacy controls.
5. Developer-focused context for GitHub, docs, issues, logs, and PRs.
6. Local model support for private pages.

The best version of this product is not a generic AI wrapper. It is a browser-native contextual assistant that understands what the user selected and what page they are on.
