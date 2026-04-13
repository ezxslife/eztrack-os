import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface VehicleCardProps {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  color?: string;
  type?: string;
  location?: string;
  flagged?: boolean;
  onPress?: () => void;
}

export function VehicleCard({
  id,
  plate,
  make,
  model,
  color,
  type,
  location,
  flagged = false,
  onPress,
}: VehicleCardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const handlePress = () => {
    if (!onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.backgroundMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: spacing[1],
    },
    plateText: {
      ...typography.headline,
      color: colors.textPrimary,
      fontFamily: "Menlo",
      letterSpacing: 1,
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      flexWrap: "wrap",
    },
    detailText: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginTop: spacing[1],
    },
    locationText: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    flaggedContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: 6,
      backgroundColor: `${colors.error}20`,
    },
    flaggedText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.error,
    },
    pressable: {
      opacity: 0.7,
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AppSymbol
          iosName="car.fill"
          fallbackName="car"
          size={24}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.content}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Text style={styles.plateText}>{plate}</Text>
          {flagged && (
            <View style={styles.flaggedContainer}>
              <AppSymbol
                iosName="exclamationmark.triangle.fill"
                fallbackName="warning"
                size={10}
                color={colors.error}
              />
              <Text style={styles.flaggedText}>Flagged</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          {make && <Text style={styles.detailText}>{make}</Text>}
          {model && <Text style={styles.detailText}>{model}</Text>}
          {color && <Text style={styles.detailText}>{color}</Text>}
        </View>

        {location && (
          <View style={styles.locationRow}>
            <AppSymbol
              iosName="location.fill"
              fallbackName="location"
              size={12}
              color={colors.textTertiary}
            />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => (pressed ? styles.pressable : {})}
      >
        <MaterialSurface variant="grouped" padding={spacing[3]}>
          {content}
        </MaterialSurface>
      </Pressable>
    );
  }

  return (
    <MaterialSurface variant="grouped" padding={spacing[3]}>
      {content}
    </MaterialSurface>
  );
}
