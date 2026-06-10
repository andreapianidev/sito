// PWA Utilities - Share and offline functionality

// Share content using Web Share API
export const shareContent = async (shareData: { title?: string; text?: string; url?: string }) => {
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fallback: copy URL to clipboard if available
      if (shareData.url && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
};

// Check if app is running in standalone mode (PWA)
export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Check if device is mobile
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get device type
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
};

// Check if browser supports PWA features
export const supportsPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Register service worker
export const registerServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration);
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

// Show notification
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    });
  }
};

// Cache management utilities
export const clearCache = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
};

// Get app version from package.json or manifest
export const getAppVersion = (): string => {
  return '1.0.0'; // This could be dynamically loaded
};

// Check for app updates
export const checkForUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // This would check for service worker updates
    return false; // Placeholder
  }
  return false;
};