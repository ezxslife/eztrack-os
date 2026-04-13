import React from 'react';
import { Pressable, View, Text, Linking, Alert } from 'react-native';
import { useThemeColors, useThemeTypography } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { Avatar } from '@/components/ui/Avatar';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerSelectionHaptic } from '@/lib/haptics';

export interface ParticipantRowProps {
  name: string;
  role: 'witness' | 'suspect' | 'victim' | 'reporting_party' | 'involved' | 'other';
  phone?: string;
  email?: string;
  notes?: string;
  avatarUrl?: string;
  onPress?: () => void;
  onCall?: () => void;
}

const ROLE_LABELS: Record<ParticipantRowProps['role'], string> = {
  witness: 'Witness',
  suspect: 'Suspect',
  victim: 'Victim',
  reporting_party: 'Reporter',
  involved: 'Involved',
  other: 'Other',
};

const ROLE_COLORS: Record<ParticipantRowProps['role'], { bg: string; text: string }> = {
  witness: { bg: '#DBEAFE', text: '#1E40AF' },      // light blue
  suspect: { bg: '#FEE2E2', text: '#7F1D1D' },      // light red
  victim: { bg: '#FED7AA', text: '#92400E' },       // light orange
  reporting_party: { bg: '#D1FAE5', text: '#065F46' }, // light green
  involved: { bg: '#E9D5FF', text: '#581C87' },     // light purple
  other: { bg: '#F3F4F6', text: '#374151' },        // light gray
};

export function ParticipantRow({
  name,
  role,
  phone,
  email,
  notes,
  avatarUrl,
  onPress,
  onCall,
}: ParticipantRowProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const roleConfig = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];

  const handleCall = () => {
    if (!phone) return;

    triggerSelectionHaptic();

    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
          onCall?.();
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open phone dialer');
      });
  };

  return (
    <Pressable
      onPress={() => {
        triggerSelectionHaptic();
        onPress?.();
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialSurface variant="chrome" style={{ overflow: 'hidden' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: 12,
            gap: 12,
          }}
        >
          {/* Avatar */}
          <Avatar
            name={name}
            imageUrl={avatarUrl}
            size="sm"
          />

          {/* Content */}
          <View style={{ flex: 1 }}>
            {/* Name and role row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
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
                {name}
              </Text>

              {/* Role chip */}
              <View
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: roleConfig.bg,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: roleConfig.text,
                  }}
                >
                  {roleLabel}
                </Text>
              </View>
            </View>

            {/* Contact info */}
            <View style={{ gap: 4, marginBottom: notes ? 6 : 0 }}>
              {phone && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textTertiary,
                  }}
                  numberOfLines={1}
                >
                  {phone}
                </Text>
              )}

              {email && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textTertiary,
                  }}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              )}
            </View>

            {/* Notes */}
            {notes && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 16,
                  fontStyle: 'italic',
                }}
              >
                {notes}
              </Text>
            )}
          </View>

          {/* Call button */}
          {phone && (
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <AppSymbol
                iosName="phone.fill"
                fallbackName="call"
                size={18}
                color="#FFFFFF"
              />
            </Pressable>
          )}
        </View>
      </MaterialSurface>
    </Pressable>
  );
}
