import { useWindowDimensions } from "react-native";

export interface AdaptiveLayoutMetrics {
  bodyGap: number;
  cardPadding: number;
  compactControlMinHeight: number;
  contentMaxWidth: number;
  controlMinHeight: number;
  fontScale: number;
  gridGap: number;
  horizontalPadding: number;
  isRegularWidth: boolean;
  isWideWidth: boolean;
  listItemPadding: number;
  minGridColumnWidth: number;
  statsColumns: number;
  verticalPadding: number;
}

export function getAdaptiveLayoutMetrics(width: number, fontScale: number): AdaptiveLayoutMetrics {
  const normalizedFontScale = Math.max(1, Math.min(fontScale || 1, 1.6));
  const isRegularWidth = width >= 768;
  const isWideWidth = width >= 1024;
  const isLargePhone = width >= 430;

  return {
    bodyGap: isRegularWidth ? 20 : 16,
    cardPadding: isRegularWidth ? 18 : 16,
    compactControlMinHeight: normalizedFontScale >= 1.2 ? 40 : 36,
    contentMaxWidth: width >= 1366 ? 1040 : isWideWidth ? 960 : isRegularWidth ? 760 : width,
    controlMinHeight: normalizedFontScale >= 1.2 ? 48 : 44,
    fontScale: normalizedFontScale,
    gridGap: isRegularWidth ? 16 : 12,
    horizontalPadding: width >= 1280 ? 32 : isRegularWidth ? 24 : isLargePhone ? 20 : 16,
    isRegularWidth,
    isWideWidth,
    listItemPadding: isRegularWidth ? 16 : 14,
    minGridColumnWidth: isWideWidth ? 260 : isRegularWidth ? 220 : 160,
    statsColumns: isWideWidth ? 3 : isRegularWidth ? 2 : 1,
    verticalPadding: isRegularWidth ? 24 : 20,
  };
}

export function useAdaptiveLayout() {
  const { fontScale, width } = useWindowDimensions();

  return getAdaptiveLayoutMetrics(width, fontScale);
}
