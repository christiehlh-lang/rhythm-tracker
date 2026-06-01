// PWA Installation utilities

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registered: ', registration);
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}

export function checkInstallability() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    return deferredPrompt;
  });

  return deferredPrompt;
}

export async function promptInstall(deferredPrompt: any) {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
  }
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function canInstall(): boolean {
  return 'serviceWorker' in navigator && !isStandalone();
}
