/**
 * RefreshProgressStrip — Branded pull-to-refresh indicator.
 *
 * Replaces the default iOS blue spinner with a pulsing shield icon
 * and a shimmer progress bar. Pair with `tintColor="transparent"` on
 * RefreshControl to hide the native spinner.
 *
 * Usage:
 *   <RefreshProgressStrip visible={query.isRefetching} />
 */
import React, { useRef, useEffect } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';
import { useThemeColors, useIsDark } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const BAR_W = Math.round(SCREEN_W * 0.55);
const SHIMMER_W = Math.round(BAR_W * 0.35);

interface RefreshProgressStripProps {
  visible: boolean;
  /** Top offset in px — renders the strip below the nav bar */
  topOffset?: number;
}

export function RefreshProgressStrip({
  visible,
  topOffset = 0,
}: RefreshProgressStripProps) {
  const colors = useThemeColors();
  const isDark = useIsDark();

  // Animation values
  const height = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const rotateCycle = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;
  const shimmerPos = useRef(new Animated.Value(0)).current;

  const loops = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loops.current.forEach((a) => a.stop());
    loops.current = [];

    if (visible) {
      rotateCycle.setValue(0);
      shimmerPos.setValue(0);

      // ── Entrance ──
      Animated.parallel([
        Animated.spring(height, {
          toValue: 48,
          tension: 180,
          friction: 14,
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 220,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // ── Gentle rotation ──
      const rotate = Animated.loop(
        Animated.timing(rotateCycle, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

      // ── Glow pulse ──
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.55,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      // ── Shimmer sweep ──
      const sweep = Animated.loop(
        Animated.timing(shimmerPos, {
          toValue: 1,
          duration: 1400,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      );

      loops.current = [rotate, glow, sweep];
      rotate.start();
      glow.start();
      sweep.start();
    } else {
      // ── Exit ──
      Animated.parallel([
        Animated.timing(height, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        rotateCycle.setValue(0);
        shimmerPos.setValue(0);
      });
    }

    return () => {
      loops.current.forEach((a) => a.stop());
    };
  }, [visible, height, scale, rotateCycle, glowOpacity, shimmerPos]);

  // ── Interpolations ──

  const rotate = rotateCycle.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerX = shimmerPos.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_W, BAR_W],
  });

  const accentColor = colors.primary;
  const barBg = isDark ? `${accentColor}22` : `${accentColor}14`;

  return (
    <Animated.View
      style={[styles.strip, { height, top: topOffset }]}
      pointerEvents="none"
    >
      {/* Pulsing icon */}
      <Animated.View
        style={[
          styles.iconWrap,
          {
            transform: [{ rotate }, { scale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOpacity, backgroundColor: accentColor },
          ]}
        />
        <View
          style={[
            styles.iconInner,
            { backgroundColor: accentColor },
          ]}
        >
          <View style={styles.iconDot} />
        </View>
      </Animated.View>

      {/* Shimmer progress bar */}
      <View style={[styles.barTrack, { backgroundColor: barBg }]}>
        <Animated.View
          style={[
            styles.barShimmer,
            {
              backgroundColor: accentColor,
              transform: [{ translateX: shimmerX }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    transform: [{ scale: 1.8 }],
  },
  iconInner: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  iconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  barTrack: {
    width: '55%',
    height: 2.5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SHIMMER_W,
    height: '100%',
    borderRadius: 2,
    opacity: 0.6,
  },
});
