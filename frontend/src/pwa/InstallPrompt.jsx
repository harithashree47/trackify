import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiShare2, FiX } from 'react-icons/fi';
import { Button } from '../components/Button.jsx';
import { Logo } from '../components/Logo.jsx';
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
  const [iosMode, setIosMode] = useState(false);

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
      setDeferredPrompt(event);
      setIosMode(false);
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
        setIosMode(true);
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
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // prompt unavailable or dismissed — nothing to do
    }
    closeModal();
  };

  return (
    <AnimatePresence>
      {showModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={iosMode ? dismissForever : closeModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white p-6 shadow-2xl sm:p-7 mx-4 rounded-2xl"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={iosMode ? dismissForever : closeModal}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30">
                <Logo markClassName="h-11 w-11" onDark />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">
                Install Trackify
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {iosMode
                  ? 'Add Trackify to your home screen so it works just like a native app.'
                  : 'Add Trackify to your home screen and track your daily goals with one tap.'}
              </p>
            </div>

            {iosMode ? (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="text-sm font-semibold text-slate-700">
                  How to install on iPhone / iPad
                </p>
                <ol className="mt-2 space-y-1.5 text-[13px] text-slate-500">
                  <li>1. Tap the Share icon <FiShare2 className="ml-0.5 inline-block h-3.5 w-3.5 text-slate-400" /></li>
                  <li>2. Scroll down and tap <b>&quot;Add to Home Screen&quot;</b></li>
                  <li>3. Tap <b>Add</b> in the top right</li>
                </ol>
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <FiDownload className="h-4.5 w-4.5" />
                </div>
                <p className="text-[13px] font-medium leading-snug text-slate-600">
                  Install as a standalone app — works offline, opens full-screen.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {!iosMode && (
                <Button variant="secondary" className="flex-1" onClick={dismissForever}>
                  Not now
                </Button>
              )}
              <Button
                variant="primary"
                className="flex-1"
                leftIcon={<FiDownload className="h-4 w-4" />}
                onClick={iosMode ? dismissForever : handleInstall}
              >
                {iosMode ? 'Got it' : 'Install'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
