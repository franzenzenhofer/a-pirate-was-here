export type LogFn = (msg: string, type?: string) => void;

const LOG_MAX = 6;
const LOG_DURATION = 5000;

const entries: HTMLDivElement[] = [];

/** Optional debug hook — set by debug module to capture all log events */
export let onLogEvent: ((msg: string, type: string) => void) | null = null;

export function setLogHook(fn: typeof onLogEvent): void {
  onLogEvent = fn;
}

/** Add an event log entry */
export function addLog(msg: string, type: string = ''): void {
  if (onLogEvent) onLogEvent(msg, type);

  const logEl = document.getElementById('log');
  if (!logEl) return;

  const d = document.createElement('div');
  d.className = 'le ' + type;
  d.textContent = msg;
  logEl.appendChild(d);
  entries.push(d);

  if (entries.length > LOG_MAX) {
    const old = entries.shift();
    if (old) try { logEl.removeChild(old); } catch { /* already removed */ }
  }

  setTimeout(() => {
    try { logEl.removeChild(d); } catch { /* already removed */ }
  }, LOG_DURATION);
}
