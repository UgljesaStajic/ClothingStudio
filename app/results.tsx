import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, Pressable, Share, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useClothing } from '@/hooks/useClothing';
import { useAlert } from '@/template';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { GeneratedImage } from '@/types';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ itemId: string }>();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const { getGeneratedImages } = useClothing();
  const { showAlert } = useAlert();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const result = await getGeneratedImages(params.itemId);
    if (result.data) {
      setImages(result.data);
      if (result.data.length > 0) {
        setSelectedImage(result.data[0]);
      }
    }
  };

  const handleDownload = async () => {
    if (!selectedImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Error', 'Media library permission is required');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `mannequin_${Date.now()}.jpg`;
      await FileSystem.downloadAsync(selectedImage.image_url, fileUri);
      await MediaLibrary.saveToLibraryAsync(fileUri);
      showAlert('Success', 'Image saved to gallery');
    } catch (error) {
      showAlert('Error', 'Failed to save image');
    }
  };

  const handleShare = async () => {
    if (!selectedImage) return;

    try {
      if (Platform.OS === 'web') {
        await Share.share({
          url: selectedImage.image_url,
        });
      } else {
        const fileUri = FileSystem.cacheDirectory + `share_${Date.now()}.jpg`;
        await FileSystem.downloadAsync(selectedImage.image_url, fileUri);
        await Share.share({
          url: fileUri,
        });
      }
    } catch (error) {
      showAlert('Error', 'Failed to share image');
    }
  };

  if (images.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No generated images yet</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Generated Photos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedImage && (
          <View style={styles.mainImageContainer}>
            <Image source={{ uri: selectedImage.image_url }} style={styles.mainImage} contentFit="contain" />
            <View style={styles.imageActions}>
              <Pressable
                onPress={handleDownload}
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="download" size={24} color={theme.white} />
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="share-social" size={24} color={theme.white} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.thumbnailsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>All Views</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails}>
            {images.map((image) => (
              <Pressable
                key={image.id}
                onPress={() => setSelectedImage(image)}
                style={[
                  styles.thumbnail,
                  { borderColor: theme.border },
                  selectedImage?.id === image.id && { borderColor: theme.primary, borderWidth: 3 },
                ]}
              >
                <Image source={{ uri: image.image_url }} style={styles.thumbnailImage} contentFit="cover" />
                <Text style={[styles.thumbnailLabel, { color: theme.textSecondary }]}>
                  {image.angle.replace('_', ' ').toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button title="Create New Project" onPress={() => router.push('/new-item')} fullWidth />
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
  },
  mainImageContainer: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  mainImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.md,
  },
  imageActions: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.lg + spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  thumbnails: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 120,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  thumbnailLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    padding: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
  },
});
