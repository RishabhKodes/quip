export function getDialogStyles(): string {
  return `
    :host {
      color-scheme: dark;
    }

    * {
      box-sizing: border-box;
    }

    button,
    textarea {
      font: inherit;
    }

    button {
      -webkit-tap-highlight-color: transparent;
    }

    .quip-overlay {
      --purple-50: #f5f3ff;
      --purple-300: #c4b5fd;
      --purple-400: #a78bfa;
      --purple-500: #8b5cf6;
      --purple-600: #7c3aed;
      --purple-700: #6d28d9;
      --surface: #111016;
      --surface-raised: #18161f;
      --surface-soft: #201d29;
      --border: rgba(255, 255, 255, 0.09);
      --border-strong: rgba(167, 139, 250, 0.32);
      --text: #f7f5fb;
      --text-soft: #c8c3d0;
      --muted: #8d8797;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: clamp(28px, 8vh, 84px) 20px 24px;
      background:
        radial-gradient(circle at 50% 12%, rgba(124, 58, 237, 0.16), transparent 34%),
        rgba(7, 6, 10, 0.68);
      backdrop-filter: blur(8px);
      color: var(--text);
      font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.5;
      animation: quip-overlay-in 180ms ease-out;
    }

    .quip-dialog {
      position: relative;
      display: flex;
      flex-direction: column;
      width: min(680px, 100%);
      max-height: min(780px, calc(100vh - clamp(52px, 12vh, 108px)));
      overflow: hidden;
      border: 1px solid rgba(196, 181, 253, 0.18);
      border-radius: 20px;
      background:
        linear-gradient(145deg, rgba(255,255,255,0.025), transparent 28%),
        var(--surface);
      box-shadow:
        0 36px 100px rgba(0, 0, 0, 0.62),
        0 0 0 1px rgba(0, 0, 0, 0.55),
        0 0 80px rgba(109, 40, 217, 0.12);
      animation: quip-dialog-in 220ms cubic-bezier(.2,.8,.2,1);
    }

    .quip-dialog::before {
      position: absolute;
      top: 0;
      left: 12%;
      width: 76%;
      height: 1px;
      content: "";
      background: linear-gradient(90deg, transparent, rgba(196,181,253,.58), transparent);
      pointer-events: none;
    }

    .quip-header {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      min-height: 70px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      background: rgba(17, 16, 22, 0.92);
    }

    .quip-brand,
    .quip-header-actions,
    .quip-context-summary,
    .quip-message,
    .quip-message-meta,
    .quip-composer-footer,
    .quip-quota-gate {
      display: flex;
      align-items: center;
    }

    .quip-brand {
      gap: 11px;
    }

    .quip-logo {
      display: grid;
      width: 38px;
      height: 38px;
      place-items: center;
      border: 1px solid rgba(196,181,253,.26);
      border-radius: 12px;
      background: linear-gradient(145deg, #8b5cf6, #5b21b6);
      box-shadow: 0 8px 22px rgba(109,40,217,.32), inset 0 1px 0 rgba(255,255,255,.28);
    }

    .quip-logo svg {
      width: 23px;
      fill: rgba(255,255,255,.1);
      stroke: white;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }

    .quip-brand > span:last-child {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .quip-brand strong {
      font-size: 15px;
      font-weight: 680;
      letter-spacing: -.01em;
    }

    .quip-brand small {
      margin-top: 3px;
      color: var(--muted);
      font-size: 11px;
    }

    .quip-header-actions {
      gap: 6px;
    }

    .quip-plan-pill,
    .quip-icon-button,
    .quip-context-details-button,
    .quip-message-meta button,
    .quip-error button,
    .quip-quota-gate button,
    .quip-composer-footer button {
      border: 0;
      cursor: pointer;
    }

    .quip-plan-pill {
      display: flex;
      align-items: center;
      max-width: 220px;
      height: 30px;
      gap: 7px;
      overflow: hidden;
      padding: 0 10px;
      border: 1px solid rgba(167,139,250,.18);
      border-radius: 999px;
      background: rgba(124,58,237,.1);
      color: var(--purple-300);
      font-size: 11px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: background 150ms, border-color 150ms;
    }

    .quip-plan-pill:hover {
      border-color: rgba(167,139,250,.38);
      background: rgba(124,58,237,.18);
    }

    .quip-status-dot {
      flex: 0 0 auto;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--purple-400);
      box-shadow: 0 0 0 3px rgba(167,139,250,.1);
    }

    .quip-icon-button {
      display: grid;
      width: 32px;
      height: 32px;
      padding: 0;
      place-items: center;
      border-radius: 9px;
      background: transparent;
      color: #777180;
      transition: color 150ms, background 150ms;
    }

    .quip-icon-button:hover {
      background: rgba(255,255,255,.06);
      color: var(--text);
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
      width: 17px;
    }

    .quip-context-bar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 18px;
      border-bottom: 1px solid var(--border);
      background: rgba(24, 22, 31, .7);
    }

    .quip-context-summary {
      min-width: 0;
      gap: 10px;
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
      width: 30px;
      height: 30px;
      place-items: center;
      border: 1px solid rgba(167,139,250,.16);
      border-radius: 9px;
      background: rgba(124,58,237,.09);
      color: var(--purple-400);
    }

    .quip-context-icon svg {
      width: 16px;
    }

    .quip-context-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      line-height: 1.25;
    }

    .quip-context-copy strong {
      color: var(--text-soft);
      font-size: 11px;
      font-weight: 650;
    }

    .quip-context-copy span {
      max-width: 390px;
      margin-top: 3px;
      overflow: hidden;
      color: #777180;
      font-size: 10px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quip-chevron {
      width: 14px;
      color: #696273;
      transition: transform 160ms;
    }

    .quip-chevron.is-open {
      transform: rotate(90deg);
    }

    .quip-context-details-button {
      flex: 0 0 auto;
      padding: 5px 8px;
      border-radius: 7px;
      background: transparent;
      color: #777180;
      font-size: 10px;
    }

    .quip-context-details-button:hover {
      background: rgba(255,255,255,.05);
      color: var(--text-soft);
    }

    .quip-context-panel {
      display: grid;
      flex: 0 0 auto;
      gap: 12px;
      max-height: 190px;
      overflow-y: auto;
      padding: 12px 18px 14px;
      border-bottom: 1px solid var(--border);
      background: #0d0c11;
      animation: quip-panel-in 150ms ease-out;
    }

    .quip-eyebrow,
    .quip-context-grid span {
      color: #777180;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .quip-selection-preview {
      max-height: 88px;
      margin: 7px 0 0;
      overflow-y: auto;
      color: #aaa4b1;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 10px;
      line-height: 1.65;
      white-space: pre-wrap;
    }

    .quip-context-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .quip-context-grid > div {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 9px 10px;
      border: 1px solid var(--border);
      border-radius: 9px;
      background: rgba(255,255,255,.025);
    }

    .quip-context-grid strong {
      color: var(--text-soft);
      font-size: 11px;
      font-weight: 550;
    }

    .quip-chat {
      min-height: 230px;
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 22px 22px 18px;
      scroll-behavior: smooth;
    }

    .quip-empty-state {
      display: flex;
      min-height: 285px;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      text-align: center;
    }

    .quip-empty-orb {
      position: relative;
      display: grid;
      width: 48px;
      height: 48px;
      margin-bottom: 15px;
      place-items: center;
      border: 1px solid rgba(196,181,253,.25);
      border-radius: 16px;
      background: radial-gradient(circle at 35% 25%, #a78bfa, #6d28d9 52%, #3b0764);
      box-shadow: 0 12px 34px rgba(109,40,217,.28), inset 0 1px 1px rgba(255,255,255,.35);
      transform: rotate(-5deg);
    }

    .quip-empty-orb::after,
    .quip-empty-orb::before,
    .quip-empty-orb span {
      position: absolute;
      content: "";
      border-radius: 50%;
      background: white;
    }

    .quip-empty-orb::before {
      width: 15px;
      height: 2px;
      transform: rotate(45deg);
    }

    .quip-empty-orb::after {
      width: 2px;
      height: 15px;
      transform: rotate(45deg);
    }

    .quip-empty-orb span {
      top: 9px;
      right: 9px;
      width: 4px;
      height: 4px;
      opacity: .75;
    }

    .quip-empty-state h2 {
      margin: 0;
      color: var(--text);
      font-size: 17px;
      font-weight: 660;
      letter-spacing: -.02em;
    }

    .quip-empty-state > p {
      max-width: 420px;
      margin: 7px 0 17px;
      color: var(--muted);
      font-size: 12px;
    }

    .quip-prompt-grid {
      display: grid;
      width: min(100%, 510px);
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .quip-prompt-grid button {
      display: flex;
      min-height: 56px;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 11px;
      border: 1px solid var(--border);
      border-radius: 11px;
      background: rgba(255,255,255,.025);
      color: #aaa4b1;
      cursor: pointer;
      font-size: 10px;
      text-align: left;
      transition: transform 150ms, border-color 150ms, background 150ms, color 150ms;
    }

    .quip-prompt-grid button:hover {
      border-color: var(--border-strong);
      background: rgba(124,58,237,.08);
      color: var(--purple-300);
      transform: translateY(-1px);
    }

    .quip-prompt-grid svg {
      flex: 0 0 auto;
      width: 13px;
    }

    .quip-message {
      align-items: flex-start;
      gap: 11px;
      animation: quip-message-in 180ms ease-out;
    }

    .quip-message + .quip-message {
      margin-top: 22px;
    }

    .quip-message-avatar {
      display: grid;
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      place-items: center;
      border: 1px solid var(--border);
      border-radius: 9px;
      background: var(--surface-soft);
      color: #98919f;
    }

    .quip-message-avatar svg {
      width: 15px;
    }

    .quip-message-assistant .quip-message-avatar {
      border-color: rgba(167,139,250,.28);
      background: linear-gradient(145deg, #7c3aed, #5b21b6);
      color: white;
      box-shadow: 0 7px 18px rgba(109,40,217,.2);
    }

    .quip-message-avatar span {
      font-size: 11px;
      font-weight: 750;
    }

    .quip-message-body {
      min-width: 0;
      flex: 1;
      padding-top: 2px;
    }

    .quip-message-meta {
      min-height: 22px;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .quip-message-meta strong {
      color: #a9a3b1;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .045em;
      text-transform: uppercase;
    }

    .quip-message-assistant .quip-message-meta strong {
      color: var(--purple-400);
    }

    .quip-message-meta button {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 6px;
      border-radius: 6px;
      background: transparent;
      color: #6e6877;
      font-size: 9px;
    }

    .quip-message-meta button:hover {
      background: rgba(255,255,255,.05);
      color: var(--text-soft);
    }

    .quip-message-meta button svg {
      width: 12px;
    }

    .quip-thinking {
      margin-left: auto;
      color: #6e6877;
      font-size: 9px;
    }

    .quip-thinking::after {
      content: "...";
      animation: quip-thinking 1.2s steps(4, end) infinite;
    }

    .quip-message-content {
      color: #d2cdd7;
      font-size: 12px;
      line-height: 1.75;
      overflow-wrap: anywhere;
    }

    .quip-message-user .quip-message-content {
      color: #b9b3c0;
    }

    .quip-message-content p {
      margin: 0 0 9px;
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

    .quip-message-content h1,
    .quip-message-content h2,
    .quip-message-content h3 {
      margin: 15px 0 7px;
      color: var(--text);
      font-size: 13px;
      line-height: 1.35;
    }

    .quip-message-content code {
      padding: 2px 5px;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 5px;
      background: #25212d;
      color: #d8b4fe;
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 10px;
    }

    .quip-message-content pre {
      margin: 10px 0;
      overflow-x: auto;
      padding: 11px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #0a090d;
    }

    .quip-message-content pre code {
      padding: 0;
      border: 0;
      background: transparent;
      color: #cfc9d5;
    }

    .quip-message-content blockquote {
      margin: 10px 0;
      padding: 4px 0 4px 12px;
      border-left: 2px solid var(--purple-600);
      color: #aaa4b1;
    }

    .quip-message-content a {
      color: var(--purple-300);
      text-decoration: none;
    }

    .quip-message-content a:hover {
      text-decoration: underline;
    }

    .quip-message-content table {
      width: 100%;
      margin: 10px 0;
      border-collapse: collapse;
    }

    .quip-message-content th,
    .quip-message-content td {
      padding: 7px 8px;
      border: 1px solid var(--border);
      text-align: left;
    }

    .quip-message-content th {
      background: var(--surface-soft);
      color: var(--text);
    }

    .quip-typing {
      display: flex;
      height: 26px;
      align-items: center;
      gap: 4px;
    }

    .quip-typing span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--purple-400);
      animation: quip-bounce 1s infinite ease-in-out;
    }

    .quip-typing span:nth-child(2) { animation-delay: 120ms; }
    .quip-typing span:nth-child(3) { animation-delay: 240ms; }

    .quip-error {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 18px;
      padding: 10px 11px;
      border: 1px solid rgba(248,113,113,.2);
      border-radius: 10px;
      background: rgba(127,29,29,.14);
      color: #fca5a5;
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
      width: 16px;
    }

    .quip-error button {
      flex: 0 0 auto;
      padding: 5px 8px;
      border-radius: 6px;
      background: rgba(248,113,113,.12);
      color: #fecaca;
      font-size: 9px;
      font-weight: 650;
    }

    .quip-composer-wrap {
      flex: 0 0 auto;
      padding: 12px 18px 13px;
      border-top: 1px solid var(--border);
      background: rgba(17,16,22,.97);
      box-shadow: 0 -14px 30px rgba(0,0,0,.14);
    }

    .quip-quota-gate {
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      padding: 10px 11px;
      border: 1px solid rgba(167,139,250,.2);
      border-radius: 11px;
      background: rgba(124,58,237,.1);
    }

    .quip-quota-gate div {
      display: flex;
      flex-direction: column;
    }

    .quip-quota-gate strong {
      color: var(--purple-300);
      font-size: 10px;
    }

    .quip-quota-gate span {
      margin-top: 2px;
      color: #8d8797;
      font-size: 9px;
    }

    .quip-quota-gate button {
      flex: 0 0 auto;
      padding: 7px 9px;
      border-radius: 7px;
      background: var(--purple-600);
      color: white;
      font-size: 9px;
      font-weight: 650;
    }

    .quip-composer {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 8px 8px 8px 12px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 13px;
      background: #0b0a0e;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.02);
      transition: border-color 150ms, box-shadow 150ms;
    }

    .quip-composer:focus-within {
      border-color: rgba(167,139,250,.48);
      box-shadow: 0 0 0 3px rgba(124,58,237,.1);
    }

    .quip-composer textarea {
      min-height: 30px;
      max-height: 132px;
      flex: 1;
      resize: none;
      padding: 6px 0 4px;
      overflow-y: auto;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--text);
      font-size: 12px;
      line-height: 1.55;
    }

    .quip-composer textarea::placeholder {
      color: #5f5967;
    }

    .quip-composer textarea:disabled {
      cursor: not-allowed;
      opacity: .5;
    }

    .quip-send-button {
      display: grid;
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      padding: 0;
      place-items: center;
      border: 0;
      border-radius: 10px;
      background: linear-gradient(145deg, #8b5cf6, #6d28d9);
      box-shadow: 0 7px 18px rgba(109,40,217,.24), inset 0 1px 0 rgba(255,255,255,.22);
      color: white;
      cursor: pointer;
      transition: transform 150ms, filter 150ms, opacity 150ms;
    }

    .quip-send-button:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: translateY(-1px);
    }

    .quip-send-button:disabled {
      cursor: not-allowed;
      opacity: .34;
      box-shadow: none;
    }

    .quip-send-button svg {
      width: 16px;
    }

    .quip-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,.28);
      border-top-color: white;
      border-radius: 50%;
      animation: quip-spin .7s linear infinite;
    }

    .quip-composer-footer {
      justify-content: space-between;
      margin-top: 7px;
      padding: 0 2px;
      color: #5f5967;
      font-size: 8px;
    }

    .quip-composer-footer kbd {
      padding: 1px 3px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 3px;
      background: rgba(255,255,255,.035);
      color: #827b8b;
      font-family: inherit;
    }

    .quip-composer-footer i {
      margin: 0 3px;
      font-style: normal;
    }

    .quip-composer-footer button {
      padding: 2px 0;
      background: transparent;
      color: #716a79;
      font-size: 8px;
    }

    .quip-composer-footer button:hover {
      color: var(--purple-400);
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
      border-radius: 99px;
      background: #35303c;
    }

    @keyframes quip-overlay-in {
      from { opacity: 0; }
    }

    @keyframes quip-dialog-in {
      from { opacity: 0; transform: translateY(-8px) scale(.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes quip-panel-in {
      from { opacity: 0; transform: translateY(-4px); }
    }

    @keyframes quip-message-in {
      from { opacity: 0; transform: translateY(5px); }
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

    @media (max-width: 620px) {
      .quip-overlay {
        align-items: flex-end;
        padding: 12px;
      }

      .quip-dialog {
        max-height: calc(100vh - 24px);
        border-radius: 18px;
      }

      .quip-header {
        min-height: 62px;
        padding: 11px 13px;
      }

      .quip-plan-pill {
        max-width: 116px;
      }

      .quip-context-bar,
      .quip-composer-wrap {
        padding-right: 13px;
        padding-left: 13px;
      }

      .quip-chat {
        padding-right: 15px;
        padding-left: 15px;
      }

      .quip-prompt-grid {
        grid-template-columns: 1fr;
      }

      .quip-prompt-grid button {
        min-height: 42px;
      }

      .quip-context-grid {
        grid-template-columns: 1fr;
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
