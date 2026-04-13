import React from 'react';
import { Pressable, View, Text, Image } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerHaptic } from '@/lib/haptics';
import { formatRelativeTime } from '@/lib/date-utils';

export interface ItemCardProps {
  id: string;
  description: string;
  category?: string;
  status: 'found' | 'claimed' | 'returned' | 'disposed';
  location?: string;
  foundAt: string | Date;
  thumbnailUrl?: string;
  onPress?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  keys: { bg: 'rgba(249, 115, 22, 0.1)', text: '#F97316' },
  wallet: { bg: 'rgba(168, 85, 247, 0.1)', text: '#A855F7' },
  phone: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  documents: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E' },
  electronics: { bg: 'rgba(232, 121, 249, 0.1)', text: '#E879F9' },
  clothing: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  jewelry: { bg: 'rgba(236, 72, 153, 0.1)', text: '#EC4899' },
  default: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
};

const STATUS_COLORS: Record<string, string> = {
  found: '#3B82F6',        // blue
  claimed: '#F97316',      // orange
  returned: '#10B981',     // green
  disposed: '#6B7280',     // gray
};

export function ItemCard({
  id,
  description,
  category,
  status,
  location,
  foundAt,
  thumbnailUrl,
  onPress,
}: ItemCardProps) {
  const { text, textSecondary, textTertiary } = useThemeColors();

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  const timeAgo = formatRelativeTime(foundAt);
  const categoryColors = category ? CATEGORY_COLORS[category.toLowerCase()] : CATEGORY_COLORS.default;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialSurface variant="grouped">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          {/* Thumbnail image or placeholder */}
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
              }}
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <AppSymbol name="questionmark.circle" size={28} color={textTertiary} />
            </View>
          )}

          {/* Center: Description, location, time */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: text,
                letterSpacing: 0.3,
              }}
              numberOfLines={2}
            >
              {description}
            </Text>

            {location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppSymbol name="mappin" size={12} color={textTertiary} />
                <Text style={{ fontSize: 12, color: textSecondary }} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 11, color: textTertiary }}>
              {timeAgo}
            </Text>
          </View>

          {/* Right: Status badge, category */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <StatusBadge status={getStatusLabel(status)} size="sm" />

            {category && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: categoryColors.bg,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: categoryColors.text + '30',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: categoryColors.text,
                    fontWeight: '500',
                  }}
                >
                  {category}
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
    found: 'Found',
    claimed: 'Claimed',
    returned: 'Returned',
    disposed: 'Disposed',
  };
  return labelMap[status] || status;
}
