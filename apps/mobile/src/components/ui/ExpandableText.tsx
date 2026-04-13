import React, { useState, useCallback } from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  type TextStyle,
} from "react-native";

import { useThemeColors } from "@/theme";

interface ExpandableTextProps {
  /** The text content to display */
  text: string;
  /** Maximum number of visible lines when collapsed (default: 3) */
  maxLines?: number;
  /** Optional text style overrides */
  style?: TextStyle;
}

/**
 * Text component that truncates to N lines with "Read more" / "Read less" toggle.
 * Uses LayoutAnimation for smooth expand/collapse transitions.
 *
 * Ideal for incident descriptions, resolution notes, and narrative fields.
 *
 * Ported from EZXS-OS ExpandableText.
 */
export function ExpandableText({
  text,
  maxLines = 3,
  style,
}: ExpandableTextProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const handleTextLayout = useCallback(
    (e: { nativeEvent: { lines: Array<{ text: string }> } }) => {
      // Only check on first render when collapsed
      if (!expanded && e.nativeEvent.lines.length > maxLines) {
        setNeedsTruncation(true);
      }
    },
    [expanded, maxLines]
  );

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <>
      <Text
        style={[styles.text, { color: colors.textPrimary }, style]}
        numberOfLines={expanded ? undefined : maxLines}
        onTextLayout={handleTextLayout}
        accessibilityRole="text"
      >
        {text}
      </Text>
      {needsTruncation && (
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Read less" : "Read more"}
          hitSlop={8}
        >
          <Text style={[styles.toggle, { color: colors.primary }]}>
            {expanded ? "Read less" : "Read more"}
          </Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  toggle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
});
