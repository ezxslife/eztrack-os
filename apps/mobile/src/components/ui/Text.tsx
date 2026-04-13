import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from "react-native";

import { useThemeColors, useThemeTypography } from "@/theme";

type TextVariant = "body" | "body-strong" | "caption";

interface TextProps extends RNTextProps {
  style?: StyleProp<TextStyle>;
  variant?: TextVariant;
}

export function Text({ children, style, variant = "body", ...props }: TextProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const variantStyle =
    variant === "caption"
      ? typography.caption1
      : variant === "body-strong"
        ? { ...typography.body, fontWeight: "600" as const }
        : typography.body;

  return (
    <RNText style={[variantStyle, { color: colors.textPrimary }, style]} {...props}>
      {children}
    </RNText>
  );
}
