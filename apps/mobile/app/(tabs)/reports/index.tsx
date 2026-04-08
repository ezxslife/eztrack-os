import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { SectionCard } from "@/components/ui/SectionCard";
import { useOfflineStore } from "@/stores/offline-store";
import { useStorageHealthStore } from "@/stores/storage-health-store";
import { useThemeColors } from "@/theme";

const reportCatalog = [
  "Daily log digest",
  "Incident register",
  "Dispatch activity summary",
];

export default function ReportsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const pendingActions = useOfflineStore((state) => state.pendingActions.length);
  const sqliteAvailable = useStorageHealthStore((state) => state.sqliteAvailable);
  const storageTier = useStorageHealthStore((state) => state.tier);

  return (
    <ScreenContainer
      subtitle="This route closes the viewer/reporting navigation gap while PDF export and file delivery are still being built."
      title="Reports"
    >
      <MaterialSurface intensity={78} style={styles.hero} variant="panel">
        <Text style={styles.eyebrow}>Report Pipeline</Text>
        <Text style={styles.title}>Export surfaces are scaffolded</Text>
        <Text style={styles.copy}>
          The mobile shell now has a dedicated reports destination. The actual
          export layer still needs PDF generation, background delivery, and
          share workflows.
        </Text>
      </MaterialSurface>

      <SectionCard title="Report catalog">
        <View style={styles.list}>
          {reportCatalog.map((item) => (
            <View key={item} style={styles.row}>
              <Text style={styles.rowTitle}>{item}</Text>
              <Text style={styles.rowMeta}>Queued for export implementation</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Operational context">
        <View style={styles.list}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Storage tier</Text>
            <Text style={styles.rowMeta}>{storageTier}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>SQLite cache</Text>
            <Text style={styles.rowMeta}>{sqliteAvailable ? "available" : "fallback"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Queued offline actions</Text>
            <Text style={styles.rowMeta}>{pendingActions}</Text>
          </View>
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
