import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { Divider } from "@/components/ui/Divider";
import { GlassSheetModal } from "@/components/ui/glass/GlassSheetModal";
import { triggerImpactHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";
import type { SFSymbol } from "expo-symbols";
import * as Haptics from "expo-haptics";

export interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iosIcon?: SFSymbol;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  id: string;
}

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: QuickAction[];
}

export function QuickActionSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  actions,
}: QuickActionSheetProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  // Calculate snap points based on number of actions (roughly 60px per action + header)
  const baseHeight = title || subtitle ? 100 : 40;
  const contentHeight = baseHeight + actions.length * 60;
  const snapPoint = Math.min(contentHeight / 1000, 0.9);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      gap: 0,
    },
    header: {
      paddingBottom: 12,
      gap: 4,
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    actionRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    actionLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
      flex: 1,
    },
    destructiveLabel: {
      color: colors.error,
    },
    disabledLabel: {
      color: colors.textTertiary,
      opacity: 0.5,
    },
    destructiveIcon: {
      color: colors.error,
    },
    divider: {
      marginVertical: 4,
    },
  });

  const handleActionPress = (action: QuickAction) => {
    if (action.disabled) {
      return;
    }

    triggerImpactHaptic(
      action.destructive
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );

    action.onPress();
    onClose();
  };

  // Separate destructive and non-destructive actions
  const nonDestructiveActions = actions.filter((a) => !a.destructive);
  const destructiveActions = actions.filter((a) => a.destructive);

  const renderAction = ({ item }: ListRenderItemInfo<QuickAction>) => {
    const isDisabled = item.disabled;

    return (
      <Pressable
        onPress={() => handleActionPress(item)}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        <View style={styles.actionRow}>
          <AppSymbol
            color={
              isDisabled
                ? colors.textTertiary
                : item.destructive
                  ? colors.error
                  : colors.brandText
            }
            fallbackName={item.icon}
            iosName={item.iosIcon}
            size={20}
            weight="semibold"
          />
          <Text
            style={[
              styles.actionLabel,
              item.destructive && styles.destructiveLabel,
              isDisabled && styles.disabledLabel,
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </View>
      </Pressable>
    );
  };

  const allActions = [...nonDestructiveActions];
  if (destructiveActions.length > 0) {
    if (nonDestructiveActions.length > 0) {
      // Add placeholder for divider
      allActions.push({
        id: "__divider__",
        label: "",
        icon: "ellipsis-horizontal",
        onPress: () => {},
        disabled: true,
      });
    }
    allActions.push(...destructiveActions);
  }

  const renderItem = (info: ListRenderItemInfo<QuickAction>) => {
    if (info.item.id === "__divider__") {
      return <Divider style={styles.divider} />;
    }
    return renderAction(info);
  };

  return (
    <GlassSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[Math.max(snapPoint, 0.4), "90%"]}
    >
      <View style={styles.container}>
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        <FlatList
          data={allActions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      </View>
    </GlassSheetModal>
  );
}
