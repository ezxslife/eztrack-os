import { TabRootStackLayout } from "@/navigation/TabRootStackLayout";
import { TAB_ROOT_ROUTE_METADATA } from "@/navigation/route-metadata";

export default function IncidentsStackLayout() {
  return (
    <TabRootStackLayout
      title={TAB_ROOT_ROUTE_METADATA.incidents.title}
      screens={[
        { name: "map", options: { title: "Incident Map" } },
        { name: "stats", options: { title: "Incident Statistics" } },
      ]}
    />
  );
}
