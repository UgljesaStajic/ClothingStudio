import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useColorScheme, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useClothing } from '@/hooks/useClothing';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { ClothingItem } from '@/types';

export default function ProjectsScreen() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const { getUserItems, deleteItem } = useClothing();

  const loadItems = async () => {
    const result = await getUserItems();
    if (result.data) {
      setItems(result.data);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDelete = async (itemId: string) => {
    await deleteItem(itemId);
    await loadItems();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.success;
      case 'processing':
        return theme.warning;
      case 'failed':
        return theme.error;
      default:
        return theme.textTertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'processing':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'create';
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Projects</Text>
        <Button title="New Project" onPress={() => router.push('/new-item')} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No projects yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
            Create your first professional product photo
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                if (item.status === 'completed') {
                  router.push({ pathname: '/results', params: { itemId: item.id } });
                } else if (item.status === 'draft') {
                  router.push({
                    pathname: '/capture',
                    params: {
                      itemId: item.id,
                      gender: item.gender,
                      clothingType: item.clothing_type,
                    },
                  });
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.clothing_type.charAt(0).toUpperCase() + item.clothing_type.slice(1)}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    {item.gender === 'male' ? 'Male' : 'Female'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardDate, { color: theme.textTertiary }]}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: typography.fontSize.sm,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});
