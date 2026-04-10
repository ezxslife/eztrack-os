import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors } from "@/theme";

interface GlassSheetProps {
  children: ReactNode;
}

export function GlassSheet({ children }: GlassSheetProps) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    handle: {
      alignSelf: "center",
      backgroundColor: colors.textTertiary,
      borderRadius: 999,
      height: 4,
      opacity: 0.55,
      width: 36,
    },
    wrapper: {
      gap: 14,
    },
  });

  return (
    <MaterialSurface style={styles.wrapper} variant="sheet">
      <View style={styles.handle} />
      {children}
    </MaterialSurface>
  );
}
