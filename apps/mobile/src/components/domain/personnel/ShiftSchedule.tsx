import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { useThemeColors } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { triggerSelectionHaptic } from '@/lib/haptics';

export interface ShiftEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftName: string;
  role?: string;
  location?: string;
}

export interface ShiftScheduleProps {
  shifts: ShiftEntry[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  onShiftPress?: (shift: ShiftEntry) => void;
}

function getWeekDates(fromDate: Date): Array<{ date: Date; formatted: string }> {
  const dates = [];
  const startDate = new Date(fromDate);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const formatted = date.toISOString().split('T')[0];
    dates.push({ date, formatted });
  }

  return dates;
}

function formatTimeRange(start: string, end: string): string {
  const formatTime = (time: string) => {
    // Handle both HH:MM and HH:MM:SS formats
    const [hours, minutes] = time.split(':').slice(0, 2);
    const hour = parseInt(hours, 10);
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${meridiem}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}

export function ShiftSchedule({
  shifts,
  selectedDate,
  onDateSelect,
  onShiftPress,
}: ShiftScheduleProps) {
  const { textPrimary, textSecondary, textTertiary, primary, border, surface } = useThemeColors();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];

  const [currentDate, setCurrentDate] = useState(selectedDate || todayString);
  const [weekStartDate, setWeekStartDate] = useState(
    new Date(today.getTime() - today.getDay() * 86400000) // Start from Sunday
  );

  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);

  const shiftsForSelectedDate = useMemo(
    () =>
      shifts.filter((shift) => shift.date === currentDate).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [shifts, currentDate]
  );

  const handleDateSelect = (dateStr: string) => {
    triggerSelectionHaptic();
    setCurrentDate(dateStr);
    onDateSelect?.(dateStr);
  };

  const handlePrevWeek = () => {
    triggerSelectionHaptic();
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStartDate(newDate);
    // Adjust current date if it falls outside the new week
    if (currentDate < newDate.toISOString().split('T')[0]) {
      const firstDateOfWeek = newDate.toISOString().split('T')[0];
      setCurrentDate(firstDateOfWeek);
      onDateSelect?.(firstDateOfWeek);
    }
  };

  const handleNextWeek = () => {
    triggerSelectionHaptic();
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStartDate(newDate);
    // Adjust current date if it falls outside the new week
    if (currentDate > weekDates[6].formatted) {
      const firstDateOfWeek = newDate.toISOString().split('T')[0];
      setCurrentDate(firstDateOfWeek);
      onDateSelect?.(firstDateOfWeek);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: surface }}>
      {/* Week strip with day selector */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 12, backgroundColor: surface, borderBottomWidth: 1, borderBottomColor: border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable
            onPress={handlePrevWeek}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 8,
              borderRadius: 6,
              backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
            })}
          >
            <AppSymbol iosName="chevron.left" fallbackName="chevron-back" size={16} color={textSecondary} />
          </Pressable>

          <Text style={{ fontSize: 13, color: textSecondary, fontWeight: '500', flex: 1, textAlign: 'center' }}>
            {weekDates[0].date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>

          <Pressable
            onPress={handleNextWeek}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 8,
              borderRadius: 6,
              backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
            })}
          >
            <AppSymbol iosName="chevron.right" fallbackName="chevron-forward" size={16} color={textSecondary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {weekDates.map(({ date, formatted }) => {
              const isSelected = formatted === currentDate;
              const isToday = formatted === todayString;
              const shiftCount = shifts.filter((s) => s.date === formatted).length;

              return (
                <Pressable
                  key={formatted}
                  onPress={() => handleDateSelect(formatted)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isSelected ? primary : 'transparent',
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: isToday && !isSelected ? primary : 'transparent',
                      minWidth: 56,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: isSelected ? '#FFFFFF' : textSecondary,
                        fontWeight: '500',
                      }}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: isSelected ? '#FFFFFF' : textPrimary,
                        fontWeight: '600',
                        marginTop: 2,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                    {shiftCount > 0 && (
                      <View
                        style={{
                          marginTop: 4,
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: isSelected ? '#FFFFFF' : textTertiary,
                            fontWeight: '600',
                          }}
                        >
                          {shiftCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Shifts for selected date */}
      <FlatList
        data={shiftsForSelectedDate}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              triggerSelectionHaptic();
              onShiftPress?.(item);
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialSurface variant="grouped">
              <View style={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}>
                {/* Time and shift name */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textPrimary, letterSpacing: 0.3 }}>
                      {item.shiftName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppSymbol iosName="clock" fallbackName="time" size={12} color={textTertiary} />
                      <Text style={{ fontSize: 13, color: textSecondary }}>
                        {formatTimeRange(item.startTime, item.endTime)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Role and location if present */}
                {(item.role || item.location) && (
                  <View style={{ gap: 6 }}>
                    {item.role && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: 6,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#3B82F6',
                            fontWeight: '500',
                          }}
                        >
                          {item.role}
                        </Text>
                      </View>
                    )}

                    {item.location && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <AppSymbol iosName="location.fill" fallbackName="location" size={12} color={textTertiary} />
                        <Text style={{ fontSize: 12, color: textSecondary }} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </MaterialSurface>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 }}>
            <AppSymbol iosName="calendar" fallbackName="calendar" size={32} color={textTertiary} />
            <Text style={{ fontSize: 13, color: textSecondary, fontWeight: '500' }}>
              No shifts scheduled
            </Text>
            <Text style={{ fontSize: 12, color: textTertiary }}>
              for {formatDayLabel(new Date(currentDate))}
            </Text>
          </View>
        }
      />
    </View>
  );
}
