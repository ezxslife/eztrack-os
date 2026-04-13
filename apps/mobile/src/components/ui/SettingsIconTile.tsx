import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface SettingsIconTileProps {
  /** The icon element to render inside the tile. */
  icon: ReactNode;
  /** Background color of the tile. */
  backgroundColor: string;
  /** Tile size variant. */
  size?: "default" | "large";
}

/**
 * Colored square tile that wraps a leading icon in SettingsListRow.
 *
 * Matches EZXS-OS pattern:
 *   default → 30×30, borderRadius 7
 *   large   → 38×38, borderRadius 10
 */
export function SettingsIconTile({
  icon,
  backgroundColor,
  size = "default",
}: SettingsIconTileProps) {
  const isLarge = size === "large";
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor,
          width: isLarge ? 38 : 30,
          height: isLarge ? 38 : 30,
          borderRadius: isLarge ? 10 : 7,
        },
      ]}
    >
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
});
