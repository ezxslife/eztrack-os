import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { useThemeColors } from "@/theme";

const reportCatalog = [
  { label: "Incident Summary", type: "incident-summary" },
  { label: "Dispatch Log", type: "dispatch-log" },
  { label: "Daily Activity", type: "daily-activity" },
  { label: "Patron Flags", type: "patron-flags" },
  { label: "Case Status", type: "case-status" },
  { label: "Lost & Found Inventory", type: "lost-found-inventory" },
  { label: "Financial Summary", type: "financial-summary" },
  { label: "Visitor Log", type: "visitor-log" },
];

export default function ReportsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const router = useRouter();

  return (
    <ScreenContainer
      subtitle="Real report catalog with drilldown routes and export entry points."
      title="Reports"
    >
      <MaterialSurface intensity={78} style={styles.hero} variant="panel">
        <Text style={styles.eyebrow}>Report Pipeline</Text>
        <Text style={styles.title}>Export surfaces are scaffolded</Text>
        <Text style={styles.copy}>
          Choose a report type to load live rows and share the current result set as CSV from mobile.
        </Text>
      </MaterialSurface>

      <SectionCard title="Report catalog">
        <View style={styles.list}>
          {reportCatalog.map((item) => (
            <Pressable
              key={item.type}
              onPress={() =>
                router.push({
                  pathname: "/reports/[type]",
                  params: { type: item.type },
                })
              }
              style={styles.row}
            >
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowMeta}>{item.type}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    copy: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    eyebrow: {
      color: colors.accentSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    hero: {
      gap: 8,
    },
    list: {
      gap: 12,
    },
    row: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 18,
      gap: 4,
      padding: 14,
    },
    rowMeta: {
      color: colors.textTertiary,
      fontSize: 13,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
    },
  });
}
