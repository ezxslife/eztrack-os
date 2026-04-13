import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useAdaptiveLayout } from "@/theme/layout";
import {
  useThemeColors,
  useThemeTypography,
} from "@/theme";

interface SectionCardProps {
  children: ReactNode;
  footer?: ReactNode;
  title: string;
  subtitle?: string;
}

export function SectionCard({
  children,
  footer,
  title,
  subtitle,
}: SectionCardProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const styles = StyleSheet.create({
    card: {
      gap: layout.cardPadding - 4,
    },
    footer: {
      paddingTop: 4,
    },
    header: {
      gap: 2,
    },
    subtitle: {
      ...typography.footnote,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    title: {
      ...typography.callout,
      color: colors.textPrimary,
      fontWeight: "700",
    },
  });

  return (
    <MaterialSurface padding={layout.cardPadding} style={styles.card} variant="panel">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </MaterialSurface>
  );
}
