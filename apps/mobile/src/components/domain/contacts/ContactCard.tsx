import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { AppSymbol } from "@/components/ui/AppSymbol";
import { Avatar } from "@/components/ui/Avatar";
import { MaterialSurface } from "@/components/ui/MaterialSurface";
import { triggerSelectionHaptic } from "@/lib/haptics";
import { useThemeColors, useThemeSpacing, useThemeTypography } from "@/theme";

export interface ContactCardProps {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  phone?: string;
  email?: string;
  onPress?: () => void;
  onCall?: () => void;
}

export function ContactCard({
  id,
  name,
  organization,
  role,
  phone,
  email,
  onPress,
  onCall,
}: ContactCardProps) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const handlePress = () => {
    if (!onPress) return;
    triggerSelectionHaptic();
    onPress();
  };

  const handleCall = () => {
    if (!onCall || !phone) return;
    triggerSelectionHaptic();
    onCall();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    content: {
      flex: 1,
      gap: spacing[0.5],
    },
    name: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    organization: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    role: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    contactInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      marginTop: spacing[1],
    },
    contactText: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    callButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.backgroundMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    pressable: {
      opacity: 0.7,
    },
  });

  const content = (
    <View style={styles.container}>
      <Avatar name={name} size="md" />

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {organization && <Text style={styles.organization}>{organization}</Text>}
        {role && <Text style={styles.role}>{role}</Text>}

        {(phone || email) && (
          <View style={styles.contactInfo}>
            {phone && (
              <>
                <AppSymbol
                  iosName="phone.fill"
                  fallbackName="call"
                  size={12}
                  color={colors.textTertiary}
                />
                <Text style={styles.contactText}>{phone}</Text>
              </>
            )}
            {email && phone && <Text style={styles.contactText}>•</Text>}
            {email && (
              <Text style={styles.contactText} numberOfLines={1}>
                {email}
              </Text>
            )}
          </View>
        )}
      </View>

      {onCall && phone && (
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => (pressed ? styles.pressable : {})}
        >
          <View style={styles.callButton}>
            <AppSymbol
              iosName="phone.fill"
              fallbackName="call"
              size={18}
              color={colors.brandText}
            />
          </View>
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => (pressed ? styles.pressable : {})}
      >
        <MaterialSurface variant="grouped" padding={spacing[3]}>
          {content}
        </MaterialSurface>
      </Pressable>
    );
  }

  return (
    <MaterialSurface variant="grouped" padding={spacing[3]}>
      {content}
    </MaterialSurface>
  );
}
