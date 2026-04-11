import { useNavigation } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Platform,
  type NativeSyntheticEvent,
} from "react-native";
import type { SearchBarCommands } from "react-native-screens";

import { getBlurTabHeaderOptions } from "@/theme/headers";
import { useThemeColors, useThemeControls, useThemeTypography } from "@/theme";

interface UseIOSNativeSearchHeaderProps {
  onSubmit?: (query: string) => void;
  placeholder: string;
  query: string;
  setQuery: (value: string) => void;
  title: string;
}

interface SearchHeaderTextEvent {
  nativeEvent: {
    text: string;
  };
}

export function useIOSNativeSearchHeader({
  onSubmit,
  placeholder,
  query,
  setQuery,
  title,
}: UseIOSNativeSearchHeaderProps) {
  const navigation = useNavigation();
  const navigationRef = useRef(navigation);
  const colors = useThemeColors();
  const controls = useThemeControls();
  const typography = useThemeTypography();
  const searchRef = useRef<SearchBarCommands | null>(null);
  const onSubmitRef = useRef(onSubmit);
  const setQueryRef = useRef(setQuery);
  const syncedQueryRef = useRef<string | null>(null);
  const nativeIOSHeader = Platform.OS === "ios";

  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    setQueryRef.current = setQuery;
  }, [setQuery]);

  const handleCancelButtonPress = useCallback(() => {
    setQueryRef.current("");
  }, []);

  const handleChangeText = useCallback(
    (event: NativeSyntheticEvent<SearchHeaderTextEvent["nativeEvent"]>) => {
      setQueryRef.current(event.nativeEvent.text);
    },
    []
  );

  const handleSearchButtonPress = useCallback(
    (event: NativeSyntheticEvent<SearchHeaderTextEvent["nativeEvent"]>) => {
      const nextQuery = event.nativeEvent.text;
      setQueryRef.current(nextQuery);
      onSubmitRef.current?.(nextQuery);
    },
    []
  );

  const headerOptions = useMemo(() => {
    if (!nativeIOSHeader) {
      return null;
    }

    return {
      ...getBlurTabHeaderOptions(colors.background),
      headerLargeTitle: true,
      headerLargeTitleShadowVisible: false,
      headerLargeTitleStyle: {
        color: colors.textPrimary,
        fontSize: typography.largeTitle.fontSize,
        fontWeight: typography.largeTitle.fontWeight,
      },
      headerSearchBarOptions: {
        allowToolbarIntegration: true,
        autoCapitalize: "none" as const,
        barTintColor: controls.searchFieldFill,
        hideWhenScrolling: false,
        obscureBackground: false,
        onCancelButtonPress: handleCancelButtonPress,
        onChangeText: handleChangeText,
        onSearchButtonPress: handleSearchButtonPress,
        placement: "automatic" as const,
        placeholder,
        ref: searchRef,
        textColor: colors.textPrimary,
        tintColor: colors.primaryInk,
      },
      headerShadowVisible: false,
      headerShown: true,
      headerTintColor: colors.primaryInk,
      headerTitleStyle: {
        color: colors.textPrimary,
        fontSize: typography.headline.fontSize,
        fontWeight: typography.headline.fontWeight,
      },
      title,
    };
  }, [
    colors.background,
    colors.primaryInk,
    colors.textPrimary,
    controls.searchFieldFill,
    handleCancelButtonPress,
    handleChangeText,
    handleSearchButtonPress,
    nativeIOSHeader,
    placeholder,
    title,
    typography.headline.fontSize,
    typography.headline.fontWeight,
    typography.largeTitle.fontSize,
    typography.largeTitle.fontWeight,
  ]);

  useLayoutEffect(() => {
    if (!headerOptions) {
      return;
    }

    navigationRef.current.setOptions(headerOptions);
  }, [headerOptions]);

  useEffect(() => {
    if (!nativeIOSHeader || !searchRef.current) {
      return;
    }

    if (syncedQueryRef.current === query) {
      return;
    }

    syncedQueryRef.current = query;

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
