import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Avatar } from '@/components/ui/Avatar';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerHaptic } from '@/lib/haptics';

export interface CaseCardProps {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  openedAt: string | Date;
  taskCount?: number;
  completedTaskCount?: number;
  evidenceCount?: number;
  onPress?: () => void;
}

export function CaseCard({
  id,
  caseNumber,
  title,
  status,
  priority,
  assignedTo,
  openedAt,
  taskCount = 0,
  completedTaskCount = 0,
  evidenceCount = 0,
  onPress,
}: CaseCardProps) {
  const { text, textSecondary, textTertiary, surfaceGrouped } = useThemeColors();

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  const taskProgress = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <MaterialSurface variant="grouped">
        <View style={{ paddingHorizontal: 12, paddingVertical: 12, gap: 10 }}>
          {/* Top row: Case number, title */}
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 12,
                color: textTertiary,
                fontFamily: 'Menlo',
                fontWeight: '500',
                letterSpacing: 0.3,
              }}
            >
              {caseNumber}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: text,
                letterSpacing: 0.3,
              }}
            >
              {title}
            </Text>
          </View>

          {/* Status, Priority, Assigned */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <StatusBadge status={status} size="sm" />
            {priority && <PriorityBadge priority={priority} size="sm" />}
            {assignedTo && <Avatar name={assignedTo} size={24} src="" />}
          </View>

          {/* Task progress bar */}
          {taskCount > 0 && (
            <View style={{ gap: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: textTertiary }}>
                  Tasks
                </Text>
                <Text style={{ fontSize: 12, color: textTertiary, fontWeight: '500' }}>
                  {completedTaskCount}/{taskCount}
                </Text>
              </View>
              <View
                style={{
                  height: 4,
                  backgroundColor: 'rgba(107, 114, 128, 0.2)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${taskProgress}%`,
                    backgroundColor: '#10B981',
                  }}
                />
              </View>
            </View>
          )}

          {/* Evidence count */}
          {evidenceCount > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingTop: 4,
              }}
            >
              <AppSymbol name="photo.stack" size={14} color={textTertiary} />
              <Text style={{ fontSize: 12, color: textTertiary }}>
                {evidenceCount} item{evidenceCount !== 1 ? 's' : ''} of evidence
              </Text>
            </View>
          )}
        </View>
      </MaterialSurface>
    </Pressable>
  );
}
