import { Ionicons } from "@expo/vector-icons";
import {
  SymbolView,
  type SFSymbol,
  type SymbolType,
  type SymbolWeight,
} from "expo-symbols";
import {
  Platform,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface AppSymbolProps {
  color: ColorValue;
  fallbackName: keyof typeof Ionicons.glyphMap;
  iosName?: SFSymbol;
  size: number;
  style?: StyleProp<ViewStyle>;
  type?: SymbolType;
  weight?: SymbolWeight;
}

export function AppSymbol({
  color,
  fallbackName,
  iosName,
  size,
  style,
  type = "monochrome",
  weight = "regular",
}: AppSymbolProps) {
  const fallback = (
    <Ionicons
      color={typeof color === "string" ? color : undefined}
      name={fallbackName}
      size={size}
      style={style as any}
    />
  );

  if (Platform.OS !== "ios" || !iosName) {
    return fallback;
  }

  return (
    <SymbolView
      fallback={fallback}
      name={iosName}
      size={size}
      style={style}
      tintColor={color}
      type={type}
      weight={weight}
    />
  );
}
