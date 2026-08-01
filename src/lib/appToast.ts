export function showAppToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

export function initAppToast() {
  if (document.getElementById('app-toast-root')) return;

  const root = document.createElement('div');
  root.id = 'app-toast-root';
  root.className = 'app-toast-root';
  document.body.appendChild(root);

  let timer: number | undefined;

  window.addEventListener('app-toast', ((event: CustomEvent<{ message: string; type: string }>) => {
    const detail = event.detail || { message: '', type: 'success' };
    if (!detail.message) return;

    root.className = `app-toast-root show ${detail.type || 'success'}`;
    root.textContent = detail.message;

    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      root.className = 'app-toast-root';
      root.textContent = '';
    }, 2000);
  }) as EventListener);
}

initAppToast();
