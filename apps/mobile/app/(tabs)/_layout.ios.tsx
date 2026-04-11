import { DynamicColorIOS } from "react-native";

import {
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";

import { RequireAuth } from "@/components/auth/RouteGate";
import { getTabsForRole } from "@/navigation/tab-specs";
import { useAuthStore } from "@/stores/auth-store";
import {
  useIsDark,
  useThemeColors,
} from "@/theme";

export default function IOSTabLayout() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const role = useAuthStore((state) => state.profile?.role);
  const tabs = getTabsForRole(role);
  const defaultLabelColor = DynamicColorIOS({
    dark: "rgba(244, 244, 245, 0.72)",
    light: "rgba(24, 24, 27, 0.72)",
  });

  return (
    <RequireAuth>
      <NativeTabs
        blurEffect={isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
        iconColor={{ default: defaultLabelColor, selected: colors.primaryInk }}
        labelStyle={{
          default: { color: defaultLabelColor, fontSize: 11, fontWeight: "600" },
          selected: { color: colors.primaryInk, fontSize: 11, fontWeight: "700" },
        }}
        minimizeBehavior="onScrollDown"
        shadowColor={colors.shadow}
        tintColor={colors.primaryInk}
      >
        {tabs.map((tab) => (
          <NativeTabs.Trigger
            key={tab.routeName}
            name={tab.routeName}
            role={tab.nativeRole}
          >
            <Icon
              sf={{
                default: tab.sfSymbol.default as any,
                selected: tab.sfSymbol.selected as any,
              }}
            />
            <Label>{tab.title}</Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    </RequireAuth>
  );
}
