import { useEffect, useState, useCallback } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import { Button } from '../components/Button.jsx';
import logoImg from '../assets/logo1.png';
import { useToast } from '../context/ToastContext.jsx';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const DISMISS_KEY = 'trackify:install-prompt-dismissed';

const InstallPrompt = () => {
  const { success } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setDeferredPrompt(null);
  }, []);

  const dismissForever = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    closeModal();
  }, [closeModal]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (isStandalone()) return;
      // Respect a previous "Later" tap — otherwise the modal keeps coming
      // back on every visit and blocks the whole UI while it is open.
      if (localStorage.getItem(DISMISS_KEY)) return;
      setDeferredPrompt(event);
      setShowModal(true);
    };

    const handleAppInstalled = () => {
      setShowModal(false);
      setDeferredPrompt(null);
      success('Trackify installed on your device.');
    };

    const setupIOS = () => {
      if (isStandalone() || !isIOS()) return;
      if (localStorage.getItem(DISMISS_KEY)) return;
      const timer = setTimeout(() => {
        setDeferredPrompt(null);
        setShowModal(true);
      }, 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const cleanupIOS = setupIOS();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (cleanupIOS) cleanupIOS();
    };
  }, [success]);

  const handleInstall = async () => {
    if (!deferredPrompt) return closeModal();
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // prompt unavailable or dismissed — nothing to do
    }
    closeModal();
  };

  return (
    // Always mounted; CSS transitions only. AnimatePresence around a
    // full-screen backdrop has left invisible click-blockers behind before,
    // which is how the hamburger menu appeared to "not work".
    <div
      className={`fixed inset-0 z-[90] ${showModal ? '' : 'pointer-events-none'}`}
      aria-hidden={!showModal}
    >
      {/* Backdrop */}
      <div
        onClick={closeModal}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          showModal ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-full max-w-[20rem] rounded-2xl bg-white p-6 text-center shadow-2xl transition-all duration-200 ${
            showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-3.5 top-3.5 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
              <img
                src={logoImg}
                alt="Trackify logo"
                className="h-full w-full scale-[1.3] object-contain"
              />
            </div>

            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              Trackify
            </h2>
            <p className="mt-1 mb-5 text-sm font-medium text-slate-500">
              Install the app
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={dismissForever}>
                Later
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                leftIcon={<FiDownload className="h-4 w-4" />}
                onClick={handleInstall}
              >
                Install
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default InstallPrompt;
