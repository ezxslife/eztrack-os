/**
 * Deep link configuration and parsing for EZTrack mobile app.
 * Handles incoming URLs and routes them to the appropriate screens.
 */

export interface DeepLinkRoute {
  pattern: string;
  screen: string;
  params?: string[];
}

const DEEP_LINK_ROUTES: DeepLinkRoute[] = [
  // Detail screens
  { pattern: 'incident/:id', screen: '/(detail)/incidents/[id]', params: ['id'] },
  { pattern: 'dispatch/:id', screen: '/(detail)/dispatch/[id]', params: ['id'] },
  { pattern: 'daily-log/:id', screen: '/(detail)/daily-log/[id]', params: ['id'] },
  { pattern: 'case/:id', screen: '/(detail)/cases/[id]', params: ['id'] },
  { pattern: 'briefing/:id', screen: '/(detail)/briefings/[id]', params: ['id'] },
  { pattern: 'work-order/:id', screen: '/(detail)/work-orders/[id]', params: ['id'] },
  { pattern: 'personnel/:id', screen: '/(detail)/personnel/[id]', params: ['id'] },
  { pattern: 'contact/:id', screen: '/(detail)/contacts/[id]', params: ['id'] },
  { pattern: 'vehicle/:id', screen: '/(detail)/vehicles/[id]', params: ['id'] },
  { pattern: 'visitor/:id', screen: '/(detail)/visitors/[id]', params: ['id'] },
  { pattern: 'lost-found/:id', screen: '/(detail)/lost-found/[id]', params: ['id'] },

  // Standalone screens
  { pattern: 'alerts', screen: '/(standalone)/alerts' },
  { pattern: 'alert/:id', screen: '/(standalone)/alerts', params: ['id'] },
  { pattern: 'briefings', screen: '/(standalone)/briefings' },
  { pattern: 'cases', screen: '/(standalone)/cases' },
  { pattern: 'contacts', screen: '/(standalone)/contacts' },
  { pattern: 'lost-found', screen: '/(standalone)/lost-found' },
  { pattern: 'notifications', screen: '/(standalone)/notifications' },
  { pattern: 'patrons', screen: '/(standalone)/patrons' },
  { pattern: 'vehicles', screen: '/(standalone)/vehicles' },
  { pattern: 'visitors', screen: '/(standalone)/visitors' },

  // Auth flows
  { pattern: 'auth/reset', screen: '/(auth)/reset-password' },
  { pattern: 'auth/invite', screen: '/(auth)/accept-invite' },
  { pattern: 'auth/magic-link', screen: '/(auth)/magic-link-sent' },

  // Settings
  { pattern: 'settings', screen: 'settings' },
  { pattern: 'settings/appearance', screen: 'settings/appearance' },
  { pattern: 'settings/security', screen: 'settings/security' },
  { pattern: 'settings/data-storage', screen: 'settings/data-storage' },
];

interface ParsedDeepLink {
  screen: string;
  params: Record<string, string>;
}

/**
 * Parse a deep link URL into a screen path and params.
 * Supports patterns like: incident/abc123, case/xyz789
 * Returns null if no matching pattern found.
 */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  // Handle full URLs (eztrack://... or https://...)
  let path = url;
  try {
    const parsed = new URL(url);
    path = parsed.pathname.replace(/^\//, '');
    if (path.startsWith('eztrack/')) {
      path = path.slice(8); // Remove "eztrack/" prefix
    }
  } catch {
    // Not a full URL, treat as path
    path = url.replace(/^\//, '').replace(/^eztrack:\/\//, '');
  }

  // Try to match against registered routes
  for (const route of DEEP_LINK_ROUTES) {
    const regex = patternToRegex(route.pattern);
    const match = path.match(regex);

    if (match) {
      const params: Record<string, string> = {};

      if (route.params) {
        route.params.forEach((paramName, index) => {
          params[paramName] = match[index + 1];
        });
      }

      return {
        screen: route.screen,
        params,
      };
    }
  }

  return null;
}

/**
 * Convert a pattern string to a regex for matching.
 * Patterns use :param syntax for named parameters.
 * Example: "incident/:id" -> /^incident\/(.+)$/
 */
function patternToRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        // Parameter segment: match any non-slash characters
        return '([^/]+)';
      }
      // Literal segment: escape special regex chars
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return new RegExp(`^${regexPattern}$`);
}

/**
 * Get all registered deep link routes.
 * Useful for debugging and documentation.
 */
export function getDeepLinkRoutes(): DeepLinkRoute[] {
  return [...DEEP_LINK_ROUTES];
}

/**
 * Build a deep link URL for a given screen and params.
 * Useful for creating shareable links.
 */
export function buildDeepLink(
  screenOrType: string,
  id?: string,
  baseUrl: string = 'eztrack://'
): string {
  if (!id) {
    return `${baseUrl}${screenOrType}`;
  }
  return `${baseUrl}${screenOrType}/${id}`;
}
