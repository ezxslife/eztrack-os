import {
  RefreshControl,
  type RefreshControlProps,
} from "react-native";

import { useSupportsLiquidGlass } from "@/hooks/useSupportsLiquidGlass";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors } from "@/theme";

interface GlassRefreshControlProps extends Omit<RefreshControlProps, "onRefresh" | "tintColor"> {
  onRefresh: () => void;
  tintColor?: string;
}

export function GlassRefreshControl({
  onRefresh,
  tintColor,
  ...props
}: GlassRefreshControlProps) {
  const colors = useThemeColors();
  const { platformTier } = useSupportsLiquidGlass();

  const handleRefresh = () => {
    triggerSelectionHaptic();
    onRefresh();
  };

  const effectiveTintColor = tintColor ?? colors.primary;

  // On glass tier, use system native refresh control with no tint override
  // On blur/opaque tiers, apply tint color
  const refreshProps =
    platformTier === "glass"
      ? {
          ...props,
          onRefresh: handleRefresh,
        }
      : {
          ...props,
          onRefresh: handleRefresh,
          tintColor: effectiveTintColor,
        };

  return <RefreshControl {...refreshProps} />;
}
