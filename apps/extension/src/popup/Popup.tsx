import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DEFAULT_MODELS,
  isLoopbackModelUrl,
  LLM_PROVIDERS,
} from "@shared/models";
import {
  DEFAULT_SETTINGS,
  getStoredSettings,
  validateApiUrl,
  type QuipSettings,
} from "../shared/settings";
import { STORAGE_KEYS } from "../shared/constants";
import "./popup.css";

function Popup() {
  const [settings, setSettings] = useState<QuipSettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    getStoredSettings().then((storedSettings) => {
      setSettings(storedSettings);
      setLoaded(true);
    });
  }, []);

  function updateSettings(patch: Partial<QuipSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setNotice("");
    setError("");
  }

  function saveSettings() {
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
      setError("Your provider API key is required.");
      return;
    }
    if (
      settings.useOwnKey &&
      settings.provider === "local" &&
      !isLoopbackModelUrl(settings.localBaseUrl)
    ) {
      setError("Enter a valid localhost model endpoint.");
      return;
    }

    chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings }, () => {
      setNotice("Settings saved");
      setError("");
      window.setTimeout(() => setNotice(""), 1800);
    });
  }

  async function openQuip() {
    setOpening(true);
    setError("");
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) throw new Error("No active page found.");
      const message = {
        type: "OPEN_QUICK_ASK" as const,
        source: "action-button" as const,
      };
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
        await chrome.tabs.sendMessage(tab.id, message);
      }
      window.close();
    } catch {
      setError("quip cannot open on this page. Try a regular website tab.");
    } finally {
      setOpening(false);
    }
  }

  const providerName =
    settings.provider === "openai"
      ? "OpenAI"
      : settings.provider === "anthropic"
        ? "Anthropic"
        : "Local";
  const defaultModel = DEFAULT_MODELS[settings.provider];
  const resolvedModel = settings.model.trim() || defaultModel;

  if (!loaded) {
    return (
      <main className="popup-shell popup-loading">
        <span className="popup-loader" />
      </main>
    );
  }

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div className="popup-brand">
          <span className="popup-logo" aria-hidden="true">
            q
          </span>
          <span>
            <strong>quip</strong>
            <small>Page intelligence</small>
          </span>
        </div>
        <button
          className="popup-open-button"
          onClick={() => void openQuip()}
          disabled={opening}
        >
          {opening ? "Opening..." : "Open quip"}
          <kbd>⌘K</kbd>
        </button>
      </header>

      <div className="popup-content">
        <section className="popup-connection-card">
          <div className="popup-provider-mark">
            <span>q</span>
          </div>
          <div className="popup-connection-copy">
            <span className="popup-kicker">Model connection</span>
            <strong>
              {settings.useOwnKey ? providerName : "Self-hosted server"}
            </strong>
            <small>
              {settings.useOwnKey
                ? resolvedModel
                : "Uses the provider configured on your quip API"}
            </small>
          </div>
        </section>

        <section className="popup-section">
          <div className="popup-section-heading">
            <span>
              <small>AI connection</small>
              <h2>Choose how quip answers</h2>
            </span>
          </div>

          <div className="popup-mode-switch">
            <button
              className={!settings.useOwnKey ? "is-active" : ""}
              onClick={() => updateSettings({ useOwnKey: false })}
            >
              <span className="popup-mode-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M4 12h16M8 8h.01M8 16h.01" />
                </svg>
              </span>
              <span>
                <strong>Self-hosted server</strong>
                <small>Your server’s provider settings</small>
              </span>
            </button>
            <button
              className={settings.useOwnKey ? "is-active" : ""}
              onClick={() => updateSettings({ useOwnKey: true })}
            >
              <span className="popup-mode-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="8" cy="15" r="4" />
                  <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" />
                </svg>
              </span>
              <span>
                <strong>Own provider</strong>
                <small>Cloud API or local model</small>
              </span>
            </button>
          </div>

          {settings.useOwnKey && (
            <div className="popup-byok-fields">
              <label>
                <span>Provider</span>
                <div className="popup-provider-switch">
                  {LLM_PROVIDERS.map((provider) => (
                    <button
                      key={provider}
                      className={
                        settings.provider === provider ? "is-active" : ""
                      }
                      onClick={() => {
                        if (provider === settings.provider) return;
                        setShowApiKey(false);
                        updateSettings({ provider, model: "", llmApiKey: "" });
                      }}
                    >
                      <b>
                        {provider === "openai"
                          ? "O"
                          : provider === "anthropic"
                            ? "A"
                            : "L"}
                      </b>
                      {provider === "openai"
                        ? "OpenAI"
                        : provider === "anthropic"
                          ? "Anthropic"
                          : "Local"}
                    </button>
                  ))}
                </div>
              </label>

              <label>
                <span>
                  Model ID <i>Optional</i>
                </span>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(event) =>
                    updateSettings({ model: event.target.value })
                  }
                  placeholder={`Default: ${defaultModel}`}
                  spellCheck={false}
                />
                <small>
                  Default model: <code>{defaultModel}</code>. Enter a model ID
                  to override it.
                </small>
              </label>

              {settings.provider === "local" ? (
                <label>
                  <span>Local endpoint</span>
                  <input
                    type="url"
                    value={settings.localBaseUrl}
                    onChange={(event) =>
                      updateSettings({ localBaseUrl: event.target.value })
                    }
                    placeholder="http://127.0.0.1:11434/v1"
                    spellCheck={false}
                  />
                  <small>
                    OpenAI-compatible and loopback-only. The model must run on
                    the quip API host.
                  </small>
                </label>
              ) : (
                <label>
                  <span>API key</span>
                  <div className="popup-secret-input">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={settings.llmApiKey}
                      onChange={(event) =>
                        updateSettings({ llmApiKey: event.target.value })
                      }
                      placeholder={
                        settings.provider === "openai" ? "sk-..." : "sk-ant-..."
                      }
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      onClick={() => setShowApiKey((visible) => !visible)}
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    >
                      <svg viewBox="0 0 24 24">
                        {showApiKey ? (
                          <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 6 9 6a15.7 15.7 0 0 1-2.1 2.8M6.6 6.6C4.3 8.1 3 10 3 10s3.5 6 9 6c1 0 2-.2 2.8-.5" />
                        ) : (
                          <>
                            <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
                            <circle cx="12" cy="12" r="2.5" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  <small>
                    Use a provider API key. Claude Code and Codex subscription
                    sign-in are not connected to quip.
                  </small>
                </label>
              )}

              <div className="popup-privacy-note">
                <svg viewBox="0 0 24 24">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <span>
                  {settings.provider === "local"
                    ? "Local requests stay between your quip API and the loopback model endpoint."
                    : "Stored only in this browser. Your key passes through your quip API for each request and is never persisted there."}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="popup-section">
          <div className="popup-section-heading">
            <span>
              <small>Page context</small>
              <h2>Control what quip can read</h2>
            </span>
          </div>

          <label className="popup-field">
            <span>Context mode</span>
            <select
              value={settings.contextMode}
              onChange={(event) =>
                updateSettings({
                  contextMode: event.target
                    .value as QuipSettings["contextMode"],
                })
              }
            >
              <option value="full">Full page and selected text</option>
              <option value="selected-only">Selected text only</option>
            </select>
          </label>
        </section>

        <details className="popup-advanced">
          <summary>
            <span>
              <svg viewBox="0 0 24 24">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
              </svg>
              Advanced server settings
            </span>
            <svg className="popup-chevron" viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </summary>
          <div className="popup-advanced-content">
            <label className="popup-field">
              <span>quip API URL</span>
              <input
                type="url"
                value={settings.apiUrl}
                onChange={(event) =>
                  updateSettings({ apiUrl: event.target.value })
                }
                placeholder="https://api.your-quip.com"
                spellCheck={false}
              />
            </label>
            <label className="popup-field">
              <span>
                quip server key <i>Optional</i>
              </span>
              <input
                type="password"
                value={settings.quipApiKey}
                onChange={(event) =>
                  updateSettings({ quipApiKey: event.target.value })
                }
                placeholder="Only needed for protected deployments"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>
        </details>
      </div>

      <footer className="popup-footer">
        <span className={error ? "is-error" : notice ? "is-success" : ""}>
          {error || notice || "Changes apply after you save"}
        </span>
        <button className="popup-save-button" onClick={saveSettings}>
          Save settings
        </button>
      </footer>
    </main>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Popup />);
