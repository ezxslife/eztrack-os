import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '@/theme';
import { uiTokens } from '@/theme/uiTokens';

interface SkeletonLoaderProps {
  variant?: 'card' | 'row' | 'text' | 'avatar' | 'chart';
  count?: number;
  width?: number | string;
  height?: number;
}

export function SkeletonLoader({
  variant = 'card',
  count = 1,
  width = '100%',
  height = 60,
}: SkeletonLoaderProps) {
  const colors = useThemeColors();
  const shimmerAnim = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: uiTokens.skeletonShimmerDuration,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: uiTokens.skeletonShimmerDuration,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const renderVariant = (index: number) => {
    switch (variant) {
      case 'card':
        return (
          <Animated.View
            key={index}
            style={[
              styles.cardSkeleton,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: shimmerAnim,
                marginBottom: 12,
              },
            ]}
          />
        );

      case 'row':
        return (
          <View key={index} style={styles.rowContainer}>
            <Animated.View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  opacity: shimmerAnim,
                },
              ]}
            />
            <View style={styles.rowTexts}>
              <Animated.View
                style={[
                  styles.textLine,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    opacity: shimmerAnim,
                    marginBottom: 8,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.textLine,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    opacity: shimmerAnim,
                    width: '70%',
                  },
                ]}
              />
            </View>
          </View>
        );

      case 'text':
        const randomWidth = Math.random() * 0.3 + 0.7; // 70-100%
        return (
          <Animated.View
            key={index}
            style={[
              styles.textLine,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: shimmerAnim,
                width: `${randomWidth * 100}%`,
                marginBottom: 8,
              },
            ]}
          />
        );

      case 'avatar':
        return (
          <Animated.View
            key={index}
            style={[
              styles.avatarLarge,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: shimmerAnim,
              },
            ]}
          />
        );

      case 'chart':
        return (
          <View key={index} style={styles.chartContainer}>
            {[0, 1, 2, 3].map((barIndex) => (
              <Animated.View
                key={barIndex}
                style={[
                  styles.chartBar,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    opacity: shimmerAnim,
                    height: Math.random() * 80 + 20,
                  },
                ]}
              />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View>
      {Array.from({ length: count }).map((_, index) =>
        renderVariant(index)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    height: 120,
    borderRadius: uiTokens.innerRadius,
    marginHorizontal: uiTokens.screenGutter,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },
  rowTexts: {
    flex: 1,
  },
  textLine: {
    height: 12,
    borderRadius: 6,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chartBar: {
    width: 40,
    borderRadius: 6,
  },
});
