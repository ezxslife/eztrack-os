import { TabRootStackLayout } from "@/navigation/TabRootStackLayout";
import { TAB_ROOT_ROUTE_METADATA } from "@/navigation/route-metadata";

export default function MoreStackLayout() {
  return (
    <TabRootStackLayout
      title={TAB_ROOT_ROUTE_METADATA.more.title}
      screens={[
        { name: "org-switcher", options: { title: "Switch Organization" } },
      ]}
    />
  );
}
