import { StyleSheet, View } from "react-native";

import { useAdaptiveLayout } from "@/theme/layout";
import { useThemeSpacing } from "@/theme";

export interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
}

export function DashboardGrid({ children, columns: maxColumns = 2 }: DashboardGridProps) {
  const layout = useAdaptiveLayout();
  const spacing = useThemeSpacing();

  // Determine actual columns based on layout
  const actualColumns = layout.isRegularWidth ? maxColumns : 1;
  const gap = spacing[3];

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap,
      marginHorizontal: -gap / 2,
    },
    itemContainer: {
      width: actualColumns === 2 ? `${50}%` : "100%",
      paddingHorizontal: gap / 2,
      marginBottom: gap,
    },
  });

  const childArray = Array.isArray(children) ? children : [children];

  return (
    <View style={styles.container}>
      {childArray.map((child, index) => (
        <View key={index} style={styles.itemContainer}>
          {child}
        </View>
      ))}
    </View>
  );
}
