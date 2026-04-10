import { Stack } from "expo-router";

import { RequireGuest } from "@/components/auth/RouteGate";

export default function AuthLayout() {
  return (
    <RequireGuest>
      <Stack screenOptions={{ headerShown: false }} />
    </RequireGuest>
  );
}
