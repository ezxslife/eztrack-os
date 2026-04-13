/**
 * Navigation type definitions for all routes in EZTrack.
 * Used with Expo Router for type-safe navigation.
 *
 * Usage:
 * ```tsx
 * router.push({
 *   pathname: '/(detail)/incidents/[id]' as const,
 *   params: { id: '123' },
 * });
 * ```
 */

export type RootStackParamList = {
  // Auth screens
  '(auth)/login': undefined;
  '(auth)/signup': undefined;
  '(auth)/forgot-password': undefined;
  '(auth)/reset-password': { token?: string };
  '(auth)/magic-link-sent': { email: string };
  '(auth)/accept-invite': { token: string; orgName?: string; inviterName?: string };
  '(auth)/select-org': undefined;
  '(auth)/onboarding': undefined;

  // Tab root screens
  '(tabs)/dashboard': undefined;
  '(tabs)/daily-log': { filter?: string };
  '(tabs)/incidents': { filter?: string };
  '(tabs)/dispatch': { filter?: string };
  '(tabs)/personnel': undefined;
  '(tabs)/analytics': { dateRange?: string; dimension?: string; value?: string };
  '(tabs)/reports': undefined;
  '(tabs)/more': undefined;

  // Detail screens (single record view)
  '(detail)/incidents/[id]': { id: string };
  '(detail)/dispatch/[id]': { id: string };
  '(detail)/daily-log/[id]': { id: string };
  '(detail)/cases/[id]': { id: string };
  '(detail)/personnel/[id]': { id: string };
  '(detail)/lost-found/[id]': { id: string };
  '(detail)/work-orders/[id]': { id: string };
  '(detail)/visitors/[id]': { id: string };
  '(detail)/vehicles/[id]': { id: string };
  '(detail)/contacts/[id]': { id: string };
  '(detail)/briefings/[id]': { id: string };
  '(detail)/reports/[type]': { type: string };
  '(detail)/patrons/[id]': { id: string };

  // Create/edit screens
  '(create)/incidents/new': {
    fromDispatch?: string;
    fromPatron?: string;
  };
  '(create)/dispatch/new': {
    fromIncident?: string;
    location?: string;
    description?: string;
  };
  '(create)/cases/new': {
    fromIncident?: string;
    fromDispatch?: string;
  };
  '(create)/daily-log/new': {
    date?: string;
  };
  '(create)/briefings/new': undefined;
  '(create)/work-orders/new': {
    location?: string;
  };
  '(create)/contacts/new': {
    associatedWith?: string;
    associatedType?: string;
  };

  // Standalone screens (full-page lists/managers)
  '(standalone)/alerts': { id?: string; filter?: string };
  '(standalone)/anonymous-reports': undefined;
  '(standalone)/briefings': { filter?: string };
  '(standalone)/cases': { filter?: string };
  '(standalone)/contacts': { filter?: string };
  '(standalone)/lost-found': { filter?: string };
  '(standalone)/notifications': undefined;
  '(standalone)/patrons': { patronId?: string; filter?: string };
  '(standalone)/sync-center': undefined;
  '(standalone)/vehicles': { filter?: string };
  '(standalone)/visitors': { filter?: string };

  // Settings screens
  settings: undefined;
  'settings/appearance': undefined;
  'settings/security': undefined;
  'settings/data-storage': undefined;
  'settings/organization': undefined;
  'settings/notifications': undefined;
  'settings/about': undefined;

  // Root/misc
  index: undefined;
};

/**
 * Union type of all route paths for strict typing.
 * Use with Expo Router navigation functions.
 */
export type RootStackPath = keyof RootStackParamList;

/**
 * Strongly-typed route parameters helper.
 * Extract the param type for any route.
 *
 * Usage:
 * ```tsx
 * type IncidentParams = RouteParams<'(detail)/incidents/[id]'>;
 * // { id: string }
 * ```
 */
export type RouteParams<T extends RootStackPath> = RootStackParamList[T];

/**
 * Record type selector - useful for mapping record types to their detail screens.
 */
export type RecordType =
  | 'incident'
  | 'dispatch'
  | 'daily-log'
  | 'case'
  | 'briefing'
  | 'work-order'
  | 'personnel'
  | 'contact'
  | 'vehicle'
  | 'visitor'
  | 'lost-found'
  | 'patron';

/**
 * Map record type to detail screen path.
 * Useful for dynamic navigation based on record type.
 */
export const RECORD_TYPE_TO_SCREEN: Record<RecordType, string> = {
  incident: '(detail)/incidents/[id]',
  dispatch: '(detail)/dispatch/[id]',
  'daily-log': '(detail)/daily-log/[id]',
  case: '(detail)/cases/[id]',
  briefing: '(detail)/briefings/[id]',
  'work-order': '(detail)/work-orders/[id]',
  personnel: '(detail)/personnel/[id]',
  contact: '(detail)/contacts/[id]',
  vehicle: '(detail)/vehicles/[id]',
  visitor: '(detail)/visitors/[id]',
  'lost-found': '(detail)/lost-found/[id]',
  patron: '(detail)/patrons/[id]',
};

/**
 * Map record type to list/standalone screen path.
 */
export const RECORD_TYPE_TO_LIST: Record<RecordType, string> = {
  incident: '(tabs)/incidents',
  dispatch: '(tabs)/dispatch',
  'daily-log': '(tabs)/daily-log',
  case: '(standalone)/cases',
  briefing: '(standalone)/briefings',
  'work-order': '(tabs)/more', // May be embedded in a submenu
  personnel: '(tabs)/personnel',
  contact: '(standalone)/contacts',
  vehicle: '(standalone)/vehicles',
  visitor: '(standalone)/visitors',
  'lost-found': '(standalone)/lost-found',
  patron: '(standalone)/patrons',
};

/**
 * Helper to get detail screen for a record type.
 *
 * Usage:
 * ```tsx
 * const screen = getRecordDetailScreen('incident');
 * // Returns: '(detail)/incidents/[id]'
 * ```
 */
export function getRecordDetailScreen(type: RecordType): string {
  return RECORD_TYPE_TO_SCREEN[type];
}

/**
 * Helper to get list screen for a record type.
 */
export function getRecordListScreen(type: RecordType): string {
  return RECORD_TYPE_TO_LIST[type];
}
