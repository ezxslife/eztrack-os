import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerSelectionHaptic } from '@/lib/haptics';

export interface Certification {
  id: string;
  name: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'pending';
  expiryDate?: string;
  issuedDate?: string;
}

export interface CertificationBadgesProps {
  certifications: Certification[];
  compact?: boolean;
  onCertPress?: (cert: Certification) => void;
}

function getStatusConfig(status: Certification['status']): {
  color: string;
  backgroundColor: string;
  iosIcon: string;
  fallbackIcon: string;
  label: string;
} {
  switch (status) {
    case 'valid':
      return {
        color: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        iosIcon: 'checkmark.shield.fill',
        fallbackIcon: 'checkmark-circle',
        label: 'Valid',
      };
    case 'expiring_soon':
      return {
        color: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        iosIcon: 'exclamationmark.triangle.fill',
        fallbackIcon: 'warning',
        label: 'Expiring Soon',
      };
    case 'expired':
      return {
        color: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        iosIcon: 'xmark.circle.fill',
        fallbackIcon: 'close-circle',
        label: 'Expired',
      };
    case 'pending':
      return {
        color: '#9CA3AF',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        iosIcon: 'clock.fill',
        fallbackIcon: 'time',
        label: 'Pending',
      };
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function CompactBadge({ cert, onPress }: { cert: Certification; onPress?: (cert: Certification) => void }) {
  const { textTertiary } = useThemeColors();
  const statusConfig = getStatusConfig(cert.status);

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onPress?.(cert);
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: statusConfig.backgroundColor,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: statusConfig.color + '30',
        }}
      >
        <AppSymbol iosName={statusConfig.iosIcon as any} fallbackName={statusConfig.fallbackIcon as any} size={12} color={statusConfig.color} />
        <Text
          style={{
            fontSize: 11,
            color: statusConfig.color,
            fontWeight: '500',
            letterSpacing: 0.2,
          }}
          numberOfLines={1}
        >
          {cert.name}
        </Text>
      </View>
    </Pressable>
  );
}

function FullBadge({ cert, onPress }: { cert: Certification; onPress?: (cert: Certification) => void }) {
  const { textPrimary, textSecondary, textTertiary } = useThemeColors();
  const statusConfig = getStatusConfig(cert.status);

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onPress?.(cert);
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialSurface variant="grouped">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          {/* Status icon */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: statusConfig.backgroundColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AppSymbol iosName={statusConfig.iosIcon as any} fallbackName={statusConfig.fallbackIcon as any} size={18} color={statusConfig.color} />
          </View>

          {/* Certificate info */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: textPrimary,
                letterSpacing: 0.3,
              }}
            >
              {cert.name}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {cert.issuedDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppSymbol iosName="calendar" fallbackName="calendar" size={12} color={textTertiary} />
                  <Text style={{ fontSize: 11, color: textSecondary }}>
                    Issued {formatDate(cert.issuedDate)}
                  </Text>
                </View>
              )}

              {cert.expiryDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppSymbol iosName="calendar" fallbackName="calendar" size={12} color={textTertiary} />
                  <Text style={{ fontSize: 11, color: textSecondary }}>
                    Expires {formatDate(cert.expiryDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status badge */}
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: statusConfig.backgroundColor,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: statusConfig.color + '30',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: statusConfig.color,
                fontWeight: '600',
                letterSpacing: 0.2,
              }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}

export function CertificationBadges({
  certifications,
  compact = false,
  onCertPress,
}: CertificationBadgesProps) {
  const { textSecondary, surface } = useThemeColors();

  // Sort certifications by status priority: expired first, then expiring_soon, then valid, then pending
  const sortedCerts = useMemo(() => {
    const statusPriority = { expired: 0, expiring_soon: 1, valid: 2, pending: 3 };
    return [...certifications].sort(
      (a, b) => statusPriority[a.status] - statusPriority[b.status]
    );
  }, [certifications]);

  if (compact) {
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
        >
          {sortedCerts.length > 0 ? (
            sortedCerts.map((cert) => (
              <CompactBadge
                key={cert.id}
                cert={cert}
                onPress={onCertPress}
              />
            ))
          ) : (
            <Text style={{ fontSize: 12, color: textSecondary, fontStyle: 'italic' }}>
              No certifications
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <FlatList
      data={sortedCerts}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      }}
      renderItem={({ item }) => (
        <FullBadge cert={item} onPress={onCertPress} />
      )}
      ListEmptyComponent={
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: textSecondary, fontStyle: 'italic' }}>
            No certifications
          </Text>
        </View>
      }
    />
  );
}
