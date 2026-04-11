import { TabRootStackLayout } from "@/navigation/TabRootStackLayout";
import { TAB_ROOT_ROUTE_METADATA } from "@/navigation/route-metadata";

export default function ReportsStackLayout() {
  return <TabRootStackLayout title={TAB_ROOT_ROUTE_METADATA.reports.title} />;
}
