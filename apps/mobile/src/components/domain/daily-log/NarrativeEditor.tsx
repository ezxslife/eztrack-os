import React, { useMemo, useCallback } from 'react';
import { View, TextInput, Text } from 'react-native';
import { useThemeColors, useThemeTypography } from '@/theme';
import { MaterialSurface } from '@/components/ui/MaterialSurface';

export interface NarrativeEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
}

export function NarrativeEditor({
  value,
  onChange,
  placeholder = 'Write your narrative here...',
  minHeight = 100,
  maxLength = 5000,
  autoFocus = false,
  editable = true,
}: NarrativeEditorProps) {
  const colors = useThemeColors();
  const typography = useThemeTypography();

  const wordCount = useMemo(() => {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }, [value]);

  const charCount = useMemo(() => {
    return value.length;
  }, [value]);

  const remainingChars = useMemo(() => {
    return maxLength ? maxLength - charCount : 0;
  }, [charCount, maxLength]);

  const isNearLimit = maxLength && remainingChars < 100;
  const isAtLimit = maxLength && remainingChars === 0;

  const handleChange = useCallback(
    (text: string) => {
      if (maxLength && text.length > maxLength) {
        onChange(text.slice(0, maxLength));
        return;
      }
      onChange(text);
    },
    [onChange, maxLength]
  );

  return (
    <View style={{ gap: 8 }}>
      <MaterialSurface variant="grouped">
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <TextInput
            value={value}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            editable={editable}
            multiline
            textAlignVertical="top"
            autoFocus={autoFocus}
            style={{
              minHeight,
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: colors.textPrimary,
              padding: 0,
            }}
          />

          {/* Stats footer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                lineHeight: 14,
                color: colors.textTertiary,
              }}
            >
              {wordCount} word{wordCount !== 1 ? 's' : ''} • {charCount} char{charCount !== 1 ? 's' : ''}
            </Text>

            {maxLength && (
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 14,
                  color:
                    isAtLimit
                      ? colors.error
                      : isNearLimit
                        ? colors.warning
                        : colors.textTertiary,
                  fontWeight: isAtLimit || isNearLimit ? '600' : '400',
                }}
              >
                {remainingChars} remaining
              </Text>
            )}
          </View>
        </View>
      </MaterialSurface>
    </View>
  );
}
