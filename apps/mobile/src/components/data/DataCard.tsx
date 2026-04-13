import React, { useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Text,
} from 'react-native';
import { useThemeColors, useThemeTypography, useThemeSpacing } from '@/theme';
import { triggerHaptic } from '@/lib/haptics';
import { MaterialSurface } from '../ui/MaterialSurface';
import { Avatar } from '../ui/Avatar';
import { AppSymbol } from '../ui/AppSymbol';

interface DataCardProps {
  title: string;
  subtitle?: string;
  timestamp?: string | Date;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  icon?: string;
  avatarName?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return dateObj.toLocaleDateString();
}

function getPriorityColor(
  priority: 'low' | 'medium' | 'high' | 'critical',
  colors: ReturnType<typeof useThemeColors>
): string {
  switch (priority) {
    case 'low':
      return colors.info;
    case 'medium':
      return colors.warning;
    case 'high':
      return colors.error;
    case 'critical':
      return colors.error;
    default:
      return colors.textTertiary;
  }
}

export function DataCard({
  title,
  subtitle,
  timestamp,
  status,
  priority,
  icon,
  avatarName,
  onPress,
  onLongPress,
  rightContent,
  children,
}: DataCardProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();

  const relativeTime = useMemo(() => {
    return timestamp ? getRelativeTime(timestamp) : null;
  }, [timestamp]);

  const priorityColor = priority ? getPriorityColor(priority, colors) : null;

  const handlePress = () => {
    if (onPress) {
      triggerHaptic('light');
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      triggerHaptic('medium');
      onLongPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={!onPress && !onLongPress}
    >
      <MaterialSurface variant="grouped" style={styles.container}>
        <View style={styles.contentRow}>
          {/* Left: Icon or Avatar */}
          {avatarName ? (
            <Avatar name={avatarName} size="md" />
          ) : icon ? (
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceContainerLow }]}>
              <AppSymbol
                name={icon}
                size={24}
                color={colors.textSecondary}
              />
            </View>
          ) : null}

          {/* Center: Title, Subtitle, Timestamp */}
          <View style={styles.centerContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[1] }}>
              <View style={{ flex: 1 }}>
                {/* Title */}
                <Text
                  style={{
                    fontSize: typography.headline.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: spacing[0.5],
                  } as TextStyle}
                >
                  {title}
                </Text>
              </View>
            </View>

            {/* Subtitle */}
            {subtitle && (
              <Text
                style={{
                  fontSize: typography.callout.fontSize,
                  color: colors.textSecondary,
                  marginBottom: spacing[1],
                } as TextStyle}
              >
                {subtitle}
              </Text>
            )}

            {/* Timestamp */}
            {relativeTime && (
              <Text
                style={{
                  fontSize: typography.footnote.fontSize,
                  color: colors.textTertiary,
                } as TextStyle}
              >
                {relativeTime}
              </Text>
            )}
          </View>

          {/* Right: Status, Priority, Actions */}
          <View style={styles.rightSection}>
            {status && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.caption1.fontSize,
                    color: colors.textSecondary,
                  } as TextStyle}
                >
                  {status}
                </Text>
              </View>
            )}

            {priority && (
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: priorityColor ?? colors.textTertiary },
                ]}
              />
            )}

            {rightContent}
          </View>
        </View>

        {/* Children */}
        {children && <View style={{ marginTop: spacing[2] }}>{children}</View>}
      </MaterialSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
