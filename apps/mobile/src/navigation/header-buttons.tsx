import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { NativeHeaderActionButton } from "./NativeHeaderActionButton";
import { useThemeColors } from "@/theme";

// Add Button
interface HeaderAddButtonProps {
  onPress: () => void;
}

export function HeaderAddButton({ onPress }: HeaderAddButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Add"
      icon="plus"
      onPress={onPress}
    />
  );
}

// Filter Button
interface HeaderFilterButtonProps {
  onPress: () => void;
  activeCount?: number;
}

export function HeaderFilterButton({
  onPress,
  activeCount,
}: HeaderFilterButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Filter"
      badge={activeCount}
      icon="line.3.horizontal.decrease"
      onPress={onPress}
    />
  );
}

// Search Button
interface HeaderSearchButtonProps {
  onPress: () => void;
}

export function HeaderSearchButton({ onPress }: HeaderSearchButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Search"
      icon="magnifyingglass"
      onPress={onPress}
    />
  );
}

// Notification Bell
interface HeaderNotificationBellProps {
  onPress: () => void;
  unreadCount?: number;
}

export function HeaderNotificationBell({
  onPress,
  unreadCount,
}: HeaderNotificationBellProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Notifications"
      badge={unreadCount}
      icon="bell"
      onPress={onPress}
    />
  );
}

// Save Button
interface HeaderSaveButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export function HeaderSaveButton({
  onPress,
  isLoading,
  loading,
  disabled,
}: HeaderSaveButtonProps) {
  const colors = useThemeColors();
  const resolvedLoading = isLoading ?? loading;

  return (
    <NativeHeaderActionButton
      accessibilityLabel="Save"
      disabled={disabled}
      icon="checkmark"
      isLoading={resolvedLoading}
      onPress={onPress}
      renderContent={(color) => (
        <ActivityIndicator color={color} size="small" />
      )}
      tintColor={colors.primary}
    />
  );
}

// Back Button (chevron — for sub-pages that are first in their sub-stack)
interface HeaderBackButtonProps {
  onPress?: () => void;
}

export function HeaderBackButton({ onPress }: HeaderBackButtonProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const handlePress = onPress ?? (() => router.back());
  const iconSize = Platform.select({ ios: 22, default: 24 });

  return (
    <Pressable
      accessible
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.backButton,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons
        color={colors.primaryInk}
        name="chevron-back"
        size={iconSize}
      />
    </Pressable>
  );
}

// Cancel Button (Text-based)
interface HeaderCancelButtonProps {
  onPress?: () => void;
}

export function HeaderCancelButton({ onPress }: HeaderCancelButtonProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const handlePress = onPress ?? (() => router.back());

  return (
    <Pressable
      accessible
      accessibilityLabel="Cancel"
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.textButton,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.cancelText,
          { color: colors.primary },
        ]}
      >
        Cancel
      </Text>
    </Pressable>
  );
}

// Edit Button
interface HeaderEditButtonProps {
  onPress: () => void;
}

export function HeaderEditButton({ onPress }: HeaderEditButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Edit"
      icon="pencil"
      onPress={onPress}
    />
  );
}

// Share Button
interface HeaderShareButtonProps {
  onPress: () => void;
}

export function HeaderShareButton({ onPress }: HeaderShareButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Share"
      icon="square.and.arrow.up"
      onPress={onPress}
    />
  );
}

// More Button
interface HeaderMoreButtonProps {
  onPress: () => void;
}

export function HeaderMoreButton({ onPress }: HeaderMoreButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="More options"
      icon="ellipsis"
      onPress={onPress}
    />
  );
}

// Map Toggle Button
interface HeaderMapToggleButtonProps {
  onPress: () => void;
  isMapView?: boolean;
}

export function HeaderMapToggleButton({
  onPress,
  isMapView,
}: HeaderMapToggleButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel={isMapView ? "Show list view" : "Show map view"}
      icon={isMapView ? "list.bullet" : "map"}
      onPress={onPress}
    />
  );
}

// Settings Button
interface HeaderSettingsButtonProps {
  onPress: () => void;
}

export function HeaderSettingsButton({ onPress }: HeaderSettingsButtonProps) {
  return (
    <NativeHeaderActionButton
      accessibilityLabel="Settings"
      icon="gearshape"
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  textButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.41,
  },
});
