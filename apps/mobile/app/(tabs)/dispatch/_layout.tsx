import { TabRootStackLayout } from "@/navigation/TabRootStackLayout";
import { TAB_ROOT_ROUTE_METADATA } from "@/navigation/route-metadata";

export default function DispatchStackLayout() {
  return (
    <TabRootStackLayout
      title={TAB_ROOT_ROUTE_METADATA.dispatch.title}
      screens={[
        { name: "map", options: { title: "Dispatch Map" } },
      ]}
    />
  );
}
