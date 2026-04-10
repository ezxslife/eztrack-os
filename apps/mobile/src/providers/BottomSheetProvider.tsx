import type { ComponentType, ReactNode } from "react";
import { Platform } from "react-native";

interface BottomSheetProviderProps {
  children: ReactNode;
}

export function BottomSheetProvider({
  children,
}: BottomSheetProviderProps) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }

  try {
    const {
      BottomSheetModalProvider,
    } = require("@gorhom/bottom-sheet") as {
      BottomSheetModalProvider: ComponentType<{ children: ReactNode }>;
    };

    return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>;
  } catch (error) {
    console.warn(
      "[BottomSheetProvider] Native bottom-sheet provider unavailable, continuing without it.",
      error
    );
    return <>{children}</>;
  }
}
