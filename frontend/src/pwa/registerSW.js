const SW_PATH = './sw.js';

const isProd = () => import.meta.env.PROD;

const showUpdateBanner = (newWorker) => {
  const dismiss = () => {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  };

  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  Object.assign(banner.style, {
    position: 'fixed',
    left: '16px',
    right: '16px',
    bottom: '16px',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    maxWidth: '420px',
    margin: '0 auto',
    padding: '10px 10px 10px 16px',
    background: '#0f172a',
    color: '#f8fafc',
    borderRadius: '12px',
    boxShadow: '0 12px 32px rgba(2, 6, 23, 0.25)',
    fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: '500',
  });

  const text = document.createElement('span');
  text.textContent = 'A new version of Trackify is available.';
  banner.appendChild(text);

  const actions = document.createElement('span');
  Object.assign(actions.style, { display: 'flex', alignItems: 'center', gap: '4px', flex: 'none' });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Dismiss';
  Object.assign(closeBtn.style, {
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontFamily: 'inherit',
    fontSize: '12px',
    fontWeight: '500',
    padding: '6px 8px',
    borderRadius: '8px',
  });
  closeBtn.addEventListener('click', dismiss);
  actions.appendChild(closeBtn);

  const updateBtn = document.createElement('button');
  updateBtn.textContent = 'Update';
  Object.assign(updateBtn.style, {
    cursor: 'pointer',
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '8px',
  });
  updateBtn.addEventListener('click', () => {
    dismiss();
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', reload);
    setTimeout(reload, 4000);
  });
  actions.appendChild(updateBtn);

  banner.appendChild(actions);
  document.body.appendChild(banner);
};

export const registerSW = () => {
  if (!isProd() || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_PATH, { updateViaCache: 'none' })
      .then((registration) => {
        if (!navigator.serviceWorker.controller) return;

        const onUpdateFound = () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              showUpdateBanner(newWorker);
            }
          });
        };

        registration.addEventListener('updatefound', onUpdateFound);
        if (registration.waiting) {
          const { waiting } = registration;
          if (waiting.state === 'installed') showUpdateBanner(waiting);
        }
      })
      .catch(() => {
        // Service worker registration failed (e.g. unsupported context) — the
        // app still works as a normal web app.
      });
  });
};
