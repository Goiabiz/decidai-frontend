export type AppConfirmTone = 'danger' | 'warning' | 'info' | 'success';

export type AppConfirmOptions = {
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Alias de confirmText usado pelas telas de cadastro/parametrização. */
  confirmLabel?: string;
  /** Alias de cancelText usado pelas telas de cadastro/parametrização. */
  cancelLabel?: string;
  tone?: AppConfirmTone;
  /** Chamado quando o usuário confirma. Use isto OU o retorno da Promise. */
  onConfirm?: () => void;
};

function ensureConfirmRoot() {
  let root = document.getElementById('app-confirm-root');

  if (!root) {
    root = document.createElement('div');
    root.id = 'app-confirm-root';
    document.body.appendChild(root);
  }

  return root;
}

function injectStyles() {
  if (document.getElementById('app-confirm-style')) return;

  const style = document.createElement('style');
  style.id = 'app-confirm-style';
  style.textContent = `
    .app-confirm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: grid;
      place-items: center;
      background: rgba(15, 23, 42, .48);
      backdrop-filter: blur(2px);
    }

    .app-confirm-dialog {
      width: min(540px, calc(100vw - 40px));
      border-radius: 22px;
      background: #fff;
      border: 1px solid rgba(15, 23, 42, .12);
      box-shadow: 0 28px 90px rgba(15, 23, 42, .28);
      padding: 22px;
      display: grid;
      gap: 16px;
      color: #071638;
      font-family: inherit;
    }

    .app-confirm-dialog h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 950;
      color: #071638;
    }

    .app-confirm-dialog p {
      margin: 0;
      color: #334155;
      font-weight: 760;
      line-height: 1.5;
    }

    .app-confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    .app-confirm-actions button {
      min-height: 42px;
      border-radius: 14px;
      padding: 0 18px;
      border: 1px solid #dbe3ef;
      font-weight: 950;
      cursor: pointer;
      background: #fff;
      color: #071638;
      font-family: inherit;
    }

    .app-confirm-actions button[data-role="confirm"] {
      border-color: transparent;
      background: #047857;
      color: #fff;
    }

    .app-confirm-actions button[data-tone="danger"] {
      background: #dc2626;
      color: #fff;
    }

    .app-confirm-actions button[data-tone="warning"] {
      background: #f97316;
      color: #fff;
    }

    .app-confirm-actions button[data-tone="info"] {
      background: #2563eb;
      color: #fff;
    }

    .app-confirm-actions button:focus {
      outline: 3px solid rgba(4, 120, 87, .22);
      outline-offset: 2px;
    }
  `;

  document.head.appendChild(style);
}

export function confirmApp(options: AppConfirmOptions | string): Promise<boolean> {
  const config: AppConfirmOptions = typeof options === 'string'
    ? { message: options }
    : options;

  injectStyles();

  return new Promise((resolve) => {
    const root = ensureConfirmRoot();

    const backdrop = document.createElement('div');
    backdrop.className = 'app-confirm-backdrop';

    const dialog = document.createElement('section');
    dialog.className = 'app-confirm-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const title = document.createElement('h3');
    title.textContent = config.title || 'Confirmar ação';

    const message = document.createElement('p');
    message.textContent = config.description || config.message || 'Deseja continuar?';

    const actions = document.createElement('div');
    actions.className = 'app-confirm-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = config.cancelLabel || config.cancelText || 'Cancelar';

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.dataset.role = 'confirm';
    confirm.dataset.tone = config.tone || 'success';
    confirm.textContent = config.confirmLabel || config.confirmText || 'Confirmar';

    let resolved = false;

    const cleanup = () => {
      document.removeEventListener('keydown', handleKeydown);
      backdrop.remove();
    };

    const close = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      if (value) config.onConfirm?.();
      resolve(value);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
    };

    cancel.addEventListener('click', () => close(false));
    confirm.addEventListener('click', () => close(true));
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close(false);
    });

    document.addEventListener('keydown', handleKeydown);

    actions.append(cancel, confirm);
    dialog.append(title, message, actions);
    backdrop.appendChild(dialog);
    root.appendChild(backdrop);

    confirm.focus();
  });
}

// Aliases para compatibilidade com todas as páginas geradas até aqui.
export const appConfirm = confirmApp;
export const requestConfirm = confirmApp;
export const showConfirm = confirmApp;
export const showAppConfirm = confirmApp;
