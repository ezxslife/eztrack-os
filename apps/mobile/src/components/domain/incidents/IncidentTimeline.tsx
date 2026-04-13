import React, { useState } from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColors, useThemeTypography } from '@/theme';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerSelectionHaptic } from '@/lib/haptics';
import { formatRelativeTimestamp } from '@/lib/format';

export interface TimelineEvent {
  id: string;
  type: 'created' | 'updated' | 'status_change' | 'note' | 'media' | 'participant' | 'assigned' | 'escalated';
  title: string;
  description?: string;
  timestamp: string | Date;
  user?: string;
  metadata?: Record<string, string>;
}

export interface IncidentTimelineProps {
  events: TimelineEvent[];
  maxVisible?: number;
  onEventPress?: (event: TimelineEvent) => void;
}

const EVENT_DOT_COLORS: Record<TimelineEvent['type'], string> = {
  created: '#3B82F6',      // blue - primary
  updated: '#8B5CF6',      // purple - secondary
  status_change: '#10B981', // green - primary
  note: '#6B7280',         // gray - textSecondary
  media: '#0EA5E9',        // cyan - interactive
  participant: '#8B5CF6',  // purple
  assigned: '#F59E0B',     // amber
  escalated: '#EF4444',    // red - error
};

const EVENT_ICONS: Record<TimelineEvent['type'], string> = {
  created: 'plus.circle.fill',
  updated: 'pencil.circle.fill',
  status_change: 'checkmark.circle.fill',
  note: 'note.text',
  media: 'photo.stack',
  participant: 'person.badge.plus',
  assigned: 'person.fill.checkmark',
  escalated: 'exclamationmark.triangle.fill',
};

export function IncidentTimeline({
  events,
  maxVisible = undefined,
  onEventPress,
}: IncidentTimelineProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const [expanded, setExpanded] = useState(false);

  const visibleEvents = expanded || !maxVisible ? events : events.slice(0, maxVisible);
  const hiddenCount = !expanded && maxVisible && events.length > maxVisible ? events.length - maxVisible : 0;

  return (
    <View style={{ paddingVertical: 8 }}>
      {visibleEvents.map((event, index) => {
        const dotColor = EVENT_DOT_COLORS[event.type];
        const iconName = EVENT_ICONS[event.type];
        const isLast = index === visibleEvents.length - 1 && hiddenCount === 0;
        const timeAgo = formatRelativeTimestamp(
          typeof event.timestamp === 'string' ? event.timestamp : event.timestamp.toISOString()
        );

        return (
          <Pressable
            key={event.id}
            onPress={() => {
              triggerSelectionHaptic();
              onEventPress?.(event);
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {/* Timeline line and dot */}
              <View style={{ width: 32, alignItems: 'center', position: 'relative' }}>
                {/* Vertical line (continuous except after last) */}
                {!isLast && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 24,
                      left: '50%',
                      width: 2,
                      height: 500, // Large value to extend beyond visible area
                      backgroundColor: colors.border,
                      marginLeft: -1,
                    }}
                  />
                )}

                {/* Dot with icon */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: dotColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <AppSymbol
                    iosName={iconName as any}
                    fallbackName="alert"
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              {/* Event content */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                {/* Title and time row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.body.fontSize,
                      fontWeight: '600',
                      color: colors.textPrimary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textTertiary,
                      marginLeft: 8,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {timeAgo}
                  </Text>
                </View>

                {/* User info if provided */}
                {event.user && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textTertiary,
                      marginBottom: 4,
                    }}
                  >
                    by {event.user}
                  </Text>
                )}

                {/* Description if provided */}
                {event.description && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      lineHeight: 18,
                      marginBottom: event.metadata ? 6 : 0,
                    }}
                  >
                    {event.description}
                  </Text>
                )}

                {/* Metadata tags if provided */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <View
                        key={key}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: colors.backgroundMuted,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textTertiary,
                            fontWeight: '500',
                          }}
                        >
                          {key}: {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* "Show N more" button */}
      {hiddenCount > 0 && (
        <Pressable
          onPress={() => {
            triggerSelectionHaptic();
            setExpanded(true);
          }}
          style={({ pressed }) => ({
            marginLeft: 32,
            marginTop: 8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.primary,
            }}
          >
            Show {hiddenCount} more {hiddenCount === 1 ? 'event' : 'events'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
