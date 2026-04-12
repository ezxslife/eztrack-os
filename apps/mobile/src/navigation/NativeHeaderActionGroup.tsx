import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

interface NativeHeaderActionGroupProps {
  children: ReactNode;
}

export function NativeHeaderActionGroup({
  children,
}: NativeHeaderActionGroupProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
