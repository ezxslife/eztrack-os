import React from 'react';
import { Pressable, View, Image, Text } from 'react-native';
import { useThemeColors } from '@/theme';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerSelectionHaptic } from '@/lib/haptics';

export interface EvidenceItem {
  id: string;
  type: 'photo' | 'video' | 'document' | 'audio';
  uri: string;
  thumbnailUri?: string;
  caption?: string;
  capturedAt?: string;
  fileSize?: string;
}

export interface EvidenceGalleryProps {
  items: EvidenceItem[];
  columns?: number;
  onItemPress?: (item: EvidenceItem) => void;
  onAddPress?: () => void;
  editable?: boolean;
}

const TYPE_ICONS: Record<EvidenceItem['type'], { ios: string; fallback: string }> = {
  photo: { ios: 'photo', fallback: 'image' },
  video: { ios: 'video.fill', fallback: 'film' },
  document: { ios: 'doc.fill', fallback: 'document' },
  audio: { ios: 'waveform.circle.fill', fallback: 'volume-high' },
};

const TYPE_COLORS: Record<EvidenceItem['type'], string> = {
  photo: '#3B82F6',   // blue
  video: '#EF4444',   // red
  document: '#F59E0B', // orange
  audio: '#8B5CF6',   // purple
};

const TYPE_LABELS: Record<EvidenceItem['type'], string> = {
  photo: 'Photo',
  video: 'Video',
  document: 'Doc',
  audio: 'Audio',
};

export function EvidenceGallery({
  items,
  columns = 3,
  onItemPress,
  onAddPress,
  editable = false,
}: EvidenceGalleryProps) {
  const colors = useThemeColors();

  const gridData = editable ? [...items, { id: 'add-button' } as any] : items;
  const itemWidthPercent = 100 / columns;

  const renderItem = (item: EvidenceItem | { id: string }) => {
    const isAddButton = item.id === 'add-button';

    if (isAddButton) {
      return (
        <View
          key={item.id}
          style={{
            width: `${itemWidthPercent}%`,
            aspectRatio: 1,
            padding: 6,
          }}
        >
          <Pressable
            onPress={() => {
              triggerSelectionHaptic();
              onAddPress?.();
            }}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 8,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
              backgroundColor: colors.backgroundMuted,
            })}
          >
            <AppSymbol
              iosName="plus.circle.fill"
              fallbackName="add-circle"
              size={32}
              color={colors.primary}
            />
            <Text
              style={{
                fontSize: 10,
                color: colors.textTertiary,
                marginTop: 4,
                fontWeight: '500',
              }}
            >
              Add
            </Text>
          </Pressable>
        </View>
      );
    }

    const evidence = item as EvidenceItem;
    const typeColor = TYPE_COLORS[evidence.type];
    const typeIcon = TYPE_ICONS[evidence.type];
    const typeLabel = TYPE_LABELS[evidence.type];

    return (
      <View
        key={evidence.id}
        style={{
          width: `${itemWidthPercent}%`,
          aspectRatio: 1,
          padding: 6,
        }}
      >
        <Pressable
          onPress={() => {
            triggerSelectionHaptic();
            onItemPress?.(evidence);
          }}
          style={({ pressed }) => ({
            flex: 1,
            borderRadius: 8,
            overflow: 'hidden',
            opacity: pressed ? 0.7 : 1,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          })}
        >
          {/* Thumbnail or placeholder */}
          {evidence.type === 'photo' && evidence.uri ? (
            <Image
              source={{ uri: evidence.thumbnailUri || evidence.uri }}
              style={{ flex: 1, width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : evidence.type === 'video' ? (
            <>
              {evidence.thumbnailUri ? (
                <Image
                  source={{ uri: evidence.thumbnailUri }}
                  style={{ flex: 1, width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.backgroundMuted,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <AppSymbol
                    iosName={typeIcon.ios as any}
                    fallbackName={typeIcon.fallback as any}
                    size={32}
                    color={typeColor}
                  />
                </View>
              )}
              {/* Play icon overlay */}
              <View
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ translateX: -20 }, { translateY: -20 }],
                }}
              >
                <AppSymbol
                  iosName="play.fill"
                  fallbackName="play"
                  size={18}
                  color="#FFFFFF"
                />
              </View>
            </>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.backgroundMuted,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <AppSymbol
                iosName={typeIcon.ios as any}
                fallbackName={typeIcon.fallback as any}
                size={32}
                color={typeColor}
              />
            </View>
          )}

          {/* Type badge overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              {typeLabel}
            </Text>
          </View>
        </Pressable>

        {/* Caption below thumbnail */}
        {evidence.caption && (
          <Text
            style={{
              fontSize: 10,
              color: colors.textSecondary,
              marginTop: 4,
              lineHeight: 12,
            }}
            numberOfLines={2}
          >
            {evidence.caption}
          </Text>
        )}

        {/* Metadata below caption */}
        {(evidence.capturedAt || evidence.fileSize) && (
          <Text
            style={{
              fontSize: 9,
              color: colors.textTertiary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {[evidence.capturedAt, evidence.fileSize].filter(Boolean).join(' • ')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {gridData.map((item) => renderItem(item))}
    </View>
  );
}
