import type {
  NativeStackHeaderItem,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Platform } from "react-native";

interface PlatformHeaderItemsOptions {
  leftNative?: NativeStackHeaderItem[];
  leftReact?: NativeStackNavigationOptions["headerLeft"];
  rightNative?: NativeStackHeaderItem[];
  rightReact?: NativeStackNavigationOptions["headerRight"];
}

export function platformHeaderItems({
  leftNative,
  leftReact,
  rightNative,
  rightReact,
}: PlatformHeaderItemsOptions): Pick<
  NativeStackNavigationOptions,
  | "headerLeft"
  | "headerRight"
  | "unstable_headerLeftItems"
  | "unstable_headerRightItems"
> {
  if (Platform.OS === "ios") {
    return {
      unstable_headerLeftItems: leftNative
        ? () => leftNative
        : undefined,
      unstable_headerRightItems: rightNative
        ? () => rightNative
        : undefined,
    };
  }

  return {
    headerLeft: leftReact,
    headerRight: rightReact,
  };
}
