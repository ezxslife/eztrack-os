import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";

export function GroupedCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MaterialSurface padding={0} style={style} variant="grouped">
      {children}
    </MaterialSurface>
  );
}
