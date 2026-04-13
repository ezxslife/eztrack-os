import { Stack } from "expo-router";

import { RequireGuest } from "@/components/auth/RouteGate";

export default function AuthLayout() {
  return (
    <RequireGuest>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="select-org" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="magic-link-sent" />
        <Stack.Screen name="accept-invite" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </RequireGuest>
  );
}
