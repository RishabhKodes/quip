import { useCallback, useEffect, useRef, useState } from "react";
import { selectRelevantPageChunks } from "@shared/contextRanking";
import {
  DEFAULT_MODELS,
  isLoopbackModelUrl,
  normalizeLocalBaseUrl,
} from "@shared/models";
import type { PageContextChunk, PageContextPayload } from "@shared/protocol";
import {
  DEFAULT_SETTINGS,
  getStoredSettings,
  normalizeApiUrl,
  validateApiUrl,
  type QuipSettings,
} from "../../shared/settings";
import { proxyApiStream } from "../../shared/apiProxy";
import { renderMarkdown } from "./markdown";

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  selectedText: string;
  initialContext: PageContextPayload;
  onClose: () => void;
}

const SELECTION_PROMPTS = [
  "Summarize this selection",
  "Explain it simply",
  "What are the key takeaways?",
];

const PAGE_PROMPTS = [
  "Summarize this page",
  "What matters most here?",
  "List the key action items",
];

export function QuickAskDialog({
  selectedText,
  initialContext,
  onClose,
}: Props) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const [lastSentChunks, setLastSentChunks] = useState<
    PageContextChunk[] | null
  >(null);
  const [settings, setSettings] = useState<QuipSettings>(DEFAULT_SETTINGS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getStoredSettings().then(setSettings);
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [question]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversation, currentPrompt, streamingAnswer, error]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  async function ask(promptOverride?: string) {
    const prompt = (promptOverride ?? question).trim();
    if (!prompt || loading) return;

    const apiUrlError = validateApiUrl(settings.apiUrl);
    if (apiUrlError) {
      setError(apiUrlError);
      return;
    }

    if (
      settings.useOwnKey &&
      settings.provider !== "local" &&
      !settings.llmApiKey.trim()
    ) {
      setError("Add your provider API key in Quip settings to continue.");
      return;
    }
    if (
      settings.useOwnKey &&
      settings.provider === "local" &&
      !isLoopbackModelUrl(settings.localBaseUrl)
    ) {
      setError("Set a valid localhost model endpoint to continue.");
      return;
    }

    const history = conversation;
    const requestChunks = selectRelevantPageChunks(
      initialContext.chunks || [],
      prompt,
      selectedText,
      initialContext.nearbyText,
    );
    const requestContext = {
      ...initialContext,
      chunks: requestChunks,
    };
    setLoading(true);
    setError("");
    setCurrentPrompt(prompt);
    setStreamingAnswer("");
    setQuestion("");
    setLastSentChunks(requestChunks);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (settings.quipApiKey.trim()) {
        headers["x-quip-api-key"] = settings.quipApiKey.trim();
      }
      if (settings.useOwnKey) {
        headers["x-quip-llm-provider"] = settings.provider;
        headers["x-quip-llm-model"] =
          settings.model.trim() || DEFAULT_MODELS[settings.provider];
        if (settings.provider === "local") {
          headers["x-quip-llm-base-url"] = normalizeLocalBaseUrl(
            settings.localBaseUrl,
          );
        } else {
          headers["x-quip-llm-api-key"] = settings.llmApiKey.trim();
        }
      }

      let buffer = "";
      let accumulated = "";
      let streamError = "";

      const processEvent = (event: string) => {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (typeof parsed.text === "string") {
              accumulated += parsed.text;
              setStreamingAnswer(accumulated);
            }
            if (typeof parsed.error === "string") {
              streamError = parsed.error;
            }
          } catch {
            // Ignore malformed stream events and continue reading.
          }
        }
      };

      const response = await proxyApiStream(
        {
          url: `${normalizeApiUrl(settings.apiUrl)}/ask`,
          method: "POST",
          headers,
          body: JSON.stringify({
            question: prompt,
            selectedText,
            pageTitle: initialContext.title,
            pageUrl: initialContext.url,
            pageContext: requestContext,
            stream: true,
            conversationHistory: history,
          }),
        },
        (data) => {
          buffer += data;
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          events.forEach(processEvent);
        },
      );

      if (!response.ok) {
        const errorBody = parseJsonObject(response.body);
        throw new Error(
          (typeof errorBody.error === "string" && errorBody.error) ||
            `Quip could not complete the request (${response.status}).`,
        );
      }

      if (buffer.trim()) processEvent(buffer);
      if (streamError) throw new Error(streamError);

      setConversation([
        ...history,
        { role: "user", content: prompt },
        { role: "assistant", content: accumulated },
      ]);
      setCurrentPrompt("");
      setStreamingAnswer("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    if (currentPrompt) void ask(currentPrompt);
  }

  function clearChat() {
    setConversation([]);
    setCurrentPrompt("");
    setStreamingAnswer("");
    setQuestion("");
    setError("");
    setLastSentChunks(null);
    textareaRef.current?.focus();
  }

  async function copyAnswer(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(index);
      window.setTimeout(() => setCopiedMessage(null), 1400);
    } catch {
      setError("Quip could not access the clipboard.");
    }
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ask();
    }
  }

  function choosePrompt(prompt: string) {
    setQuestion(prompt);
    setError("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function openSettings() {
    chrome.runtime.sendMessage({ type: "OPEN_QUIP_SETTINGS" });
  }

  const prompts = selectedText ? SELECTION_PROMPTS : PAGE_PROMPTS;
  const providerLabel =
    settings.provider === "openai"
      ? "OpenAI"
      : settings.provider === "anthropic"
        ? "Anthropic"
        : "Local";
  const resolvedModel =
    settings.model.trim() || DEFAULT_MODELS[settings.provider];
  const pageLabel = initialContext.title || getHostname(initialContext.url);
  const contextPreviewChunks =
    lastSentChunks === null ? initialContext.chunks || [] : lastSentChunks;
  const contextPreviewLabel =
    lastSentChunks === null
      ? "Extracted page sections"
      : "Sections sent for the latest question";
  const previewContext = {
    ...initialContext,
    chunks: contextPreviewChunks,
  };

  return (
    <div className="quip-overlay" onMouseDown={onClose}>
      <section
        className="quip-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Ask Quip about this page"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="quip-header">
          <div className="quip-brand">
            <span className="quip-logo" aria-hidden="true">
              q
            </span>
            <span>
              <strong>Quip</strong>
              <small>Ask the page</small>
            </span>
          </div>

          <div className="quip-header-actions">
            <button
              className="quip-model-pill"
              onClick={openSettings}
              title="Open model settings"
            >
              <span className="quip-status-dot" />
              {settings.useOwnKey
                ? `${providerLabel} · ${resolvedModel}${settings.model.trim() ? "" : " (default)"}`
                : "Self-hosted server"}
            </button>
            {conversation.length > 0 && (
              <button
                className="quip-icon-button"
                onClick={clearChat}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
                </svg>
              </button>
            )}
            <button
              className="quip-icon-button"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close Quip"
            >
              <svg viewBox="0 0 24 24">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="quip-context-bar">
          <button
            className="quip-context-summary"
            onClick={() => setShowSelection(!showSelection)}
            disabled={!selectedText}
          >
            <span className="quip-context-icon">
              {selectedText ? (
                <svg viewBox="0 0 24 24">
                  <path d="M7 4H5a1 1 0 0 0-1 1v2m13-3h2a1 1 0 0 1 1 1v2M7 20H5a1 1 0 0 1-1-1v-2m13 3h2a1 1 0 0 0 1-1v-2M8 9h8m-8 3h8m-8 3h5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M5 4h10l4 4v12H5V4Zm10 0v4h4M8 12h8m-8 4h6" />
                </svg>
              )}
            </span>
            <span className="quip-context-copy">
              <strong>
                {selectedText ? "Selection attached" : "Page context attached"}
              </strong>
              <span>{pageLabel}</span>
            </span>
            {selectedText && (
              <svg
                className={`quip-chevron ${showSelection ? "is-open" : ""}`}
                viewBox="0 0 24 24"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            )}
          </button>
          <button
            className="quip-context-details-button"
            onClick={() => setShowContext(!showContext)}
          >
            {showContext ? "Hide details" : "Context details"}
          </button>
        </div>

        {(showSelection || showContext) && (
          <div className="quip-context-panel">
            {showSelection && selectedText && (
              <div>
                <span className="quip-eyebrow">Selected text</span>
                <p className="quip-selection-preview">
                  {selectedText.slice(0, 2000)}
                </p>
              </div>
            )}
            {showContext && (
              <div className="quip-context-grid">
                <div>
                  <span>Source</span>
                  <strong>{initialContext.adapter || "Web page"}</strong>
                </div>
                <div>
                  <span>Extracted sections</span>
                  <strong>
                    {(initialContext.chunks?.length || 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>Nearby context</span>
                  <strong>
                    {(initialContext.nearbyText?.length || 0).toLocaleString()}{" "}
                    chars
                  </strong>
                </div>
                <div>
                  <span>Fallback text</span>
                  <strong>
                    {(initialContext.visibleText?.length || 0).toLocaleString()}{" "}
                    chars
                  </strong>
                </div>
              </div>
            )}
            {showContext && (
              <div className="quip-context-preview">
                <span className="quip-eyebrow">{contextPreviewLabel}</span>
                {contextPreviewChunks.length > 0 ? (
                  contextPreviewChunks.map((chunk, index) => (
                    <article key={`${chunk.kind}-${index}`}>
                      <strong>
                        {chunk.kind}
                        {chunk.heading ? ` · ${chunk.heading}` : ""}
                      </strong>
                      <p>{chunk.text}</p>
                    </article>
                  ))
                ) : (
                  <p className="quip-context-empty">
                    No structured sections were available; Quip will use the
                    fallback page text.
                  </p>
                )}
                <details className="quip-context-payload">
                  <summary>View raw context payload</summary>
                  <pre>{JSON.stringify(previewContext, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        )}

        <main className="quip-chat" ref={chatRef} aria-live="polite">
          {conversation.length === 0 && !currentPrompt && (
            <div className="quip-empty-state">
              <div className="quip-empty-orb">
                <span />
              </div>
              <h2>
                {selectedText
                  ? "What would you like to know?"
                  : "Explore this page with Quip"}
              </h2>
              <p>
                {selectedText
                  ? "Ask for a summary, explanation, rewrite, or anything else."
                  : "Ask a focused question and Quip will use the page as context."}
              </p>
              <div className="quip-prompt-grid">
                {prompts.map((prompt) => (
                  <button key={prompt} onClick={() => choosePrompt(prompt)}>
                    <span>{prompt}</span>
                    <svg viewBox="0 0 24 24">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversation.map((entry, index) => (
            <article
              key={`${entry.role}-${index}`}
              className={`quip-message quip-message-${entry.role}`}
            >
              <div className="quip-message-avatar">
                {entry.role === "user" ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
                  </svg>
                ) : (
                  <span>Q</span>
                )}
              </div>
              <div className="quip-message-body">
                <div className="quip-message-meta">
                  <strong>{entry.role === "user" ? "You" : "Quip"}</strong>
                  {entry.role === "assistant" && (
                    <button
                      onClick={() => void copyAnswer(entry.content, index)}
                      aria-label="Copy answer"
                    >
                      {copiedMessage === index ? (
                        <>
                          <svg viewBox="0 0 24 24">
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24">
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div
                  className="quip-message-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      entry.role === "assistant"
                        ? renderMarkdown(entry.content)
                        : escapeHtml(entry.content),
                  }}
                />
              </div>
            </article>
          ))}

          {currentPrompt && (
            <article className="quip-message quip-message-user">
              <div className="quip-message-avatar">
                <svg viewBox="0 0 24 24">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
                </svg>
              </div>
              <div className="quip-message-body">
                <div className="quip-message-meta">
                  <strong>You</strong>
                </div>
                <div className="quip-message-content">{currentPrompt}</div>
              </div>
            </article>
          )}

          {currentPrompt && (loading || streamingAnswer) && (
            <article className="quip-message quip-message-assistant">
              <div className="quip-message-avatar">
                <span>Q</span>
              </div>
              <div className="quip-message-body">
                <div className="quip-message-meta">
                  <strong>Quip</strong>
                  {loading && <span className="quip-thinking">Thinking</span>}
                </div>
                {streamingAnswer ? (
                  <div
                    className="quip-message-content"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(streamingAnswer),
                    }}
                  />
                ) : (
                  <div className="quip-typing" aria-label="Quip is thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            </article>
          )}

          {error && (
            <div className="quip-error" role="alert">
              <span className="quip-error-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 8v5m0 3h.01M10.3 4.7 2.7 18a1 1 0 0 0 .87 1.5h16.86a1 1 0 0 0 .87-1.5L13.7 4.7a1 1 0 0 0-1.74 0Z" />
                </svg>
              </span>
              <span>{error}</span>
              <button onClick={openSettings}>Model settings</button>
              {currentPrompt && <button onClick={retry}>Try again</button>}
            </div>
          )}
        </main>

        <footer className="quip-composer-wrap">
          <div className={`quip-composer ${loading ? "is-loading" : ""}`}>
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                selectedText
                  ? "Ask about your selection..."
                  : "Ask anything about this page..."
              }
              rows={1}
              disabled={loading}
              aria-label="Question for Quip"
            />
            <button
              className="quip-send-button"
              onClick={() => void ask()}
              disabled={loading || !question.trim()}
              aria-label="Send question"
            >
              {loading ? (
                <span className="quip-spinner" />
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="m5 12 14-7-4 14-3-6-7-1Zm7 1 7-8" />
                </svg>
              )}
            </button>
          </div>
          <div className="quip-composer-footer">
            <span>
              <kbd>Enter</kbd> send <i>·</i> <kbd>Shift</kbd> + <kbd>Enter</kbd>{" "}
              new line
            </span>
            <button onClick={openSettings}>
              {settings.useOwnKey
                ? `${providerLabel} · ${settings.model.trim() ? "Custom model" : "Default model"}`
                : "Model settings"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Current page";
  }
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
