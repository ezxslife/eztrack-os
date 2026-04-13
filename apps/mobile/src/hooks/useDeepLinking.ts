/**
 * Hook for handling deep links in the EZTrack mobile app.
 * Sets up listeners for incoming URLs (via Linking API) and routes them
 * to the appropriate screens using parseDeepLink.
 */

import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { parseDeepLink } from '@/lib/deep-links';

interface UseDeepLinkingOptions {
  onDeepLinkNotFound?: (url: string) => void;
  onDeepLinkReceived?: (screen: string, params: Record<string, string>) => void;
}

/**
 * Hook that handles incoming deep links and routes to the correct screen.
 * Must be called at the root of the app (typically in _layout.tsx).
 *
 * Usage:
 * ```tsx
 * export default function RootLayout() {
 *   useDeepLinking({
 *     onDeepLinkNotFound: (url) => console.warn('Unknown deep link:', url),
 *   });
 *   // ... rest of layout
 * }
 * ```
 */
export function useDeepLinking(options: UseDeepLinkingOptions = {}) {
  const router = useRouter();
  const { onDeepLinkNotFound, onDeepLinkReceived } = options;

  useEffect(() => {
    let subscription: any;

    const handleUrl = (url: string) => {
      const deepLink = parseDeepLink(url);

      if (!deepLink) {
        onDeepLinkNotFound?.(url);
        console.warn('[DeepLinking] Unknown deep link:', url);
        return;
      }

      onDeepLinkReceived?.(deepLink.screen, deepLink.params);

      // Normalize screen path for Expo Router
      const screenPath = deepLink.screen as any;
      router.push({ pathname: screenPath, params: deepLink.params });
    };

    // Handle initial URL (app launched via deep link)
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();

      // Only handle if app was cold-launched from a deep link
      if (initialUrl != null) {
        handleUrl(initialUrl);
      }
    };

    getInitialUrl();

    // Handle URLs while app is running
    subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [router, onDeepLinkNotFound, onDeepLinkReceived]);
}
