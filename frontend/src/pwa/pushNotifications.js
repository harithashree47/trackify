import { pushApi } from '../api';

// Converts a base64url-encoded VAPID public key into a Uint8Array that the
// Push API expects for applicationServerKey.
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

// Current state of push notifications on this device.
export const getPushState = async () => {
  if (!isSupported()) {
    return { supported: false, subscribed: false, permission: 'unsupported' };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return {
    supported: true,
    subscribed: Boolean(subscription),
    permission: Notification.permission,
  };
};

// Request permission and subscribe this device to Web Push.
export const enablePushNotifications = async () => {
  if (!isSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.');
  }

  const registration = await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await pushApi.subscribe(existing.toJSON());
    return { subscribed: true, subscription: existing };
  }

  const { publicKey } = await pushApi.getVapidPublicKey();
  if (!publicKey) {
    throw new Error('Push notifications are not configured on the server yet.');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await pushApi.subscribe(subscription.toJSON());
  return { subscribed: true, subscription };
};

// Unsubscribe this device from Web Push.
export const disablePushNotifications = async () => {
  if (!isSupported()) return { subscribed: false };

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  try {
    await pushApi.unsubscribe();
  } catch (error) {
    console.error('Failed to sync unsubscribe with server:', error);
  }

  return { subscribed: false };
};
