import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  SymbolView,
  type SymbolType,
  type SymbolWeight,
} from "expo-symbols";
import {
  Platform,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface AppSymbolProps {
  color?: ColorValue;
  fallback?: ReactNode;
  fallbackName?: string;
  iosName?: string;
  name?: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  type?: SymbolType;
  weight?: SymbolWeight;
}

export function AppSymbol({
  color,
  fallback,
  fallbackName,
  iosName,
  name,
  size,
  style,
  type = "monochrome",
  weight = "regular",
}: AppSymbolProps) {
  const resolvedFallbackName = fallbackName ?? name ?? "ellipse";
  const resolvedIosName = iosName ?? name;

  const iconFallback = fallback ?? (
    <Ionicons
      color={typeof color === "string" ? color : undefined}
      name={resolvedFallbackName as any}
      size={size}
      style={style as any}
    />
  );

  if (Platform.OS !== "ios" || !resolvedIosName) {
    return <>{iconFallback}</>;
  }

  // Constrain SymbolView to an exact size × size box.
  // Without this, SF Symbols include intrinsic font metrics (ascender/descender
  // space) that make the icon appear to have ~5px extra top padding when placed
  // inside flex containers with alignItems: "center".
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <SymbolView
        fallback={iconFallback}
        name={resolvedIosName as any}
        size={size}
        tintColor={color ?? "#000000"}
        type={type}
        weight={weight}
      />
    </View>
  );
}
