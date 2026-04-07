import { type ReactNode } from "react";
import {
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";

interface GlassCardProps {
  children: ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  padding = 18,
  style,
}: GlassCardProps) {
  return (
    <MaterialSurface padding={padding} style={style} variant="panel">
      {children}
    </MaterialSurface>
  );
}
