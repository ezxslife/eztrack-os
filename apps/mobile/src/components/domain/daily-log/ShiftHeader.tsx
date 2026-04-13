import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors, useThemeTypography } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { AppSymbol } from '@/components/ui/AppSymbol';

export interface ShiftHeaderProps {
  shiftName: string;
  startTime: string;
  endTime?: string;
  personnelCount: number;
  isActive: boolean;
  onViewSchedule?: () => void;
}

export function ShiftHeader({
  shiftName,
  startTime,
  endTime,
  personnelCount,
  isActive,
  onViewSchedule,
}: ShiftHeaderProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const statusDotColor = isActive ? colors.success : colors.textTertiary;
  const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

  return (
    <MaterialSurface variant="chrome">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        {/* Left: Shift info */}
        <View style={{ flex: 1, gap: 6 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: statusDotColor,
              }}
            />
            <Text
              style={{
                fontSize: typography.subheadline.fontSize,
                lineHeight: typography.subheadline.lineHeight,
                fontWeight: '600',
                color: colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {shiftName}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              color: colors.textSecondary,
              paddingLeft: 16,
            }}
          >
            {timeRange}
          </Text>
        </View>

        {/* Middle: Personnel count */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: colors.surface,
            borderRadius: 8,
          }}
        >
          <AppSymbol
            iosName="person.2.fill"
            fallbackName="people"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              fontWeight: '600',
              color: colors.textSecondary,
            }}
          >
            {personnelCount}
          </Text>
        </View>

        {/* Right: View Schedule link */}
        {onViewSchedule && (
          <Pressable
            onPress={onViewSchedule}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                lineHeight: 16,
                fontWeight: '600',
                color: colors.primary,
              }}
            >
              View
            </Text>
          </Pressable>
        )}
      </View>
    </MaterialSurface>
  );
}
