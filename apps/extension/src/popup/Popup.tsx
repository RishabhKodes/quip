import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  DEFAULT_SETTINGS,
  DEFAULT_USAGE,
  getOrCreateClientId,
  getStoredSettings,
  getStoredUsage,
  normalizeApiUrl,
  storeUsage,
  validateApiUrl,
  type LlmProvider,
  type QuipSettings,
  type UsageStatus,
} from "../shared/settings";
import { STORAGE_KEYS } from "../shared/constants";
import "./popup.css";

function Popup() {
  const [settings, setSettings] = useState<QuipSettings>(DEFAULT_SETTINGS);
  const [usage, setUsage] = useState<UsageStatus>(DEFAULT_USAGE);
  const [newDomain, setNewDomain] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    Promise.all([getStoredSettings(), getStoredUsage()]).then(
      ([storedSettings, storedUsage]) => {
        setSettings(storedSettings);
        setUsage(storedUsage);
        setLoaded(true);
        void refreshUsage(storedSettings);
      },
    );
  }, []);

  const usagePercent = useMemo(
    () => Math.min((usage.used / Math.max(usage.limit, 1)) * 100, 100),
    [usage],
  );

  function updateSettings(patch: Partial<QuipSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setNotice("");
    setError("");
  }

  async function refreshUsage(settingsToUse = settings) {
    if (validateApiUrl(settingsToUse.apiUrl)) return;

    try {
      const clientId = await getOrCreateClientId();
      const headers: Record<string, string> = {
        "x-quip-client-id": clientId,
      };
      if (settingsToUse.quipApiKey.trim()) {
        headers["x-quip-api-key"] = settingsToUse.quipApiKey.trim();
      }

      const response = await fetch(
        `${normalizeApiUrl(settingsToUse.apiUrl)}/usage`,
        { headers },
      );
      if (!response.ok) return;
      const nextUsage = (await response.json()) as UsageStatus;
      setUsage(nextUsage);
      storeUsage(nextUsage);
    } catch {
      // Cached usage remains available while the Quip API is offline.
    }
  }

  function saveSettings() {
    const apiUrlError = validateApiUrl(settings.apiUrl);
    if (apiUrlError) {
      setError(apiUrlError);
      return;
    }
    if (
      settings.useOwnKey &&
      (!settings.model.trim() || !settings.llmApiKey.trim())
    ) {
      setError("Your provider, model, and API key are required.");
      return;
    }

    chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings }, () => {
      setNotice("Settings saved");
      setError("");
      window.setTimeout(() => setNotice(""), 1800);
      void refreshUsage(settings);
    });
  }

  function addDomain() {
    const domain = newDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!domain || settings.blockedDomains.includes(domain)) return;
    updateSettings({
      blockedDomains: [...settings.blockedDomains, domain],
    });
    setNewDomain("");
  }

  function removeDomain(domain: string) {
    updateSettings({
      blockedDomains: settings.blockedDomains.filter(
        (blockedDomain) => blockedDomain !== domain,
      ),
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
      setError("Quip cannot open on this page. Try a regular website tab.");
    } finally {
      setOpening(false);
    }
  }

  const providerName = settings.provider === "openai" ? "OpenAI" : "Anthropic";

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
          <span className="popup-logo">
            <svg viewBox="0 0 24 24">
              <path d="M7.5 5.75A6.25 6.25 0 0 1 18.16 10.2c0 1.78-.75 3.39-1.96 4.53l1.05 2.77-3.07-.58A6.25 6.25 0 1 1 7.5 5.75Z" />
              <path d="m9.5 11.7 1.65 1.65 3.55-3.75" />
            </svg>
          </span>
          <span>
            <strong>Quip</strong>
            <small>Quick page intelligence</small>
          </span>
        </div>
        <button
          className="popup-open-button"
          onClick={() => void openQuip()}
          disabled={opening}
        >
          {opening ? "Opening..." : "Open Quip"}
          <kbd>⌘K</kbd>
        </button>
      </header>

      <div className="popup-content">
        <section className="popup-usage-card">
          {settings.useOwnKey ? (
            <>
              <div className="popup-provider-mark">
                <span>{settings.provider === "openai" ? "O" : "A"}</span>
              </div>
              <div className="popup-usage-copy">
                <span className="popup-kicker">Personal model connected</span>
                <strong>{settings.model || providerName}</strong>
                <small>Requests use your {providerName} API key</small>
              </div>
              <span className="popup-connected">Active</span>
            </>
          ) : (
            <>
              <div
                className="popup-usage-ring"
                style={
                  { "--usage": `${usagePercent * 3.6}deg` } as CSSProperties
                }
              >
                <span>{usage.remaining}</span>
              </div>
              <div className="popup-usage-copy">
                <span className="popup-kicker">Free requests</span>
                <strong>
                  {usage.remaining} of {usage.limit} remaining
                </strong>
                <small>Add your own key anytime for unlimited use</small>
              </div>
            </>
          )}
        </section>

        <section className="popup-section">
          <div className="popup-section-heading">
            <span>
              <small>AI connection</small>
              <h2>Choose how Quip answers</h2>
            </span>
          </div>

          <div className="popup-mode-switch">
            <button
              className={!settings.useOwnKey ? "is-active" : ""}
              onClick={() => updateSettings({ useOwnKey: false })}
            >
              <span className="popup-mode-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3v18M8 7h6.5a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h6" />
                </svg>
              </span>
              <span>
                <strong>Quip Free</strong>
                <small>10 included requests</small>
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
                <strong>Use my key</strong>
                <small>Your provider account</small>
              </span>
            </button>
          </div>

          {settings.useOwnKey && (
            <div className="popup-byok-fields">
              <label>
                <span>Provider</span>
                <div className="popup-provider-switch">
                  {(["openai", "anthropic"] as LlmProvider[]).map(
                    (provider) => (
                      <button
                        key={provider}
                        className={
                          settings.provider === provider ? "is-active" : ""
                        }
                        onClick={() => updateSettings({ provider })}
                      >
                        <b>{provider === "openai" ? "O" : "A"}</b>
                        {provider === "openai" ? "OpenAI" : "Anthropic"}
                      </button>
                    ),
                  )}
                </div>
              </label>

              <label>
                <span>Model ID</span>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(event) =>
                    updateSettings({ model: event.target.value })
                  }
                  placeholder={
                    settings.provider === "openai"
                      ? "Enter your OpenAI model ID"
                      : "Enter your Anthropic model ID"
                  }
                  spellCheck={false}
                />
                <small>
                  Use any chat model enabled for your provider account.
                </small>
              </label>

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
                        <>
                          <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 6 9 6a15.7 15.7 0 0 1-2.1 2.8M6.6 6.6C4.3 8.1 3 10 3 10s3.5 6 9 6c1 0 2-.2 2.8-.5" />
                        </>
                      ) : (
                        <>
                          <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>

              <div className="popup-privacy-note">
                <svg viewBox="0 0 24 24">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <span>
                  Stored only in this browser. Your key passes through your Quip
                  API for each request and is never persisted there.
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="popup-section">
          <div className="popup-section-heading">
            <span>
              <small>Page context</small>
              <h2>Control what Quip can read</h2>
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

          <label className="popup-field">
            <span>Blocked domains</span>
            <div className="popup-domain-input">
              <input
                type="text"
                value={newDomain}
                onChange={(event) => setNewDomain(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addDomain();
                  }
                }}
                placeholder="example.com"
                spellCheck={false}
              />
              <button onClick={addDomain}>Add</button>
            </div>
          </label>

          {settings.blockedDomains.length > 0 && (
            <div className="popup-domain-list">
              {settings.blockedDomains.map((domain) => (
                <span key={domain}>
                  {domain}
                  <button
                    onClick={() => removeDomain(domain)}
                    aria-label={`Remove ${domain}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
              <span>Quip API URL</span>
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
                Quip server key <i>Optional</i>
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
