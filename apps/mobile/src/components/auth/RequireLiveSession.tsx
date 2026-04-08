import { type ReactNode } from "react";

import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { useSessionContext } from "@/hooks/useSessionContext";
import { useThemeColors } from "@/theme";

interface RequireLiveSessionProps {
  children: ReactNode;
  detail?: string;
  title: string;
}

export function RequireLiveSession({
  children,
  detail,
  title,
}: RequireLiveSessionProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const {
    authEnabled,
    authLifecycle,
    initialized,
    previewMode,
    usePreviewData,
  } = useSessionContext();

  if (
    !initialized ||
    (!previewMode &&
      (authLifecycle === "initializing" || authLifecycle === "authenticating"))
  ) {
    return <LoadingScreen />;
  }

  if (usePreviewData || authLifecycle !== "active") {
    const subtitle = !authEnabled
      ? "This route is hidden in preview builds until a live auth session is available."
      : previewMode
        ? "Exit preview and return with a live operator session to use this workflow."
        : "Sign in with a live operator session to use this workflow.";

    return (
      <ScreenContainer subtitle={subtitle} title={title}>
        <SectionCard title="Live session required">
          <View style={styles.stack}>
            <Text style={styles.copy}>
              This screen talks directly to live Supabase records and is intentionally blocked in
              preview mode.
            </Text>
            {detail ? <Text style={styles.copy}>{detail}</Text> : null}
            <Button
              label="Return to Dashboard"
              onPress={() => {
                router.replace("/dashboard");
              }}
              variant="secondary"
            />
          </View>
        </SectionCard>
      </ScreenContainer>
    );
  }

  return <>{children}</>;
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    stack: {
      gap: 14,
    },
  });
}
