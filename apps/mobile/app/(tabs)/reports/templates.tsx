import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
} from "react-native";
import { Stack } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  lastGenerated: string | null;
  icon: string;
}

const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: "1",
    name: "Incident Summary",
    description: "Overview of incidents reported in selected period",
    type: "Incidents",
    lastGenerated: "2026-04-10",
    icon: "exclamationmark.triangle.fill",
  },
  {
    id: "2",
    name: "Shift Report",
    description: "Daily shift summary with key activities",
    type: "Operations",
    lastGenerated: "2026-04-09",
    icon: "doc.text.fill",
  },
  {
    id: "3",
    name: "Monthly Analytics",
    description: "Performance metrics and statistics",
    type: "Analytics",
    lastGenerated: null,
    icon: "chart.bar.fill",
  },
  {
    id: "4",
    name: "Patrol Report",
    description: "Detailed patrol activities and observations",
    type: "Operations",
    lastGenerated: "2026-04-08",
    icon: "location.fill",
  },
];

function TemplateCard({
  template,
  colors,
  typography,
  layout,
  onGenerate,
  onEdit,
  onDelete,
}: {
  template: ReportTemplate;
  colors: ReturnType<typeof useThemeColors>;
  typography: ReturnType<typeof useThemeTypography>;
  layout: ReturnType<typeof useAdaptiveLayout>;
  onGenerate: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const styles = createCardStyles(colors, typography, layout);

  return (
    <MaterialSurface variant="chrome" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <AppSymbol
            iosName={template.icon as any}
            fallbackName="document"
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.name}>{template.name}</Text>
          <Text style={styles.type}>{template.type}</Text>
        </View>
      </View>

      <Text style={styles.description}>{template.description}</Text>

      {template.lastGenerated && (
        <Text style={styles.lastGenerated}>
          Last generated: {new Date(template.lastGenerated).toLocaleDateString()}
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          variant="primary"
          label="Generate"
          onPress={() => {
            triggerImpactHaptic();
            onGenerate(template.id);
          }}
        />
        <Pressable onPress={() => onEdit(template.id)}>
          <Text style={styles.actionLink}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(template.id)}>
          <Text style={[styles.actionLink, styles.deleteLink]}>Delete</Text>
        </Pressable>
      </View>
    </MaterialSurface>
  );
}

export default function ReportTemplatesScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const [templates] = useState(MOCK_TEMPLATES);

  const handleGenerate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    Alert.alert(
      "Generate Report",
      `Generate ${template?.name}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Generate",
          onPress: () => {
            triggerImpactHaptic();
            // TODO: Trigger report generation
            Alert.alert("Success", `${template?.name} generated successfully`);
          },
        },
      ]
    );
  };

  const handleEdit = (id: string) => {
    const template = templates.find((t) => t.id === id);
    Alert.alert("Edit Template", `Edit ${template?.name}`);
  };

  const handleDelete = (id: string) => {
    const template = templates.find((t) => t.id === id);
    Alert.alert(
      "Delete Template",
      `Delete ${template?.name}? This cannot be undone.`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            triggerImpactHaptic();
            // TODO: Delete template
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Report Templates" }} />
      <ScreenContainer nativeHeader>
        <View style={styles.section}>
          <SectionHeader title={`Templates (${templates.length})`} />
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                colors={colors}
                typography={typography}
                layout={layout}
                onGenerate={handleGenerate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          />
        </View>
      </ScreenContainer>
    </>
  );
}

function createCardStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.surfaceTintMedium,
      justifyContent: "center",
      alignItems: "center",
    },
    titleSection: {
      flex: 1,
      gap: 4,
    },
    name: {
      ...typography.subheadline,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    type: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    lastGenerated: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      marginTop: 4,
    },
    actionLink: {
      ...typography.subheadline,
      color: colors.primary,
      fontWeight: "600",
    },
    deleteLink: {
      color: colors.error,
    },
  });
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    section: {
      gap: 8,
      paddingHorizontal: layout.horizontalPadding,
    },
    separator: {
      height: 8,
    },
  });
}
