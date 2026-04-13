import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerHaptic } from '@/lib/haptics';
import { formatTime } from '@/lib/date-utils';

export interface LogEntryCardProps {
  id: string;
  content: string;
  category?: string;
  author: string;
  createdAt: string | Date;
  hasMedia?: boolean;
  linkedRecordType?: string;
  linkedRecordId?: string;
  onPress?: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  note: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  activity: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E' },
  alert: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  update: { bg: 'rgba(249, 115, 22, 0.1)', text: '#F97316' },
  flag: { bg: 'rgba(168, 85, 247, 0.1)', text: '#A855F7' },
  default: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
};

export function LogEntryCard({
  id,
  content,
  category,
  author,
  createdAt,
  hasMedia,
  linkedRecordType,
  linkedRecordId,
  onPress,
}: LogEntryCardProps) {
  const { text, textSecondary, textTertiary } = useThemeColors();

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  const timeStr = formatTime(createdAt);
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
            gap: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          {/* Time column */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Menlo',
              fontWeight: '700',
              color: text,
              letterSpacing: 0.3,
              minWidth: 44,
            }}
          >
            {timeStr}
          </Text>

          {/* Content column */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 14,
                color: textSecondary,
                lineHeight: 20,
              }}
              numberOfLines={2}
            >
              {content}
            </Text>
            <Text style={{ fontSize: 12, color: textTertiary }}>
              {author}
            </Text>
          </View>

          {/* Right column: Category, media, linked */}
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
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

            {hasMedia && (
              <AppSymbol name="paperclip" size={14} color={textTertiary} />
            )}

            {linkedRecordType && (
              <AppSymbol name="link" size={14} color={textTertiary} />
            )}
          </View>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}
