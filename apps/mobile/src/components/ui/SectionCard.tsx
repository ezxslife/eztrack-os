import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/glass/GlassCard";
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
  const styles = StyleSheet.create({
    card: {
      gap: 14,
    },
    footer: {
      paddingTop: 4,
    },
    header: {
      gap: 4,
    },
    subtitle: {
      ...typography.caption1,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    title: {
      ...typography.subheadline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
  });

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </GlassCard>
  );
}
