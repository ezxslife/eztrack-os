import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useThemeColors } from "@/theme";

interface SearchFieldProps {
  onChangeText?: (value: string) => void;
  placeholder: string;
  value: string;
}

export function SearchField({
  onChangeText,
  placeholder,
  value,
}: SearchFieldProps) {
  const colors = useThemeColors();
  const styles = StyleSheet.create({
    input: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: 16,
      paddingVertical: 0,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    surface: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
  });

  return (
    <MaterialSurface intensity={64} style={styles.surface} variant="subtle">
      <View style={styles.row}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          clearButtonMode="while-editing"
          onChangeText={onChangeText}
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
