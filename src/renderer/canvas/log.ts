export type LogFn = (msg: string, type?: string) => void;

const LOG_MAX = 6;
const LOG_DURATION = 5000;

const entries: HTMLDivElement[] = [];

/** Add an event log entry */
export function addLog(msg: string, type: string = ''): void {
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
