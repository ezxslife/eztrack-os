import { useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Platform,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from "react-native";
import type { SearchBarCommands } from "react-native-screens";

import { useThemeColors, useThemeControls, useThemeTypography } from "@/theme";

interface UseIOSNativeSearchHeaderProps {
  onSubmit?: (query: string) => void;
  placeholder: string;
  query: string;
  setQuery: (value: string) => void;
  title: string;
}

export function useIOSNativeSearchHeader({
  onSubmit,
  placeholder,
  query,
  setQuery,
  title,
}: UseIOSNativeSearchHeaderProps) {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const controls = useThemeControls();
  const typography = useThemeTypography();
  const searchRef = useRef<SearchBarCommands | null>(null);
  const nativeIOSHeader = Platform.OS === "ios";

  useLayoutEffect(() => {
    if (!nativeIOSHeader) {
      navigation.setOptions({
        headerShown: false,
      });
      return;
    }

    navigation.setOptions({
      headerBackButtonDisplayMode: "minimal",
      headerBlurEffect: "systemChromeMaterial",
      headerLargeTitle: true,
      headerLargeTitleShadowVisible: false,
      headerLargeTitleStyle: {
        color: colors.textPrimary,
        fontSize: typography.largeTitle.fontSize,
        fontWeight: typography.largeTitle.fontWeight,
      },
      headerSearchBarOptions: {
        allowToolbarIntegration: true,
        autoCapitalize: "none",
        barTintColor: controls.searchFieldFill,
        hideWhenScrolling: false,
        obscureBackground: false,
        onCancelButtonPress: () => setQuery(""),
        onChangeText: (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
          setQuery(event.nativeEvent.text);
        },
        onSearchButtonPress: (
          event: NativeSyntheticEvent<TextInputFocusEventData>
        ) => {
          const nextQuery = event.nativeEvent.text;
          setQuery(nextQuery);
          onSubmit?.(nextQuery);
        },
        placement: "automatic",
        placeholder,
        ref: searchRef,
        textColor: colors.textPrimary,
        tintColor: colors.primaryStrong,
      },
      headerShadowVisible: false,
      headerShown: true,
      headerStyle: {
        backgroundColor: controls.headerBackground,
      },
      headerTintColor: colors.primaryStrong,
      headerTitleStyle: {
        color: colors.textPrimary,
        fontSize: typography.headline.fontSize,
        fontWeight: typography.headline.fontWeight,
      },
      title,
    });
  }, [
    colors.primaryStrong,
    colors.textPrimary,
    controls.headerBackground,
    controls.searchFieldFill,
    navigation,
    nativeIOSHeader,
    onSubmit,
    placeholder,
    setQuery,
    title,
    typography.headline.fontSize,
    typography.headline.fontWeight,
    typography.largeTitle.fontSize,
    typography.largeTitle.fontWeight,
  ]);

  useEffect(() => {
    if (!nativeIOSHeader || !searchRef.current) {
      return;
    }

    if (query) {
      searchRef.current.setText(query);
    } else {
      searchRef.current.clearText();
    }
  }, [nativeIOSHeader, query]);

  return {
    nativeIOSHeader,
  };
}
