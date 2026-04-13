import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";

import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { SkeletonLoader } from "@/components/feedback/SkeletonLoader";
import { useThemeColors } from "@/theme";

interface GroupedCardProps {
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  header?: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GroupedCard({
  children,
  collapsible = false,
  defaultExpanded = true,
  header,
  loading = false,
  style,
}: GroupedCardProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const heightAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, heightAnim, rotateAnim]);

  const heightInterpolation = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-90deg"],
  });

  const styles = StyleSheet.create({
    chevron: {
      transform: [{ rotate: rotateInterpolation }],
    },
    content: {
      overflow: "hidden",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  });

  if (loading) {
    return (
      <MaterialSurface padding={0} style={style} variant="grouped">
        <SkeletonLoader variant="card" />
      </MaterialSurface>
    );
  }

  if (collapsible && header) {
    return (
      <MaterialSurface padding={0} style={style} variant="grouped">
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.header}
        >
          <View style={{ flex: 1 }}>{header}</View>
          <Animated.View style={styles.chevron}>
            <AppSymbol
              name="chevron.right"
              size={14}
              color={colors.textTertiary}
            />
          </Animated.View>
        </Pressable>
        <Animated.View
          style={[
            styles.content,
            {
              height: heightInterpolation,
            },
          ]}
        >
          {children}
        </Animated.View>
      </MaterialSurface>
    );
  }

  return (
    <MaterialSurface padding={0} style={style} variant="grouped">
      {children}
    </MaterialSurface>
  );
}
