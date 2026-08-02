export function initSidebarHoverDelay() {
  const apply = () => {
    const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="Sidebar"]') as HTMLElement | null;
    if (!sidebar || sidebar.dataset.hoverDelayReady === 'true') return;

    sidebar.dataset.hoverDelayReady = 'true';

    let timer: number | undefined;

    sidebar.addEventListener('mouseenter', () => {
      sidebar.dataset.hoverWaiting = 'true';
      if (timer) window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        sidebar.dataset.hoverDelayed = 'true';
        sidebar.dataset.hoverWaiting = 'false';
      }, 1000);
    });

    sidebar.addEventListener('mouseleave', () => {
      if (timer) window.clearTimeout(timer);
      sidebar.dataset.hoverWaiting = 'false';
      sidebar.dataset.hoverDelayed = 'false';
    });
  };

  window.setTimeout(apply, 300);
  window.addEventListener('DOMContentLoaded', apply);
}

initSidebarHoverDelay();
