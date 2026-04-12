import { ROLE_DISPLAY } from "./constants";

export const DEMO_AUTH_PROFILES = [
  {
    email: "sarah.kim@eztrack.io",
    name: "Sarah Kim",
    role: "manager",
    roleLabel: ROLE_DISPLAY.manager,
  },
  {
    email: "james.reid@eztrack.io",
    name: "James Reid",
    role: "dispatcher",
    roleLabel: ROLE_DISPLAY.dispatcher,
  },
  {
    email: "diana.torres@eztrack.io",
    name: "Diana Torres",
    role: "supervisor",
    roleLabel: ROLE_DISPLAY.supervisor,
  },
  {
    email: "tom.walsh@eztrack.io",
    name: "Tom Walsh",
    role: "staff",
    roleLabel: ROLE_DISPLAY.staff,
  },
  {
    email: "lisa.nguyen@eztrack.io",
    name: "Lisa Nguyen",
    role: "staff",
    roleLabel: ROLE_DISPLAY.staff,
  },
  {
    email: "raj.patel@eztrack.io",
    name: "Raj Patel",
    role: "staff",
    roleLabel: ROLE_DISPLAY.staff,
  },
] as const;

export type DemoAuthProfile = (typeof DEMO_AUTH_PROFILES)[number];

export const DEFAULT_DEMO_AUTH_PROFILE = DEMO_AUTH_PROFILES[0];

export function getDemoAuthProfileByEmail(email: string | null | undefined) {
  return DEMO_AUTH_PROFILES.find((profile) => profile.email === email);
}
