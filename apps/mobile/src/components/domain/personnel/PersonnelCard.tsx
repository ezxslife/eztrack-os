import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { Avatar } from '@/components/ui/Avatar';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerHaptic } from '@/lib/haptics';

export interface PersonnelCardProps {
  id: string;
  name: string;
  role: string;
  status?: 'active' | 'off_duty' | 'on_leave' | 'suspended';
  avatarUrl?: string;
  badgeNumber?: string;
  phone?: string;
  isOnDuty?: boolean;
  onPress?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',       // green
  off_duty: '#6B7280',     // gray
  on_leave: '#F59E0B',     // yellow
  suspended: '#EF4444',    // red
};

export function PersonnelCard({
  id,
  name,
  role,
  status = 'active',
  avatarUrl,
  badgeNumber,
  phone,
  isOnDuty = false,
  onPress,
  onCall,
  onMessage,
}: PersonnelCardProps) {
  const { text, textSecondary, textTertiary } = useThemeColors();

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  const handleCall = () => {
    triggerHaptic('light');
    onCall?.();
  };

  const handleMessage = () => {
    triggerHaptic('light');
    onMessage?.();
  };

  const statusColor = STATUS_COLORS[status];

  return (
    <Pressable
      onPress={handlePress}
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
          {/* Avatar with online indicator */}
          <View style={{ position: 'relative' }}>
            <Avatar name={name} size={40} src={avatarUrl} />
            {isOnDuty && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#10B981',
                  borderWidth: 2,
                  borderColor: 'white',
                }}
              />
            )}
          </View>

          {/* Center: Name, role, badge */}
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: text,
                letterSpacing: 0.3,
              }}
            >
              {name}
            </Text>
            <Text style={{ fontSize: 13, color: textSecondary }}>
              {role}
            </Text>
            {badgeNumber && (
              <Text style={{ fontSize: 11, color: textTertiary, fontFamily: 'Menlo' }}>
                Badge #{badgeNumber}
              </Text>
            )}
          </View>

          {/* Right: Status badge + quick actions */}
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {/* Status badge */}
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: statusColor + '20',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: statusColor + '40',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: statusColor,
                  fontWeight: '500',
                  letterSpacing: 0.2,
                }}
              >
                {status === 'off_duty' ? 'Off' : status === 'on_leave' ? 'Leave' : status === 'suspended' ? 'Suspended' : 'Active'}
              </Text>
            </View>

            {/* Quick action buttons */}
            {(onCall || onMessage) && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {onCall && (
                  <Pressable
                    onPress={handleCall}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      padding: 6,
                    })}
                  >
                    <AppSymbol name="phone" size={16} color={textTertiary} />
                  </Pressable>
                )}
                {onMessage && (
                  <Pressable
                    onPress={handleMessage}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      padding: 6,
                    })}
                  >
                    <AppSymbol name="message" size={16} color={textTertiary} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </MaterialSurface>
    </Pressable>
  );
}
