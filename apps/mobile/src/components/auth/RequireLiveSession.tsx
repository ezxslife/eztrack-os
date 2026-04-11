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
      ? "This feature is unavailable on this build."
      : previewMode
        ? "Return to your live workspace to use this screen."
        : "Sign in with your live EZTrack account to continue.";

    return (
      <ScreenContainer subtitle={subtitle} title={title}>
        <SectionCard title="Live session required">
          <View style={styles.stack}>
            <Text style={styles.copy}>
              This screen is available when you are signed in with your organization's live
              account.
            </Text>
            {detail ? <Text style={styles.copy}>{detail}</Text> : null}
            <Button
              label="Go to Dashboard"
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
