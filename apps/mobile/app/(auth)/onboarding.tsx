import { useRouter, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { AppSymbol } from "@/components/ui/AppSymbol";
import { triggerImpactHaptic, triggerSelectionHaptic } from "@/lib/haptics";
import * as Haptics from "expo-haptics";
import {
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
} from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

const SLIDES = [
  {
    id: "1",
    icon: "clipboard.fill",
    title: "Track Everything",
    description: "Log incidents, dispatch requests, and operational events in real time.",
  },
  {
    id: "2",
    icon: "antenna.radiowaves.left.and.right",
    title: "Stay Connected",
    description: "Receive instant updates and collaborate with your team across all devices.",
  },
  {
    id: "3",
    icon: "wifi.slash",
    title: "Work Offline",
    description: "Continue tracking even without internet. Changes sync automatically.",
  },
];

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const handleSkip = () => {
    triggerSelectionHaptic();
    router.replace("/dashboard");
  };

  const handleGetStarted = () => {
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/dashboard");
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      triggerSelectionHaptic();
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: spacing[2],
      paddingBottom: spacing[3],
    },
    skipButton: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },
    skipButtonText: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    spacer: {
      width: 48,
    },
    slide: {
      width,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: layout.horizontalPadding,
    },
    slideContent: {
      alignItems: "center",
      gap: spacing[4],
    },
    icon: {
      width: 72,
      height: 72,
      color: colors.primaryInk,
    },
    title: {
      ...typography.title1,
      color: colors.textPrimary,
      fontWeight: "700",
      letterSpacing: -0.4,
      textAlign: "center",
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 280,
      lineHeight: 22,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing[2],
      marginTop: spacing[6],
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.borderSubtle,
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.primaryInk,
    },
    footer: {
      paddingHorizontal: layout.horizontalPadding,
      paddingBottom: spacing[6],
      gap: spacing[3],
    },
    button: {
      width: "100%",
    },
  });

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => {
    const iconMap: Record<string, any> = {
      "clipboard.fill": "clipboard.fill",
      "antenna.radiowaves.left.and.right": "antenna.radiowaves.left.and.right",
      "wifi.slash": "wifi.slash",
    };

    const fallbackMap: Record<string, any> = {
      "clipboard.fill": "list",
      "antenna.radiowaves.left.and.right": "radio",
      "wifi.slash": "wifi-off",
    };

    return (
      <View style={styles.slide}>
        <View style={styles.slideContent}>
          <AppSymbol
            iosName={iconMap[item.icon] as any}
            fallbackName={fallbackMap[item.icon]}
            size={72}
            color={colors.primaryInk}
          />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.skipButton,
            pressed ? { opacity: 0.72 } : null,
          ]}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfigRef.current}
        scrollEnabled={true}
        decelerationRate="fast"
      />

      <View style={styles.dots}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {isLastSlide ? (
          <Button
            label="Get Started"
            onPress={handleGetStarted}
            style={styles.button}
            variant="primary"
          />
        ) : (
          <Button
            label="Next"
            onPress={handleNext}
            style={styles.button}
            variant="primary"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
