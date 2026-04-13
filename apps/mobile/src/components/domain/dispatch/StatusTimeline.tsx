import React, { useMemo } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useThemeColors, useThemeTypography } from '@/theme';

export interface StatusTimelineProps {
  currentStatus: 'created' | 'dispatched' | 'en_route' | 'on_scene' | 'resolved' | 'cancelled';
  timestamps?: Partial<Record<string, string>>;
  onStatusPress?: (status: string) => void;
}

const STATUS_ORDER = ['created', 'dispatched', 'en_route', 'on_scene', 'resolved'] as const;

const STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  dispatched: 'Dispatched',
  en_route: 'En Route',
  on_scene: 'On Scene',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

export function StatusTimeline({
  currentStatus,
  timestamps,
  onStatusPress,
}: StatusTimelineProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const statusArray = useMemo(() => {
    if (currentStatus === 'cancelled') {
      return ['created', 'cancelled'];
    }
    return STATUS_ORDER;
  }, [currentStatus]);

  const getStatusState = (status: string) => {
    if (currentStatus === 'cancelled') {
      if (status === 'cancelled') return 'current';
      return 'completed';
    }

    const statusIndex = STATUS_ORDER.indexOf(status as any);
    const currentIndex = STATUS_ORDER.indexOf(currentStatus as any);

    if (statusIndex < currentIndex) return 'completed';
    if (statusIndex === currentIndex) return 'current';
    return 'future';
  };

  const getDotSize = (status: string) => {
    const state = getStatusState(status);
    return state === 'current' ? 14 : 10;
  };

  const getDotColor = (status: string) => {
    const state = getStatusState(status);
    if (status === 'cancelled') {
      return state === 'completed' ? colors.primary : colors.error;
    }
    if (state === 'completed' || state === 'current') {
      return colors.primary;
    }
    return colors.border;
  }

  const getLineStyle = (index: number) => {
    if (index === statusArray.length - 1) {
      return { display: 'none' };
    }

    const nextStatus = statusArray[index + 1];
    const state = getStatusState(statusArray[index]);
    const nextState = getStatusState(nextStatus);

    const isCompleted = state === 'completed' || (state === 'current' && nextState === 'completed');
    const isDashed = !isCompleted;

    return {
      flex: 1,
      height: 2,
      backgroundColor: isCompleted ? colors.primary : 'transparent',
      borderWidth: isDashed ? 1 : 0,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginHorizontal: 6,
    } as any;
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 16,
        }}
      >
        {statusArray.map((status, index) => (
          <React.Fragment key={status}>
            <Pressable
              onPress={() => onStatusPress?.(status)}
              disabled={!onStatusPress}
              style={({ pressed }) => ({
                opacity: pressed && onStatusPress ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: getDotSize(status),
                    height: getDotSize(status),
                    borderRadius: getDotSize(status) / 2,
                    backgroundColor:
                      getStatusState(status) === 'future'
                        ? 'transparent'
                        : getDotColor(status),
                    borderWidth: getStatusState(status) === 'future' ? 2 : 0,
                    borderColor: colors.border,
                  }}
                />
                <Text
                  style={{
                    fontSize: typography.caption1.fontSize,
                    lineHeight: typography.caption1.lineHeight,
                    color: colors.textPrimary,
                    fontWeight: '500',
                    textAlign: 'center',
                    maxWidth: 56,
                  }}
                  numberOfLines={2}
                >
                  {STATUS_LABELS[status]}
                </Text>
                {timestamps?.[status] && (
                  <Text
                    style={{
                      fontSize: 10,
                      lineHeight: 14,
                      color: colors.textTertiary,
                      textAlign: 'center',
                      maxWidth: 56,
                    }}
                    numberOfLines={1}
                  >
                    {timestamps[status]}
                  </Text>
                )}
              </View>
            </Pressable>

            {index < statusArray.length - 1 && (
              <View style={getLineStyle(index)} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
