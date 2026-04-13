import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useThemeColors } from '@/theme';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerSelectionHaptic } from '@/lib/haptics';

export interface CarouselPhoto {
  id: string;
  uri: string;
  caption?: string;
  takenAt?: string;
}

export interface ItemPhotoCarouselProps {
  photos: CarouselPhoto[];
  initialIndex?: number;
  onPhotoPress?: (photo: CarouselPhoto, index: number) => void;
  height?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function ItemPhotoCarousel({
  photos,
  initialIndex = 0,
  onPhotoPress,
  height = 280,
}: ItemPhotoCarouselProps) {
  const { textPrimary, textSecondary, surface } = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  if (photos.length === 0) {
    return (
      <View
        style={{
          width: '100%',
          height,
          backgroundColor: surface,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <AppSymbol iosName="photo" fallbackName="images" size={40} color={textSecondary} />
        <Text style={{ fontSize: 13, color: textSecondary, fontWeight: '500' }}>
          No photos
        </Text>
      </View>
    );
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handlePhotoPress = (index: number) => {
    triggerSelectionHaptic();
    onPhotoPress?.(photos[index], index);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <View style={{ width: '100%', height, backgroundColor: surface }}>
      {/* Image carousel */}
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={photos.length > 1}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => handlePhotoPress(index)}
            style={{
              width: SCREEN_WIDTH,
              height: height - (currentPhoto.caption ? 60 : 48),
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: surface,
            }}
          >
            <Image
              source={{ uri: item.uri }}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
              onError={() => {
                // Fallback for failed image loads
              }}
            />
          </Pressable>
        )}
      />

      {/* Caption overlay (if present) */}
      {currentPhoto?.caption && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: '#FFFFFF',
              letterSpacing: 0.2,
            }}
            numberOfLines={2}
          >
            {currentPhoto.caption}
          </Text>
        </View>
      )}

      {/* Page indicator dots */}
      {photos.length > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: currentPhoto?.caption ? 52 : 8,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
          }}
        >
          {photos.map((_, index) => (
            <Pressable
              key={`dot-${index}`}
              onPress={() => {
                triggerSelectionHaptic();
                flatListRef.current?.scrollToIndex({
                  index,
                  animated: true,
                });
              }}
              style={{
                width: index === currentIndex ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
              }}
            />
          ))}
        </View>
      )}

      {/* Photo counter (top right) */}
      {photos.length > 1 && (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            paddingHorizontal: 8,
            paddingVertical: 6,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: '#FFFFFF',
              fontWeight: '600',
              letterSpacing: 0.2,
            }}
          >
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      )}
    </View>
  );
}
