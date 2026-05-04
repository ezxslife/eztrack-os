import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import { BRAND } from '@eztrack/ui';
import { useThemeColors } from '@/theme';

const OTP_LENGTH = 6;
const ERROR_COLOR = '#EF4444';

interface OTPInputProps {
  onComplete: (code: string) => void;
  isVerifying: boolean;
  error: string;
  /** Increment to clear the OTP fields (e.g. after a resend). */
  resetKey?: number;
}

/**
 * Reusable 6-digit OTP input. Auto-advances cells, supports paste, auto-submits
 * when the 6th digit is entered, and shakes on error.
 *
 * Ported from ezxs-os/apps/mobile/src/components/auth/OTPInput.tsx with eztrack-os
 * theme conventions (BRAND from @eztrack/ui, useThemeColors from @/theme).
 */
export function OTPInput({ onComplete, isVerifying, error, resetKey }: OTPInputProps) {
  const colors = useThemeColors();
  const activeCellBorder = BRAND.primaryDark;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  useEffect(() => {
    if (error) {
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(''));
      setActiveIndex(0);
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [error, triggerShake]);

  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (resetKey !== undefined && resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey;
      setOtp(Array(OTP_LENGTH).fill(''));
      setActiveIndex(0);
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [resetKey]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleDigitChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const newOtp = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < digits.length; i++) newOtp[i] = digits[i];
      setOtp(newOtp);
      if (digits.length === OTP_LENGTH) {
        setActiveIndex(OTP_LENGTH - 1);
        onComplete(digits);
      } else {
        const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
        setActiveIndex(nextIndex);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const digit = text.replace(/\D/g, '');
    if (digit.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    } else if (digit && index === OTP_LENGTH - 1) {
      setActiveIndex(index);
      const fullCode = newOtp.join('');
      if (fullCode.length === OTP_LENGTH) onComplete(fullCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;
    if (otp[index] === '' && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  return (
    <View>
      <Animated.View
        style={[styles.otpContainer, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpCell,
              {
                borderColor: error
                  ? ERROR_COLOR
                  : activeIndex === index
                    ? activeCellBorder
                    : otp[index]
                      ? colors.textPrimary
                      : colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            value={otp[index]}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
            onFocus={() => setActiveIndex(index)}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={index === 0 ? OTP_LENGTH : 1}
            selectTextOnFocus
            editable={!isVerifying}
            accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </Animated.View>

      {isVerifying && (
        <View style={styles.verifyingRow}>
          <ActivityIndicator size="small" color={BRAND.primary} />
          <Text style={[styles.verifyingText, { color: colors.textSecondary }]}>
            Verifying...
          </Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface ResendTimerProps {
  timer: number;
  isResending: boolean;
  onResend: () => void;
}

export function ResendTimer({ timer, isResending, onResend }: ResendTimerProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.resendContainer}>
      <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>
        Didn&apos;t receive a code?
      </Text>
      {timer > 0 ? (
        <Text style={[styles.resendTimer, { color: colors.textTertiary }]}>
          Resend in {timer}s
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend verification code"
          onPress={onResend}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator size="small" color={BRAND.primary} />
          ) : (
            <Text style={[styles.resendLink, { color: colors.primaryText }]}>
              Resend Code
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  verifyingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifyingText: { fontSize: 15 },
  errorText: {
    color: ERROR_COLOR,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  resendLabel: { fontSize: 15 },
  resendTimer: { fontSize: 15, fontWeight: '500' },
  resendLink: { fontSize: 15, fontWeight: '600' },
});
