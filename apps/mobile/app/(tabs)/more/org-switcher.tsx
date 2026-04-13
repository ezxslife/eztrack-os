import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";
import { triggerImpactHaptic } from "@/lib/haptics";

interface Organization {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  isActive: boolean;
}

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "1",
    name: "Downtown Security",
    role: "Shift Supervisor",
    memberCount: 24,
    isActive: true,
  },
  {
    id: "2",
    name: "Metro Transit Security",
    role: "Team Lead",
    memberCount: 18,
    isActive: false,
  },
  {
    id: "3",
    name: "Airport Authority",
    role: "Security Officer",
    memberCount: 42,
    isActive: false,
  },
  {
    id: "4",
    name: "Corporate Buildings Inc.",
    role: "Operations Manager",
    memberCount: 156,
    isActive: false,
  },
];

function OrgCard({
  org,
  isActive,
  colors,
  typography,
  layout,
  onSelect,
}: {
  org: Organization;
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  typography: ReturnType<typeof useThemeTypography>;
  layout: ReturnType<typeof useAdaptiveLayout>;
  onSelect: (org: Organization) => void;
}) {
  const styles = createCardStyles(colors, typography, layout);

  return (
    <Pressable onPress={() => onSelect(org)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.name}>{org.name}</Text>
          <Text style={styles.role}>{org.role}</Text>
        </View>
        {isActive && (
          <View style={styles.checkmark}>
            <AppSymbol
              iosName="checkmark.circle.fill"
              fallbackName="check"
              size={24}
              color={colors.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <AppSymbol
            iosName="person.2.fill"
            fallbackName="people"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>{org.memberCount} members</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {isActive && (
        <View style={styles.activeIndicator}>
          <View style={styles.dot} />
          <Text style={styles.activeLabel}>Currently using</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function OrgSwitcherScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = createStyles(colors, typography, layout);
  const router = useRouter();
  const [organizations, setOrganizations] = useState(MOCK_ORGANIZATIONS);
  const [activeOrgId, setActiveOrgId] = useState("1");

  const handleSelectOrg = (org: Organization) => {
    if (org.id === activeOrgId) {
      return;
    }

    triggerImpactHaptic();
    Alert.alert(
      "Switch Organization",
      `Switch to ${org.name}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Switch",
          onPress: () => {
            triggerImpactHaptic();
            setActiveOrgId(org.id);
            Alert.alert(
              "Success",
              `Switched to ${org.name}`
            );
            // TODO: Refresh app context with new org data
          },
        },
      ]
    );
  };

  const handleJoinOrg = () => {
    triggerImpactHaptic();
    Alert.alert(
      "Join Organization",
      "Enter organization code or select from list",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Browse",
          onPress: () => {
            // TODO: Navigate to org discovery
            Alert.alert("Browse Organizations", "Opening organization browser...");
          },
        },
      ]
    );
  };

  const activeOrg = organizations.find((org) => org.id === activeOrgId);

  return (
    <>
      <Stack.Screen options={{ title: "Switch Organization" }} />
      <ScreenContainer nativeHeader>

        {/* Current Organization */}
        {activeOrg && (
          <View style={styles.currentSection}>
            <SectionHeader title="Currently Using" />
            <OrgCard
              org={activeOrg}
              isActive={true}
              colors={colors}
              typography={typography}
              layout={layout}
              onSelect={() => {}}
            />
          </View>
        )}

        {/* Other Organizations */}
        <View style={styles.listSection}>
          <SectionHeader
            title={`Other Organizations (${organizations.length - 1})`}
          />
          <FlatList
            data={organizations.filter((org) => org.id !== activeOrgId)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <OrgCard
                org={item}
                isActive={false}
                colors={colors}
                typography={typography}
                layout={layout}
                onSelect={handleSelectOrg}
              />
            )}
          />
        </View>

        {/* Join Organization */}
        <View style={styles.footer}>
          <Button
            variant="secondary"
            label="Join Organization"
            icon="add-circle"
            onPress={handleJoinOrg}
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: layout.listItemPadding,
      paddingVertical: 12,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
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
    role: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    checkmark: {
      width: 28,
      height: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    meta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    badge: {
      backgroundColor: colors.surfaceTintMedium,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    badgeText: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    activeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingTop: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    activeLabel: {
      ...typography.caption1,
      color: colors.primary,
      fontWeight: "500",
    },
  });
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    currentSection: {
      gap: 8,
      marginBottom: 24,
      paddingHorizontal: layout.horizontalPadding,
    },
    listSection: {
      gap: 8,
      flex: 1,
      paddingHorizontal: layout.horizontalPadding,
    },
    separator: {
      height: 8,
    },
    footer: {
      paddingHorizontal: layout.horizontalPadding,
      paddingBottom: 24,
      paddingTop: 16,
    },
  });
}
