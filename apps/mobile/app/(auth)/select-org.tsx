import { useState, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, FlatList, TouchableOpacity, TextInput } from 'react-native';

import { useThemeColors, useThemeSpacing, useThemeTypography } from '@/theme';
import { useAdaptiveLayout } from '@/theme/layout';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenTitleStrip } from '@/components/ui/glass/ScreenTitleStrip';
import { MaterialSurface } from '@/components/ui/MaterialSurface';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { useAuthStore } from '@/stores/auth-store';
import { triggerHaptic } from '@/lib/haptics';

interface OrgItem {
  id: string;
  name: string;
  role: string;
  memberCount?: number;
  logoUrl?: string;
}

// TODO: Replace with real data hook once org query is connected
const MOCK_ORGS: OrgItem[] = [
  {
    id: 'org-1',
    name: 'Downtown Fire Station',
    role: 'Staff',
    memberCount: 24,
  },
  {
    id: 'org-2',
    name: 'Riverside Medical Dispatch',
    role: 'Lead',
    memberCount: 18,
  },
  {
    id: 'org-3',
    name: 'Central Operations Center',
    role: 'Manager',
    memberCount: 42,
  },
];

export default function SelectOrgScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const layout = useAdaptiveLayout();
  const setActive = useAuthStore((state) => state.setActive);
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) {
      return MOCK_ORGS;
    }
    return MOCK_ORGS.filter(
      (org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectOrg = (org: OrgItem) => {
    triggerHaptic('selection');
    setActive({ profile, session, user });
    router.replace('/dashboard');
  };

  const handleLogout = async () => {
    triggerHaptic('selection');
    // TODO: Call auth logout when implemented
    router.replace('/(auth)/login');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScreenContainer>
        <View style={{ flex: 1 }}>
          {/* Title */}
          <View style={{ paddingHorizontal: layout.horizontalPadding, paddingTop: spacing.lg }}>
            <ScreenTitleStrip title="Select Organization" />
          </View>

          {/* Search Field */}
          <View style={{ paddingHorizontal: layout.horizontalPadding, marginTop: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 8,
                paddingHorizontal: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppSymbol name="magnifyingglass" size={16} color={colors.textTertiary} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  marginLeft: spacing.sm,
                  color: colors.foreground,
                  fontSize: typography.body.fontSize,
                }}
                placeholder="Search organizations..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Organization List */}
          <FlatList
            data={filteredOrgs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: layout.horizontalPadding,
              paddingVertical: spacing.lg,
              gap: spacing.md,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectOrg(item)} activeOpacity={0.7}>
                <MaterialSurface variant="grouped">
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="body-strong" style={{ marginBottom: spacing.xs }}>
                        {item.name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Text variant="caption" style={{ color: colors.textTertiary }}>
                          {item.role}
                        </Text>
                        {item.memberCount ? (
                          <>
                            <Text variant="caption" style={{ color: colors.textTertiary }}>
                              •
                            </Text>
                            <Text variant="caption" style={{ color: colors.textTertiary }}>
                              {item.memberCount} members
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <AppSymbol
                      name="chevron.right"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </View>
                </MaterialSurface>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={{ paddingTop: spacing.xl }}>
                  <Text
                    variant="body"
                    style={{
                      color: colors.textTertiary,
                      textAlign: 'center',
                    }}
                  >
                    No organizations found
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Logout Button */}
          <View style={{ paddingHorizontal: layout.horizontalPadding, paddingBottom: spacing.lg }}>
            <Button
              label="Log Out"
              onPress={handleLogout}
              variant="plain"
            />
          </View>
        </View>
      </ScreenContainer>
    </>
  );
}
