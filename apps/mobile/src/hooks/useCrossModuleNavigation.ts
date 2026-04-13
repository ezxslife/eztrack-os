/**
 * Hook for navigating between related records across modules.
 * Handles incident ↔ dispatch linking, escalations, drill-downs, and more.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

interface CrossModuleNavigationConfig {
  location?: string;
  description?: string;
  [key: string]: string | undefined;
}

interface IncidentCreationConfig extends CrossModuleNavigationConfig {
  fromDispatch?: string;
  fromPatron?: string;
}

interface DispatchCreationConfig extends CrossModuleNavigationConfig {
  fromIncident?: string;
  location?: string;
  description?: string;
}

interface CaseCreationConfig extends CrossModuleNavigationConfig {
  fromIncident?: string;
}

/**
 * Hook for navigating between related records across modules.
 *
 * Usage:
 * ```tsx
 * const { createDispatchFromIncident, viewIncidentFromDispatch } = useCrossModuleNavigation();
 *
 * // Create dispatch from incident detail screen
 * <Button onPress={() => createDispatchFromIncident(incidentId)} />
 *
 * // View incident from dispatch detail screen
 * <Button onPress={() => viewIncidentFromDispatch(incidentId)} />
 * ```
 */
export function useCrossModuleNavigation() {
  const router = useRouter();

  // Incident ↔ Dispatch
  const createDispatchFromIncident = useCallback(
    (incidentId: string, prefill?: DispatchCreationConfig) => {
      router.push({
        pathname: '/(create)/dispatch/new',
        params: { fromIncident: incidentId, ...prefill },
      });
    },
    [router]
  );

  const viewIncidentFromDispatch = useCallback(
    (incidentId: string) => {
      router.push({
        pathname: '/(detail)/incidents/[id]',
        params: { id: incidentId },
      });
    },
    [router]
  );

  // Incident → Case escalation
  const escalateToCase = useCallback(
    (incidentId: string, prefill?: CaseCreationConfig) => {
      router.push({
        pathname: '/(create)/cases/new',
        params: { fromIncident: incidentId, ...prefill },
      });
    },
    [router]
  );

  // Dispatch → Case escalation
  const escalateCaseFromDispatch = useCallback(
    (dispatchId: string, prefill?: CaseCreationConfig) => {
      router.push({
        pathname: '/(create)/cases/new',
        params: { fromDispatch: dispatchId, ...prefill },
      });
    },
    [router]
  );

  // Create incident from dispatch
  const createIncidentFromDispatch = useCallback(
    (dispatchId: string, prefill?: IncidentCreationConfig) => {
      router.push({
        pathname: '/(create)/incidents/new',
        params: { fromDispatch: dispatchId, ...prefill },
      });
    },
    [router]
  );

  // Dashboard → filtered list drill-downs
  const drillDownToIncidents = useCallback(
    (filter?: string) => {
      router.push({
        pathname: '/(tabs)/incidents',
        params: filter ? { filter } : undefined,
      });
    },
    [router]
  );

  const drillDownToDispatches = useCallback(
    (filter?: string) => {
      router.push({
        pathname: '/(tabs)/dispatch',
        params: filter ? { filter } : undefined,
      });
    },
    [router]
  );

  const drillDownToDailyLog = useCallback(
    (filter?: string) => {
      router.push({
        pathname: '/(tabs)/daily-log',
        params: filter ? { filter } : undefined,
      });
    },
    [router]
  );

  const drillDownToBriefings = useCallback(
    (filter?: string) => {
      router.push({
        pathname: '/(tabs)/more',
        params: filter ? { filter } : undefined,
      });
    },
    [router]
  );

  const drillDownToCases = useCallback(
    (filter?: string) => {
      router.push({
        pathname: '/(standalone)/cases',
        params: filter ? { filter } : undefined,
      });
    },
    [router]
  );

  // Patron → incidents/dispatches
  const viewPatronIncidents = useCallback(
    (patronId: string, filter?: string) => {
      router.push({
        pathname: '/(standalone)/patrons',
        params: { patronId, filter },
      });
    },
    [router]
  );

  const viewPatronProfile = useCallback(
    (patronId: string) => {
      router.push({
        pathname: '/(detail)/patrons/[id]',
        params: { id: patronId },
      });
    },
    [router]
  );

  // Generic record navigation
  const viewRecord = useCallback(
    (type: string, id: string) => {
      router.push({
        pathname: `/(detail)/${type}/[id]` as any,
        params: { id },
      });
    },
    [router]
  );

  const createRecord = useCallback(
    (type: string, prefill?: Record<string, string>) => {
      router.push({
        pathname: `/(create)/${type}/new` as any,
        params: prefill,
      });
    },
    [router]
  );

  // View lists with filtering
  const viewListWithFilter = useCallback(
    (type: 'incidents' | 'dispatch' | 'daily-log' | 'cases' | 'briefings', filter?: string) => {
      const pathMap: Record<typeof type, string> = {
        incidents: '/(tabs)/incidents',
        dispatch: '/(tabs)/dispatch',
        'daily-log': '/(tabs)/daily-log',
        cases: '/(standalone)/cases',
        briefings: '/(standalone)/briefings',
      };

      router.push({
        pathname: pathMap[type] as any,
        params: filter ? { filter } : undefined,
      });
    },
    [router]
  );

  // Analytics drill-down (by date, personnel, location, etc.)
  const drillDownAnalytics = useCallback(
    (dimension: string, value: string) => {
      router.push({
        pathname: '/(tabs)/analytics',
        params: { dimension, value },
      });
    },
    [router]
  );

  // Settings navigation
  const goToSettings = useCallback(() => {
    router.push('settings' as any);
  }, [router]);

  const goToSecuritySettings = useCallback(() => {
    router.push('settings/security' as any);
  }, [router]);

  const goToAppearanceSettings = useCallback(() => {
    router.push('settings/appearance' as any);
  }, [router]);

  return {
    // Incident ↔ Dispatch
    createDispatchFromIncident,
    viewIncidentFromDispatch,
    createIncidentFromDispatch,

    // Escalations
    escalateToCase,
    escalateCaseFromDispatch,

    // Dashboard drill-downs
    drillDownToIncidents,
    drillDownToDispatches,
    drillDownToDailyLog,
    drillDownToBriefings,
    drillDownToCases,

    // Patron
    viewPatronIncidents,
    viewPatronProfile,

    // Generic
    viewRecord,
    createRecord,
    viewListWithFilter,

    // Analytics
    drillDownAnalytics,

    // Settings
    goToSettings,
    goToSecuritySettings,
    goToAppearanceSettings,
  };
}
