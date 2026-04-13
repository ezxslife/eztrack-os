import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColors, useThemeTypography } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerHaptic } from '@/lib/haptics';
import { formatRelativeTime } from '@/lib/date-utils';

export interface DispatchCardProps {
  id: string;
  code: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'created' | 'dispatched' | 'en_route' | 'on_scene' | 'resolved' | 'cancelled';
  assignedUnit?: string;
  assignedTo?: string;
  location?: string;
  createdAt: string | Date;
  eta?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  created: '#6B7280',      // gray
  dispatched: '#3B82F6',   // blue
  en_route: '#F97316',     // orange
  on_scene: '#10B981',     // green
  resolved: '#6B7280',     // gray
  cancelled: '#EF4444',    // red
};

export function DispatchCard({
  id,
  code,
  description,
  priority,
  status,
  assignedUnit,
  assignedTo,
  location,
  createdAt,
  eta,
  onPress,
  onLongPress,
}: DispatchCardProps) {
  const { text, textSecondary, textTertiary } = useThemeColors();

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  const timeAgo = formatRelativeTime(createdAt);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialSurface variant="grouped">
        <View style={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}>
          {/* Top row: Code, priority badge, time ago */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Menlo',
                fontWeight: '700',
                color: text,
                letterSpacing: 0.5,
              }}
            >
              {code}
            </Text>
            <PriorityBadge priority={priority} size="sm" />
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
          <Text
            style={{
              fontSize: 14,
              color: textSecondary,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>

          {/* Bottom row: Status, unit, location, ETA */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 4,
            }}
          >
            <StatusBadge status={getStatusLabel(status)} size="sm" />

            {assignedUnit && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 12, color: textTertiary, fontWeight: '500' }}>
                  {assignedUnit}
                </Text>
              </View>
            )}

            {location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppSymbol name="mappin" size={14} color={textTertiary} />
                <Text style={{ fontSize: 12, color: textTertiary }} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            )}

            {eta && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppSymbol name="clock" size={14} color={textTertiary} />
                <Text style={{ fontSize: 12, color: textTertiary }}>
                  ETA {eta}
                </Text>
              </View>
            )}
          </View>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}

function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    created: 'Created',
    dispatched: 'Dispatched',
    en_route: 'En Route',
    on_scene: 'On Scene',
    resolved: 'Resolved',
    cancelled: 'Cancelled',
  };
  return labelMap[status] || status;
}
