import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getGlassHeaderOptions } from "@/theme/headers";
import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

export default function NotFoundScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    link: {
      backgroundColor: colors.primaryStrong,
      borderRadius: 12,
      marginTop: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    linkText: {
      ...typography.footnote,
      color: colors.primaryText,
      fontWeight: "700",
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      marginTop: 8,
      maxWidth: 280,
      textAlign: "center",
    },
    title: {
      ...typography.title3,
      color: colors.textPrimary,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          ...getGlassHeaderOptions(colors.background),
          headerTitle: "",
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist yet.</Text>
        <Text style={styles.subtitle}>
          The mobile app foundation is in place, but most EZTrack modules are still being built.
        </Text>

        <Link href="/dashboard" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Return to dashboard</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
