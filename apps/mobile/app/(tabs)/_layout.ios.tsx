import { DynamicColorIOS } from "react-native";

import {
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";

import { RequireAuth } from "@/components/auth/RouteGate";
import {
  useIsDark,
  useThemeColors,
} from "@/theme";

export default function IOSTabLayout() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const defaultLabelColor = DynamicColorIOS({
    dark: "rgba(244, 244, 245, 0.72)",
    light: "rgba(24, 24, 27, 0.72)",
  });

  return (
    <RequireAuth>
      <NativeTabs
        blurEffect={isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
        iconColor={{ default: defaultLabelColor, selected: colors.primaryStrong }}
        labelStyle={{
          default: { color: defaultLabelColor, fontSize: 11, fontWeight: "600" },
          selected: { color: colors.primaryStrong, fontSize: 11, fontWeight: "700" },
        }}
        minimizeBehavior="onScrollDown"
        shadowColor={colors.shadow}
        tintColor={colors.primaryStrong}
      >
        <NativeTabs.Trigger name="dashboard/index">
          <Icon sf={{ default: "rectangle.grid.2x2", selected: "rectangle.grid.2x2.fill" }} />
          <Label>Dashboard</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="daily-log/index">
          <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
          <Label>Daily Log</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="dispatch/index">
          <Icon sf={{ default: "dot.radiowaves.left.and.right", selected: "dot.radiowaves.left.and.right" }} />
          <Label>Dispatch</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="incidents/index">
          <Icon sf={{ default: "exclamationmark.shield", selected: "exclamationmark.shield.fill" }} />
          <Label>Incidents</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="more/index">
          <Icon sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }} />
          <Label>More</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </RequireAuth>
  );
}
