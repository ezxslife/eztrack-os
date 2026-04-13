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
      backgroundColor: colors.interactiveSolid,
      borderRadius: 12,
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    linkText: {
      ...typography.subheadline,
      color: colors.brandContrastText,
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
      ...typography.title2,
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
        <Text style={styles.title}>This screen is not available.</Text>
        <Text style={styles.subtitle}>
          The link may be out of date, or you may not have access to this area.
        </Text>

        <Link href="/dashboard" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Back to dashboard</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
