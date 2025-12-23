import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useAuth, useAlert } from '@/template';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      showAlert('Error', error);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Ionicons name="person" size={48} color={theme.white} />
          </View>
          <Text style={[styles.email, { color: theme.text }]}>{user?.email}</Text>
          {user?.username && (
            <Text style={[styles.username, { color: theme.textSecondary }]}>@{user.username}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Account Type</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>Professional</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Member Since</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Logout" onPress={handleLogout} variant="outline" fullWidth />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  email: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  username: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  actions: {
    marginTop: 'auto',
  },
});
