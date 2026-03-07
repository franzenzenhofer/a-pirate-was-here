export function mkBtn(parent: HTMLElement, label: string, cls: string, onClick: () => void): void {
  const button = document.createElement('button');
  button.className = 'mb ' + cls;
  button.textContent = label;
  button.onclick = onClick;
  parent.appendChild(button);
}
