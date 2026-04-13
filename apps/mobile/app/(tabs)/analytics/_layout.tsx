import { TabRootStackLayout } from "@/navigation/TabRootStackLayout";
import { TAB_ROOT_ROUTE_METADATA } from "@/navigation/route-metadata";

export default function AnalyticsStackLayout() {
  return (
    <TabRootStackLayout
      title={TAB_ROOT_ROUTE_METADATA.analytics.title}
      screens={[
        { name: "drill-down", options: { title: "Metric Details" } },
        { name: "export", options: { title: "Export Data" } },
        { name: "comparison", options: { title: "Period Comparison" } },
      ]}
    />
  );
}
