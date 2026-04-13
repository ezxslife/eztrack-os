import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { GlassAlert } from "@/components/ui/glass/GlassAlert";
import { supabase } from "@/lib/supabase";
import { triggerImpactHaptic, triggerNotificationHaptic } from "@/lib/haptics";
import * as Haptics from "expo-haptics";
import {
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
} from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const layout = useAdaptiveLayout();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: spacing[4],
      justifyContent: "space-between",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      gap: spacing[4],
    },
    fieldContainer: {
      gap: spacing[3],
    },
    successContainer: {
      gap: spacing[4],
      alignItems: "center",
    },
    successText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });

  const validateForm = (): boolean => {
    let isValid = true;
    setNewPasswordError(null);
    setConfirmPasswordError(null);

    if (!newPassword.trim()) {
      setNewPasswordError("Password is required");
      isValid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters");
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) {
      triggerNotificationHaptic("warning");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      triggerNotificationHaptic("success");
      setSuccess(true);
    } catch (err) {
      triggerNotificationHaptic("error");
      const message = err instanceof Error ? err.message : "Failed to update password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace("/(auth)/login");
  };

  if (success) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Password Updated",
          }}
        />
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <GlassAlert
              tone="success"
              title="Password Updated"
              message="Your password has been successfully updated. You can now sign in with your new password."
            />
          </View>
        </View>
        <Button
          label="Back to Login"
          onPress={handleBackToLogin}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "New Password",
        }}
      />
      <View style={styles.content}>
        {error && (
          <GlassAlert
            tone="error"
            title="Error"
            message={error}
          />
        )}
        <View style={styles.fieldContainer}>
          <TextField
            label="New Password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!loading}
            error={newPasswordError}
          />
          <TextField
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
            error={confirmPasswordError}
          />
        </View>
      </View>
      <Button
        label="Update Password"
        onPress={handleUpdatePassword}
        loading={loading}
      />
    </SafeAreaView>
  );
}
