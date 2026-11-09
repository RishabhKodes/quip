export function getDialogStyles(): string {
  return `
    :host {
      color-scheme: light;
    }

    * {
      box-sizing: border-box;
    }

    ::selection {
      background: rgba(187, 220, 206, .45);
    }

    button,
    textarea {
      font: inherit;
    }

    button {
      -webkit-tap-highlight-color: transparent;
    }

    .quip-overlay {
      --paper: #fffcf0;
      --paper-rgb: 255, 252, 240;
      --paper-secondary: #f2f0e5;
      --ink: #100f0f;
      --muted: #6f6e69;
      --faint: #b7b5ac;
      --ui: #e6e4d9;
      --ui-hover: #dad8ce;
      --ui-active: #cecdc3;
      --action: #24837b;
      --action-hover: #3aa99f;
      --action-wash: #ddf1e4;
      --positive: #66800b;
      --negative: #af3029;
      --negative-wash: #ffe1d5;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: clamp(28px, 8vh, 76px) 20px 24px;
      background: rgba(16, 15, 15, .52);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "IBM Plex Sans", "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-synthesis: none;
      line-height: 1.5;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      animation: quip-overlay-in 120ms ease-out;
    }

    .quip-dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      width: min(700px, 100%);
      max-height: min(790px, calc(100vh - clamp(52px, 12vh, 100px)));
      overflow: hidden;
      border: 1px solid var(--ui-active);
      border-radius: 6px;
      background: var(--paper);
      box-shadow: 0 12px 36px rgba(16, 15, 15, .24);
      animation: quip-dialog-in 140ms ease-out;
    }

    .quip-header {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      min-height: 62px;
      padding: 13px 18px;
      border-bottom: 1px solid var(--ui);
      background: var(--paper);
    }

    .quip-brand,
    .quip-header-actions,
    .quip-context-summary,
    .quip-message,
    .quip-message-meta,
    .quip-composer-footer {
      display: flex;
      align-items: center;
    }

    .quip-brand {
      gap: 8px;
    }

    .quip-logo {
      display: grid;
      width: 24px;
      height: 24px;
      place-items: center;
      color: var(--action);
      font-size: 23px;
      font-weight: 600;
      line-height: 1;
    }

    .quip-brand > span:last-child {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .quip-brand strong {
      color: var(--ink);
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -.01em;
    }

    .quip-brand small {
      margin-top: 2px;
      color: var(--muted);
      font-size: 10px;
    }

    .quip-header-actions {
      gap: 6px;
    }

    .quip-model-pill,
    .quip-icon-button,
    .quip-context-details-button,
    .quip-message-meta button,
    .quip-error button,
    .quip-composer-footer button {
      border: 0;
      cursor: pointer;
    }

    .quip-model-pill {
      display: flex;
      align-items: center;
      max-width: 250px;
      gap: 7px;
      overflow: hidden;
      padding: 4px 0;
      border-bottom: 1px solid var(--ui-active);
      background: transparent;
      color: var(--muted);
      font-size: 10px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quip-model-pill:hover {
      border-color: var(--action);
      color: var(--action);
    }

    .quip-status-dot {
      flex: 0 0 auto;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--action);
    }

    .quip-icon-button {
      display: grid;
      width: 30px;
      height: 30px;
      padding: 0;
      place-items: center;
      border-radius: 3px;
      background: transparent;
      color: var(--muted);
    }

    .quip-icon-button:hover {
      background: var(--paper-secondary);
      color: var(--action);
    }

    .quip-model-pill:focus-visible,
    .quip-icon-button:focus-visible,
    .quip-context-details-button:focus-visible,
    .quip-prompt-grid button:focus-visible,
    .quip-message-meta button:focus-visible,
    .quip-error button:focus-visible,
    .quip-send-button:focus-visible,
    .quip-composer-footer button:focus-visible {
      outline: 2px solid var(--action);
      outline-offset: 2px;
    }

    .quip-icon-button svg,
    .quip-context-icon svg,
    .quip-chevron,
    .quip-prompt-grid svg,
    .quip-message-avatar svg,
    .quip-message-meta button svg,
    .quip-error-icon svg,
    .quip-send-button svg {
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    .quip-icon-button svg {
      width: 16px;
    }

    .quip-context-bar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      border-bottom: 1px solid var(--ui);
      background: var(--paper-secondary);
    }

    .quip-context-summary {
      min-width: 0;
      gap: 9px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: left;
    }

    .quip-context-summary:not(:disabled) {
      cursor: pointer;
    }

    .quip-context-icon {
      display: grid;
      flex: 0 0 auto;
      width: 25px;
      height: 25px;
      place-items: center;
      color: var(--action);
    }

    .quip-context-icon svg {
      width: 15px;
    }

    .quip-context-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      line-height: 1.25;
    }

    .quip-context-copy strong {
      color: var(--ink);
      font-size: 10px;
      font-weight: 550;
    }

    .quip-context-copy span {
      max-width: 420px;
      margin-top: 2px;
      overflow: hidden;
      color: var(--muted);
      font-size: 9px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quip-chevron {
      width: 13px;
      color: var(--muted);
      transition: transform 160ms;
    }

    .quip-chevron.is-open {
      transform: rotate(90deg);
    }

    .quip-context-details-button {
      flex: 0 0 auto;
      padding: 3px 0;
      border-bottom: 1px solid var(--ui-active);
      background: transparent;
      color: var(--muted);
      font-size: 9px;
    }

    .quip-context-details-button:hover {
      border-color: var(--action);
      color: var(--action);
    }

    .quip-context-panel {
      display: grid;
      flex: 0 0 auto;
      gap: 16px;
      max-height: 290px;
      overflow-y: auto;
      padding: 16px 18px 18px;
      border-bottom: 1px solid var(--ui);
      background: var(--paper-secondary);
      animation: quip-panel-in 150ms ease-out;
    }

    .quip-eyebrow,
    .quip-context-grid span {
      color: var(--muted);
      font-size: 9px;
      font-weight: 500;
    }

    .quip-selection-preview {
      max-height: 96px;
      margin: 7px 0 0;
      overflow-y: auto;
      color: var(--ink);
      font-size: 11px;
      line-height: 1.55;
      white-space: pre-wrap;
    }

    .quip-context-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--ui);
      border-bottom: 1px solid var(--ui);
    }

    .quip-context-grid > div {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
      padding: 9px 10px;
      border-right: 1px solid var(--ui);
    }

    .quip-context-grid > div:last-child {
      border-right: 0;
    }

    .quip-context-grid strong {
      overflow: hidden;
      color: var(--ink);
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quip-context-preview {
      display: grid;
      gap: 0;
    }

    .quip-context-preview > .quip-eyebrow {
      margin-bottom: 7px;
    }

    .quip-context-preview article {
      padding: 9px 0;
      border-top: 1px solid var(--ui);
      background: transparent;
    }

    .quip-context-preview article strong {
      color: var(--action);
      font-size: 9px;
      font-weight: 550;
      text-transform: capitalize;
    }

    .quip-context-preview article p,
    .quip-context-empty {
      margin: 4px 0 0;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .quip-context-payload {
      border-top: 1px solid var(--ui);
      border-bottom: 1px solid var(--ui);
      background: transparent;
    }

    .quip-context-payload summary {
      padding: 8px 0;
      color: var(--muted);
      cursor: pointer;
      font-size: 9px;
    }

    .quip-context-payload summary:hover {
      color: var(--action);
    }

    .quip-context-payload pre {
      max-height: 180px;
      margin: 0;
      overflow: auto;
      padding: 0 0 10px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .quip-chat {
      min-height: 250px;
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 24px 24px 22px;
      scroll-behavior: smooth;
    }

    .quip-empty-state {
      display: flex;
      min-height: 300px;
      align-items: flex-start;
      justify-content: center;
      flex-direction: column;
      text-align: left;
    }

    .quip-empty-orb {
      position: relative;
      display: grid;
      width: 28px;
      height: 28px;
      margin-bottom: 14px;
      place-items: center;
    }

    .quip-empty-orb::after,
    .quip-empty-orb::before,
    .quip-empty-orb span {
      position: absolute;
      content: "";
      background: var(--action);
    }

    .quip-empty-orb::before {
      width: 22px;
      height: 1px;
      transform: rotate(45deg);
    }

    .quip-empty-orb::after {
      width: 1px;
      height: 22px;
      transform: rotate(45deg);
    }

    .quip-empty-orb span {
      top: 1px;
      right: 1px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }

    .quip-empty-state h2 {
      margin: 0;
      color: var(--ink);
      font-size: 21px;
      font-weight: 500;
      letter-spacing: -.02em;
      line-height: 1.25;
    }

    .quip-empty-state > p {
      max-width: 470px;
      margin: 7px 0 22px;
      color: var(--muted);
      font-size: 12px;
    }

    .quip-prompt-grid {
      display: grid;
      width: min(100%, 520px);
      border-top: 1px solid var(--ui);
    }

    .quip-prompt-grid button {
      display: flex;
      min-height: 42px;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 2px;
      border: 0;
      border-bottom: 1px solid var(--ui);
      background: transparent;
      color: var(--ink);
      cursor: pointer;
      font-size: 11px;
      text-align: left;
    }

    .quip-prompt-grid button:hover {
      color: var(--action);
    }

    .quip-prompt-grid button span {
      text-decoration: underline;
      text-decoration-color: var(--ui-active);
      text-underline-offset: 3px;
    }

    .quip-prompt-grid button:hover span {
      text-decoration-color: var(--action);
    }

    .quip-prompt-grid svg {
      flex: 0 0 auto;
      width: 13px;
      color: var(--muted);
    }

    .quip-message {
      align-items: flex-start;
      gap: 12px;
      animation: quip-message-in 180ms ease-out;
    }

    .quip-message + .quip-message {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--ui);
    }

    .quip-message-avatar {
      display: grid;
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      place-items: center;
      color: var(--muted);
    }

    .quip-message-avatar svg {
      width: 15px;
    }

    .quip-message-assistant .quip-message-avatar {
      color: var(--action);
    }

    .quip-message-avatar span {
      font-size: 20px;
      font-weight: 600;
      line-height: 1;
    }

    .quip-message-body {
      min-width: 0;
      flex: 1;
    }

    .quip-message-meta {
      min-height: 22px;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .quip-message-meta strong {
      color: var(--muted);
      font-size: 9px;
      font-weight: 550;
    }

    .quip-message-assistant .quip-message-meta strong {
      color: var(--action);
    }

    .quip-message-meta button {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 0;
      border-bottom: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      font-size: 9px;
    }

    .quip-message-meta button:hover {
      border-color: var(--action);
      color: var(--action);
    }

    .quip-message-meta button svg {
      width: 12px;
    }

    .quip-thinking {
      margin-left: auto;
      color: var(--muted);
      font-size: 9px;
    }

    .quip-thinking::after {
      content: "...";
      animation: quip-thinking 1.2s steps(4, end) infinite;
    }

    .quip-message-content {
      color: var(--ink);
      font-size: 13px;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .quip-message-user .quip-message-content {
      color: var(--muted);
    }

    .quip-message-content p {
      margin: 0 0 10px;
    }

    .quip-message-content p:last-child {
      margin-bottom: 0;
    }

    .quip-message-content ul,
    .quip-message-content ol {
      margin: 8px 0;
      padding-left: 19px;
    }

    .quip-message-content li + li {
      margin-top: 4px;
    }

    .quip-message-content li::marker {
      color: var(--faint);
    }

    .quip-message-content h1,
    .quip-message-content h2,
    .quip-message-content h3 {
      margin: 18px 0 7px;
      color: var(--ink);
      font-size: 14px;
      font-weight: 550;
      letter-spacing: -.015em;
      line-height: 1.3;
    }

    .quip-message-content code {
      padding: 1px 3px;
      border-radius: 3px;
      background: var(--paper-secondary);
      color: var(--ink);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
    }

    .quip-message-content pre {
      margin: 12px 0;
      overflow-x: auto;
      padding: 12px;
      border: 1px solid var(--ui);
      border-radius: 4px;
      background: var(--paper-secondary);
    }

    .quip-message-content pre code {
      padding: 0;
      background: transparent;
    }

    .quip-message-content blockquote {
      margin: 12px 0;
      padding: 3px 0 3px 14px;
      border-left: 2px solid var(--ink);
      color: var(--muted);
    }

    .quip-message-content a {
      color: var(--ink);
      text-decoration: underline;
      text-decoration-color: var(--ui-active);
      text-underline-offset: 2px;
    }

    .quip-message-content a:hover {
      color: var(--action);
      text-decoration-color: var(--action);
    }

    .quip-message-content table {
      width: 100%;
      margin: 12px 0;
      border-collapse: collapse;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .quip-message-content tr {
      border-bottom: 1px solid var(--ui);
    }

    .quip-message-content th,
    .quip-message-content td {
      padding: 7px 10px 7px 0;
      border: 0;
      text-align: left;
    }

    .quip-message-content th {
      color: var(--ink);
      font-weight: 600;
    }

    .quip-typing {
      display: flex;
      height: 26px;
      align-items: center;
      gap: 4px;
    }

    .quip-typing span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--action);
      animation: quip-bounce 1s infinite ease-in-out;
    }

    .quip-typing span:nth-child(2) { animation-delay: 120ms; }
    .quip-typing span:nth-child(3) { animation-delay: 240ms; }

    .quip-error {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 20px;
      padding: 10px 11px;
      border-left: 2px solid var(--negative);
      background: var(--negative-wash);
      color: var(--negative);
      font-size: 10px;
    }

    .quip-error > span:nth-child(2) {
      flex: 1;
    }

    .quip-error-icon {
      display: grid;
      place-items: center;
    }

    .quip-error-icon svg {
      width: 15px;
    }

    .quip-error button {
      flex: 0 0 auto;
      padding: 4px 0;
      border-bottom: 1px solid currentColor;
      background: transparent;
      color: inherit;
      font-size: 9px;
    }

    .quip-composer-wrap {
      flex: 0 0 auto;
      padding: 13px 18px 12px;
      border-top: 1px solid var(--ui);
      background: var(--paper);
    }

    .quip-composer {
      display: flex;
      align-items: flex-end;
      gap: 9px;
      padding: 4px 0 5px;
      border-bottom: 1px solid var(--ui-active);
      background: transparent;
      transition: border-color 120ms;
    }

    .quip-composer:focus-within {
      border-color: var(--action);
    }

    .quip-composer textarea {
      min-height: 31px;
      max-height: 132px;
      flex: 1;
      resize: none;
      padding: 6px 0 3px;
      overflow-y: auto;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ink);
      font-size: 12px;
      line-height: 1.5;
    }

    .quip-composer textarea::placeholder {
      color: var(--muted);
    }

    .quip-composer textarea:disabled {
      cursor: not-allowed;
      opacity: .5;
    }

    .quip-send-button {
      display: grid;
      width: 32px;
      height: 32px;
      flex: 0 0 auto;
      padding: 0;
      place-items: center;
      border: 1px solid var(--ink);
      border-radius: 3px;
      background: var(--ink);
      color: var(--paper);
      cursor: pointer;
    }

    .quip-send-button:hover:not(:disabled) {
      border-color: var(--action);
      background: var(--action);
    }

    .quip-send-button:disabled {
      cursor: not-allowed;
      opacity: .25;
    }

    .quip-send-button svg {
      width: 15px;
    }

    .quip-spinner {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(var(--paper-rgb), .3);
      border-top-color: var(--paper);
      border-radius: 50%;
      animation: quip-spin .7s linear infinite;
    }

    .quip-composer-footer {
      justify-content: space-between;
      margin-top: 8px;
      color: var(--muted);
      font-size: 9px;
    }

    .quip-composer-footer kbd {
      padding: 1px 3px;
      border: 1px solid var(--ui-active);
      border-radius: 3px;
      background: var(--paper-secondary);
      color: var(--muted);
      font-family: inherit;
    }

    .quip-composer-footer i {
      margin: 0 3px;
      font-style: normal;
    }

    .quip-composer-footer button {
      padding: 2px 0;
      border-bottom: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      font-size: 9px;
    }

    .quip-composer-footer button:hover {
      border-color: var(--action);
      color: var(--action);
    }

    .quip-chat::-webkit-scrollbar,
    .quip-context-panel::-webkit-scrollbar,
    .quip-selection-preview::-webkit-scrollbar,
    .quip-composer textarea::-webkit-scrollbar,
    .quip-message-content pre::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }

    .quip-chat::-webkit-scrollbar-track,
    .quip-context-panel::-webkit-scrollbar-track,
    .quip-selection-preview::-webkit-scrollbar-track,
    .quip-composer textarea::-webkit-scrollbar-track,
    .quip-message-content pre::-webkit-scrollbar-track {
      background: transparent;
    }

    .quip-chat::-webkit-scrollbar-thumb,
    .quip-context-panel::-webkit-scrollbar-thumb,
    .quip-selection-preview::-webkit-scrollbar-thumb,
    .quip-composer textarea::-webkit-scrollbar-thumb,
    .quip-message-content pre::-webkit-scrollbar-thumb {
      background: var(--ui-active);
    }

    @keyframes quip-overlay-in {
      from { opacity: 0; }
    }

    @keyframes quip-dialog-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes quip-panel-in {
      from { opacity: 0; transform: translateY(-4px); }
    }

    @keyframes quip-message-in {
      from { opacity: 0; }
    }

    @keyframes quip-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: .35; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    @keyframes quip-thinking {
      0% { clip-path: inset(0 100% 0 0); }
      100% { clip-path: inset(0 0 0 0); }
    }

    @keyframes quip-spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        color-scheme: dark;
      }

      .quip-overlay {
        --paper: #100f0f;
        --paper-rgb: 16, 15, 15;
        --paper-secondary: #1c1b1a;
        --ink: #cecdc3;
        --muted: #878580;
        --faint: #575653;
        --ui: #282726;
        --ui-hover: #343331;
        --ui-active: #403e3c;
        --action: #3aa99f;
        --action-hover: #24837b;
        --action-wash: #101f1d;
        --positive: #879a39;
        --negative: #d14d41;
        --negative-wash: #261312;
        background: rgba(16, 15, 15, .72);
      }

      ::selection {
        background: rgba(30, 95, 91, .45);
      }
    }

    @media (max-width: 620px) {
      .quip-overlay {
        align-items: flex-end;
        padding: 10px;
      }

      .quip-dialog {
        max-height: calc(100vh - 20px);
        border-radius: 6px;
      }

      .quip-header {
        padding-right: 13px;
        padding-left: 13px;
      }

      .quip-model-pill {
        max-width: 116px;
      }

      .quip-context-bar,
      .quip-composer-wrap {
        padding-right: 13px;
        padding-left: 13px;
      }

      .quip-chat {
        padding-right: 16px;
        padding-left: 16px;
      }

      .quip-context-grid {
        grid-template-columns: 1fr 1fr;
      }

      .quip-context-grid > div:nth-child(2) {
        border-right: 0;
      }

      .quip-context-grid > div:nth-child(-n + 2) {
        border-bottom: 1px solid var(--ui);
      }

      .quip-empty-state h2 {
        font-size: 19px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .quip-overlay,
      .quip-dialog,
      .quip-context-panel,
      .quip-message,
      .quip-typing span,
      .quip-spinner {
        animation: none !important;
      }

      .quip-chat {
        scroll-behavior: auto;
      }
    }
  `;
}
