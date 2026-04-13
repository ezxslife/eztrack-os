import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerHaptic } from '@/lib/haptics';
import { formatRelativeTime } from '@/lib/date-utils';

export interface IncidentCardProps {
  id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  type?: string;
  location?: string;
  reportedBy?: string;
  reportedAt: string | Date;
  assignedTo?: string;
  participantCount?: number;
  hasMedia?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#3B82F6',      // blue
  medium: '#F59E0B',   // yellow
  high: '#F97316',     // orange
  critical: '#EF4444', // red
};

export function IncidentCard({
  id,
  title,
  description,
  severity,
  status,
  type,
  location,
  reportedBy,
  reportedAt,
  assignedTo,
  participantCount,
  hasMedia,
  onPress,
  onLongPress,
}: IncidentCardProps) {
  const { text, textSecondary, textTertiary, surfaceGrouped } = useThemeColors();

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  const timeAgo = formatRelativeTime(reportedAt);
  const severityColor = SEVERITY_COLORS[severity];

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialSurface variant="grouped" style={{ overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          {/* Severity indicator bar */}
          <View
            style={{
              width: 4,
              height: '100%',
              backgroundColor: severityColor,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />

          {/* Main content */}
          <View style={{ flex: 1, paddingLeft: 16, paddingRight: 12, paddingVertical: 12, marginLeft: 4 }}>
            {/* Top row: Type, title, time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              {type && (
                <AppSymbol
                  name={getIconForType(type)}
                  size={16}
                  weight="semibold"
                  color={textTertiary}
                />
              )}
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '600',
                  color: text,
                  letterSpacing: 0.3,
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: textTertiary,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {timeAgo}
              </Text>
            </View>

            {/* Description */}
            {description && (
              <Text
                style={{
                  fontSize: 14,
                  color: textSecondary,
                  marginBottom: 8,
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {description}
              </Text>
            )}

            {/* Bottom row: Status, location, assignee, media, participants */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <StatusBadge status={status} size="sm" />

              {location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppSymbol name="mappin" size={14} color={textTertiary} />
                  <Text style={{ fontSize: 12, color: textTertiary }} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              )}

              {assignedTo && (
                <Avatar
                  name={assignedTo}
                  size={24}
                  src=""
                />
              )}

              {hasMedia && (
                <AppSymbol name="paperclip" size={14} color={textTertiary} />
              )}

              {participantCount !== undefined && participantCount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <AppSymbol name="person.2" size={12} color={textTertiary} />
                  <Text style={{ fontSize: 11, color: textTertiary }}>
                    {participantCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}

function getIconForType(type: string): string {
  const typeMap: Record<string, string> = {
    fire: 'flame',
    medical: 'cross.circle',
    traffic: 'car',
    hazmat: 'exclamationmark.circle',
    animal: 'pawprint',
    welfare: 'heart',
    crime: 'lock',
    default: 'exclamationmark.triangle',
  };
  return typeMap[type.toLowerCase()] || typeMap.default;
}
