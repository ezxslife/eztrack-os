import { ReactNode, useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";

import { GlassSheetBackground } from "@/components/ui/glass/GlassSheetBackground";
import { triggerNotificationHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeTypography } from "@/theme";

interface GlassSheetModalProps {
  children: ReactNode;
  enableDismissOnBackdropPress?: boolean;
  enablePanDownToClose?: boolean;
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  title?: string;
}

export function GlassSheetModal({
  children,
  enableDismissOnBackdropPress = true,
  enablePanDownToClose = true,
  isOpen,
  onClose,
  snapPoints = ["50%", "90%"],
  title,
}: GlassSheetModalProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const bottomSheetModalRef = useRef<BottomSheetModalType>(null);

  const styles = StyleSheet.create({
    backdrop: {
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      paddingTop: 8,
    },
    title: {
      ...typography.headline,
      color: colors.textPrimary,
      fontWeight: "700",
    },
  });

  const handleDismiss = useCallback(() => {
    triggerNotificationHaptic("success");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        onPress={enableDismissOnBackdropPress ? handleDismiss : undefined}
        style={styles.backdrop}
      />
    ),
    [enableDismissOnBackdropPress, handleDismiss, styles.backdrop]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef as any}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundComponent={() => <GlassSheetBackground />}
      onDismiss={handleDismiss}
      enableDismissOnBackdropPress={enableDismissOnBackdropPress}
      enablePanDownToClose={enablePanDownToClose}
      {...({} as any)}
    >
      <BottomSheetView style={styles.content}>
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
