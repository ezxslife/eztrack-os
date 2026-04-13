import type { ReactElement } from "react";
import type {
  NativeStackHeaderItem,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Platform, type ImageSourcePropType } from "react-native";

import { getPlatformTier } from "@/hooks/useSupportsLiquidGlass";

const IOS = Platform.OS === "ios";
const ENABLE_IOS_NATIVE_HEADER_ITEMS = true;

// ---------------------------------------------------------------------------
// Native Item Builders (ported from EZXS-OS)
// ---------------------------------------------------------------------------

export type NativeHeaderButtonVariant = "plain" | "done" | "prominent";

interface NativeHeaderButtonArgs {
  onPress: () => void;
  accessibilityLabel: string;
  label?: string;
  tintColor?: string;
  variant?: NativeHeaderButtonVariant;
  width?: number;
  identifier?: string;
  disabled?: boolean;
}

/** SF Symbol button — native hit target on iOS. */
export function makeNativeSfButtonItem(
  name: string,
  {
    onPress,
    accessibilityLabel,
    label = "",
    tintColor,
    variant = "plain",
    width,
    identifier,
    disabled,
  }: NativeHeaderButtonArgs
): NativeStackHeaderItem {
  return {
    type: "button",
    label,
    icon: { type: "sfSymbol", name: name as any },
    onPress,
    accessibilityLabel,
    tintColor,
    variant,
    width,
    identifier,
    disabled,
  };
}

/** Text-only button (no icon). */
export function makeNativeTextButtonItem({
  onPress,
  accessibilityLabel,
  label,
  tintColor,
  variant = "plain",
  width,
  identifier,
  disabled,
}: NativeHeaderButtonArgs): NativeStackHeaderItem {
  return {
    type: "button",
    label: label ?? "",
    onPress,
    accessibilityLabel,
    tintColor,
    variant,
    width,
    identifier,
    disabled,
  };
}

/** Image button (e.g. avatar or logo). */
export function makeNativeImageButtonItem(
  source: ImageSourcePropType,
  {
    onPress,
    accessibilityLabel,
    label = "",
    tintColor,
    variant = "plain",
    width,
    identifier,
    disabled,
  }: NativeHeaderButtonArgs
): NativeStackHeaderItem {
  return {
    type: "button",
    label,
    icon: { type: "image", source, tinted: false },
    onPress,
    accessibilityLabel,
    tintColor,
    variant,
    width,
    identifier,
    disabled,
  };
}

/** Custom React element rendered as a native header item. */
export function makeNativeCustomHeaderItem(
  element: ReactElement,
  options?: { hidesSharedBackground?: boolean }
): NativeStackHeaderItem {
  return {
    type: "custom",
    element,
    hidesSharedBackground: options?.hidesSharedBackground,
  };
}

/** Native back button — chevron.left SF Symbol on iOS. */
export function makeNativeBackButtonItem(
  onPress: () => void,
  accessibilityLabel = "Go back"
): NativeStackHeaderItem {
  return makeNativeSfButtonItem("chevron.left", {
    onPress,
    accessibilityLabel,
    width: 44,
    identifier: "native-back-button",
  });
}

/** Native close (X) button — xmark SF Symbol on iOS. */
export function makeNativeCloseButtonItem(
  onPress: () => void,
  accessibilityLabel = "Close"
): NativeStackHeaderItem {
  return makeNativeSfButtonItem("xmark", {
    onPress,
    accessibilityLabel,
    width: 44,
    identifier: "native-close-button",
  });
}

/** Native check (done) button — checkmark SF Symbol on iOS. */
export function makeNativeCheckButtonItem(
  onPress: () => void,
  accessibilityLabel = "Done"
): NativeStackHeaderItem {
  return makeNativeSfButtonItem("checkmark", {
    onPress,
    accessibilityLabel,
    variant: "done",
    width: 44,
    identifier: "native-check-button",
  });
}

// ---------------------------------------------------------------------------
// Platform-Aware Header Items (anti-double-render)
// ---------------------------------------------------------------------------

interface PlatformHeaderItemsOptions {
  /** React component for left side (Android, or iOS fallback when no native items). */
  Left?: ReactElement;
  /** React component for right side (Android, or iOS fallback when no native items). */
  Right?: ReactElement;
  /** Native items for left side (iOS only). Takes priority over Left on iOS. */
  leftItems?: NativeStackHeaderItem[];
  /** Native items for right side (iOS only). Takes priority over Right on iOS. */
  rightItems?: NativeStackHeaderItem[];
}

/**
 * Platform-aware header items helper.
 *
 * On iOS: uses unstable_headerLeftItems/unstable_headerRightItems (native hit targets).
 * On Android: uses headerLeft/headerRight (React components).
 *
 * IMPORTANT: When native items are provided for a side, the React component for that
 * side is NOT rendered. Setting both causes the React component to render as a floating
 * glass capsule overlay (the "gray blob" bug) on iOS 26.
 */
export function platformHeaderItems({
  Left,
  Right,
  leftItems,
  rightItems,
}: PlatformHeaderItemsOptions): Pick<
  NativeStackNavigationOptions,
  | "headerLeft"
  | "headerRight"
  | "unstable_headerLeftItems"
  | "unstable_headerRightItems"
> {
  const useNativeItems = IOS && ENABLE_IOS_NATIVE_HEADER_ITEMS;
  const options: Pick<
    NativeStackNavigationOptions,
    | "headerLeft"
    | "headerRight"
    | "unstable_headerLeftItems"
    | "unstable_headerRightItems"
  > = {};

  // React components are only used as fallback: Android, or iOS with no native item
  // for that side. Never render both for the same side.
  if ((!useNativeItems || !leftItems) && Left) {
    options.headerLeft = () => Left;
  }
  if ((!useNativeItems || !rightItems) && Right) {
    options.headerRight = () => Right;
  }

  if (useNativeItems && leftItems) {
    options.unstable_headerLeftItems = () => leftItems;
  }
  if (useNativeItems && rightItems) {
    options.unstable_headerRightItems = () => rightItems;
  }

  return options;
}

// ---------------------------------------------------------------------------
// Liquid Glass Header Options (unified tab-root builder)
// ---------------------------------------------------------------------------

interface LiquidGlassHeaderOptions {
  title?: string;
  Left?: ReactElement;
  Right?: ReactElement;
  leftItems?: NativeStackHeaderItem[];
  rightItems?: NativeStackHeaderItem[];
  backgroundColor?: string;
}

/**
 * Unified header builder for tab-root screens on iOS 26.
 *
 * Handles transparent header, scroll edge effects, anti-double-glass,
 * and title management in one call.
 */
export function makeLiquidGlassHeaderOptions({
  title,
  Left,
  Right,
  leftItems,
  rightItems,
  backgroundColor,
}: LiquidGlassHeaderOptions): NativeStackNavigationOptions {
  const useNativeItems = IOS && ENABLE_IOS_NATIVE_HEADER_ITEMS;
  const supportsGlass = getPlatformTier() === "glass";

  return {
    headerShown: true,
    headerTransparent: IOS,
    headerLeft:
      (!useNativeItems || !leftItems) && Left ? () => Left : undefined,
    headerRight:
      (!useNativeItems || !rightItems) && Right ? () => Right : undefined,
    unstable_headerLeftItems:
      useNativeItems && leftItems ? () => leftItems : undefined,
    unstable_headerRightItems:
      useNativeItems && rightItems ? () => rightItems : undefined,
    headerTitle: title ?? "",
    headerBackButtonDisplayMode: "minimal",
    headerShadowVisible: false,
    ...(IOS && supportsGlass
      ? { scrollEdgeEffects: { top: "automatic" as const } }
      : {}),
    ...(IOS && backgroundColor
      ? { contentStyle: { backgroundColor } }
      : {}),
  };
}
