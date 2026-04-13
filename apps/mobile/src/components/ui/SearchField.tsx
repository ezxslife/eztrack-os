import {
  type NativeSyntheticEvent,
  Platform,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextInputSubmitEditingEventData,
  type ViewStyle,
  View,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useAdaptiveLayout } from "@/theme/layout";
import { useThemeColors, useThemeControls, useThemeTypography } from "@/theme";

interface SearchFieldProps extends Pick<TextInputProps, "autoFocus"> {
  onChangeText?: (value: string) => void;
  onSubmitEditing?: (
    event: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  value: string;
}

export function SearchField({
  onChangeText,
  onSubmitEditing,
  placeholder,
  style,
  value,
  autoFocus,
}: SearchFieldProps) {
  const colors = useThemeColors();
  const controls = useThemeControls();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = StyleSheet.create({
    input: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
      minHeight: layout.controlMinHeight - 12,
      paddingVertical: 0,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    surface: {
      backgroundColor: Platform.OS === "ios" ? controls.searchFieldFill : undefined,
      minHeight: layout.controlMinHeight,
      paddingHorizontal: layout.isRegularWidth ? 16 : 14,
      paddingVertical: Platform.OS === "ios" ? 9 : 10,
    },
  });

  return (
    <MaterialSurface
      intensity={48}
      style={[styles.surface, style]}
      variant={Platform.OS === "ios" ? "grouped" : "subtle"}
    >
      <View style={styles.row}>
        <AppSymbol
          color={colors.textTertiary}
          fallbackName="search"
          iosName="magnifyingglass"
          size={18}
          weight="medium"
        />
        <TextInput
          autoCapitalize="none"
          autoFocus={autoFocus}
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          selectionColor={colors.primaryStrong}
          style={styles.input}
          value={value}
        />
      </View>
    </MaterialSurface>
  );
}
