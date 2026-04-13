import { useState, useCallback } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { ConfirmationSheet } from "@/components/ui/glass/ConfirmationSheet";
import { triggerImpactHaptic } from "@/lib/haptics";
import { useThemeColors } from "@/theme";
import * as Haptics from "expo-haptics";

export interface MediaItem {
  id: string;
  uri: string;
  type: "image" | "video";
  caption?: string;
  timestamp?: string | Date;
}

interface MediaPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  initialIndex?: number;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function MediaPreviewSheet({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  onDelete,
  onShare,
}: MediaPreviewSheetProps) {
  const colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const currentItem = items[currentIndex];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: "#000000",
      flex: 1,
    },
    topBar: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      zIndex: 10,
    },
    topBarAction: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    mediaContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    bottomBar: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    captionContainer: {
      gap: 4,
    },
    caption: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },
    timestamp: {
      color: "rgba(255, 255, 255, 0.6)",
      fontSize: 12,
      lineHeight: 16,
    },
    pageIndicators: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      justifyContent: "center",
    },
    dot: {
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    activeDot: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    inactiveDot: {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    videoBadge: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: 4,
      height: 32,
      justifyContent: "center",
      position: "absolute",
      width: 32,
    },
  });

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleShare = useCallback(() => {
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
    onShare?.(currentItem.id);
  }, [currentItem.id, onShare]);

  const handleDeletePress = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.(currentItem.id);
  }, [currentItem.id, onDelete]);

  const renderPageDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.dot,
        index === currentIndex ? styles.activeDot : styles.inactiveDot,
      ]}
    />
  );

  const onMediaScroll = (event: any) => {
    const pageIndex = Math.round(
      event.nativeEvent.contentOffset.x /
        event.nativeEvent.layoutMeasurement.width
    );
    setCurrentIndex(pageIndex);
  };

  const renderMediaItem = ({ item }: ListRenderItemInfo<MediaItem>) => (
    <View
      style={[
        styles.mediaContainer,
        { width: "100%", height: "100%" },
      ]}
    >
      {item.type === "image" ? (
        <Image
          source={{ uri: item.uri }}
          style={styles.image}
        />
      ) : (
        <>
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
          />
          <View style={styles.videoBadge}>
            <AppSymbol
              color="#FFFFFF"
              fallbackName="play"
              iosName="play.fill"
              size={16}
            />
          </View>
        </>
      )}
    </View>
  );

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Modal
        visible={isOpen}
        transparent={false}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.topBarAction}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <AppSymbol
                color="#FFFFFF"
                fallbackName="close"
                iosName="xmark"
                size={24}
              />
            </Pressable>

            <View style={{ flex: 1 }} />

            {onShare && (
              <Pressable
                style={styles.topBarAction}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share media"
              >
                <AppSymbol
                  color="#FFFFFF"
                  fallbackName="share-social"
                  iosName="square.and.arrow.up"
                  size={20}
                />
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                style={styles.topBarAction}
                onPress={handleDeletePress}
                accessibilityRole="button"
                accessibilityLabel="Delete media"
              >
                <AppSymbol
                  color="#FF3B30"
                  fallbackName="trash"
                  iosName="trash.fill"
                  size={20}
                />
              </Pressable>
            )}
          </View>

          <FlatList
            data={items}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            onScroll={onMediaScroll}
            scrollEnabled={items.length > 1}
            nestedScrollEnabled={false}
          />

          {currentItem.caption || currentItem.timestamp ? (
            <View style={styles.bottomBar}>
              {currentItem.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.caption}>{currentItem.caption}</Text>
                </View>
              )}
              {currentItem.timestamp && (
                <Text style={styles.timestamp}>
                  {formatDate(currentItem.timestamp)}
                </Text>
              )}
            </View>
          ) : null}

          {items.length > 1 && (
            <View
              style={[
                styles.bottomBar,
                { paddingVertical: 12, paddingHorizontal: 16 },
              ]}
            >
              <View style={styles.pageIndicators}>
                {items.map((_, index) => renderPageDot(index))}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {onDelete && currentItem && (
        <ConfirmationSheet
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Media"
          description="Are you sure you want to delete this media? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="destructive"
        />
      )}
    </>
  );
}
