import { type Href, useRouter, Stack } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View, ScrollView } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeColors, useThemeTypography } from "@/theme";
import { useAdaptiveLayout } from "@/theme/layout";

export default function ProfileScreen() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const styles = createStyles(colors, typography, layout);

  // TODO: Replace with real profile update hook
  // const updateProfileMutation = useUpdateProfile();

  const profile = useAuthStore((state) => state.profile);

  const fullName = profile?.full_name ?? "";
  const initialParts = fullName.split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(initialParts[0] ?? "");
  const [lastName, setLastName] = useState(initialParts.slice(1).join(" ") ?? "");
  const [email] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "First name is required");
      return;
    }
    if (!lastName.trim()) {
      Alert.alert("Required", "Last name is required");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Call updateProfileMutation
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/(auth)/reset-password" as Href);
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <>
      <Stack.Screen options={{ title: "Profile" }} />
      <ScreenContainer title="Profile">

        <ScrollView style={styles.scrollView}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Avatar
                size="xl"
                initials={initials || "U"}
                name={`${firstName} ${lastName}`.trim()}
              />
            </View>
            <Button
              label="Change Photo"
              variant="secondary"
              onPress={() => {
                // TODO: Implement photo picker
                Alert.alert("Coming Soon", "Photo upload feature coming soon");
              }}
            />
          </View>

          {/* Profile Information Form */}
          <View style={styles.formSection}>
            <SectionHeader title="Personal Information" />

            <View style={styles.formGroup}>
              <TextField
                label="First Name"
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
              />

              <TextField
                label="Last Name"
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
              />

              <TextField
                label="Email"
                placeholder="Email address"
                value={email}
                editable={false}
                pointerEvents="none"
              />

              <TextField
                label="Phone"
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
              />

              <TextField
                label="Badge Number"
                placeholder="Badge ID"
                value={badgeNumber}
                onChangeText={setBadgeNumber}
              />
            </View>

            <Button
              label="Save Changes"
              onPress={handleSaveChanges}
              loading={isSaving}
            />
          </View>

          {/* Security Section */}
          <View style={styles.securitySection}>
            <SectionHeader title="Security" />

            <MaterialSurface
              style={styles.securityCard}
              onPress={handleChangePassword}
            >
              <View style={styles.securityCardContent}>
                <Text style={styles.securityCardLabel}>Change Password</Text>
                <Text style={styles.securityCardSubtext}>
                  Update your account password
                </Text>
              </View>
              <Text style={styles.securityCardArrow}>›</Text>
            </MaterialSurface>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useThemeTypography>,
  layout: ReturnType<typeof useAdaptiveLayout>
) {
  return StyleSheet.create({
    avatarContainer: {
      alignItems: "center",
      marginVertical: 16,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    formGroup: {
      gap: 16,
      marginBottom: 24,
    },
    formSection: {
      gap: 16,
      marginHorizontal: layout.horizontalPadding,
      marginBottom: 32,
    },
    scrollView: {
      flex: 1,
    },
    securityCard: {
      alignItems: "center",
      flexDirection: "row",
      marginHorizontal: layout.horizontalPadding,
      paddingHorizontal: layout.cardPadding,
      paddingVertical: 16,
    },
    securityCardArrow: {
      ...typography.title3,
      color: colors.textTertiary,
    },
    securityCardContent: {
      flex: 1,
      gap: 4,
    },
    securityCardLabel: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    securityCardSubtext: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    securitySection: {
      gap: 12,
      marginHorizontal: layout.horizontalPadding,
      marginBottom: 32,
    },
    spacer: {
      height: 32,
    },
  });
}
