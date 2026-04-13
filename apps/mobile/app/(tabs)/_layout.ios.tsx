import { DynamicColorIOS } from "react-native";

import {
  Badge,
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
import { useTabBadges } from "@/hooks/useTabBadges";

export default function IOSTabLayout() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const role = useAuthStore((state) => state.profile?.role);
  const tabs = getTabsForRole(role);
  const badges = useTabBadges();
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
        tintColor={colors.primaryInk}
      >
        {tabs.map((tab) => {
          const badgeCount = badges[tab.routeName as keyof typeof badges];
          return (
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
              {badgeCount && badgeCount > 0 ? (
                <Badge>{String(badgeCount)}</Badge>
              ) : null}
            </NativeTabs.Trigger>
          );
        })}
      </NativeTabs>
    </RequireAuth>
  );
}
