import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useClothing } from '@/hooks/useClothing';
import { useAlert } from '@/template';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { Gender, ClothingType } from '@/types';

const GENDERS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: 'man' },
  { value: 'female', label: 'Female', icon: 'woman' },
];

const CLOTHING_TYPES: { value: ClothingType; label: string; icon: string }[] = [
  { value: 'tshirt', label: 'T-Shirt', icon: 'shirt-outline' },
  { value: 'shirt', label: 'Shirt', icon: 'shirt-outline' },
  { value: 'pants', label: 'Pants', icon: 'fitness-outline' },
  { value: 'dress', label: 'Dress', icon: 'woman-outline' },
  { value: 'jacket', label: 'Jacket', icon: 'cloudy-outline' },
  { value: 'hoodie', label: 'Hoodie', icon: 'cloudy-outline' },
  { value: 'shorts', label: 'Shorts', icon: 'fitness-outline' },
  { value: 'skirt', label: 'Skirt', icon: 'woman-outline' },
];

export default function NewItemScreen() {
  const [gender, setGender] = useState<Gender | null>(null);
  const [clothingType, setClothingType] = useState<ClothingType | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const { createItem, loading } = useClothing();
  const { showAlert } = useAlert();

  const handleCreate = async () => {
    if (!gender || !clothingType) {
      showAlert('Error', 'Please select gender and clothing type');
      return;
    }

    const result = await createItem(gender, clothingType);
    if (result.error || !result.data) {
      showAlert('Error', result.error || 'Failed to create project');
      return;
    }

    router.push({
      pathname: '/capture',
      params: {
        itemId: result.data.id,
        gender,
        clothingType,
      },
    });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>New Project</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Gender</Text>
          <View style={styles.optionGrid}>
            {GENDERS.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setGender(item.value)}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  gender === item.value && { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={32}
                  color={gender === item.value ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    { color: gender === item.value ? theme.primary : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Clothing Type</Text>
          <View style={styles.optionGrid}>
            {CLOTHING_TYPES.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setClothingType(item.value)}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  clothingType === item.value && { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={32}
                  color={clothingType === item.value ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    { color: clothingType === item.value ? theme.primary : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          title="Continue to Camera"
          onPress={handleCreate}
          loading={loading}
          disabled={!gender || !clothingType}
          fullWidth
        />
      </View>
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
  backButton: {
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  optionCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
