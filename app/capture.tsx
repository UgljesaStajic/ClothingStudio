import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, useColorScheme, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useClothing } from '@/hooks/useClothing';
import { useAlert } from '@/template';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { PhotoAngle, CapturedPhoto } from '@/types';

const PHOTO_ANGLES: { angle: PhotoAngle; label: string; required: boolean }[] = [
  { angle: 'front', label: 'Front', required: true },
  { angle: 'back', label: 'Back', required: true },
  { angle: 'left_sleeve', label: 'Left Sleeve', required: false },
  { angle: 'right_sleeve', label: 'Right Sleeve', required: false },
  { angle: 'left_side', label: 'Left Side', required: false },
  { angle: 'right_side', label: 'Right Side', required: false },
];

export default function CaptureScreen() {
  const params = useLocalSearchParams<{ itemId: string; gender: string; clothingType: string }>();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [currentAngle, setCurrentAngle] = useState<PhotoAngle>('front');
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? 'light'];
  const { uploadPhoto, generateImages, loading } = useClothing();
  const { showAlert } = useAlert();
  const [permission, requestPermission] = useCameraPermissions();

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert('Error', 'Camera permission is required');
        return;
      }
    }
    setShowCamera(true);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: CapturedPhoto = {
        angle: currentAngle,
        uri: result.assets[0].uri,
      };
      setPhotos([...photos.filter((p) => p.angle !== currentAngle), newPhoto]);
      moveToNextAngle();
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        const newPhoto: CapturedPhoto = {
          angle: currentAngle,
          uri: photo.uri,
        };
        setPhotos([...photos.filter((p) => p.angle !== currentAngle), newPhoto]);
        setShowCamera(false);
        moveToNextAngle();
      }
    } catch (error) {
      showAlert('Error', 'Failed to capture photo');
    }
  };

  const moveToNextAngle = () => {
    const currentIndex = PHOTO_ANGLES.findIndex((a) => a.angle === currentAngle);
    if (currentIndex < PHOTO_ANGLES.length - 1) {
      setCurrentAngle(PHOTO_ANGLES[currentIndex + 1].angle);
    }
  };

  const handleGenerate = async () => {
    const requiredAngles = PHOTO_ANGLES.filter((a) => a.required).map((a) => a.angle);
    const capturedAngles = photos.map((p) => p.angle);
    const missingRequired = requiredAngles.filter((angle) => !capturedAngles.includes(angle));

    if (missingRequired.length > 0) {
      showAlert('Error', 'Please capture all required photos (Front and Back)');
      return;
    }

    for (const photo of photos) {
      await uploadPhoto(photo.uri, params.itemId, photo.angle);
    }

    const result = await generateImages(
      params.itemId,
      photos,
      params.gender as any,
      params.clothingType as any
    );

    if (result.error) {
      showAlert('Error', result.error);
      return;
    }

    router.replace({ pathname: '/results', params: { itemId: params.itemId } });
  };

  const removePhoto = (angle: PhotoAngle) => {
    setPhotos(photos.filter((p) => p.angle !== angle));
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <Pressable onPress={() => setShowCamera(false)} style={styles.cameraButton}>
                <Ionicons name="close" size={32} color={colors.light.white} />
              </Pressable>
              <Text style={styles.cameraTitle}>{PHOTO_ANGLES.find((a) => a.angle === currentAngle)?.label}</Text>
              <Pressable onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} style={styles.cameraButton}>
                <Ionicons name="camera-reverse" size={32} color={colors.light.white} />
              </Pressable>
            </View>
            <View style={styles.cameraFooter}>
              <Pressable onPress={handleCapture} style={styles.captureButton}>
                <View style={styles.captureButtonInner} />
              </Pressable>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Capture Photos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.angleSelector}>
          {PHOTO_ANGLES.map((item) => {
            const captured = photos.find((p) => p.angle === item.angle);
            return (
              <Pressable
                key={item.angle}
                onPress={() => setCurrentAngle(item.angle)}
                style={[
                  styles.angleButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  currentAngle === item.angle && { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
                ]}
              >
                <Text
                  style={[
                    styles.angleLabel,
                    { color: currentAngle === item.angle ? theme.primary : theme.text },
                  ]}
                >
                  {item.label}
                  {item.required && <Text style={{ color: theme.error }}> *</Text>}
                </Text>
                {captured && <Ionicons name="checkmark-circle" size={20} color={theme.success} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.previewSection}>
          {photos.find((p) => p.angle === currentAngle) ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: photos.find((p) => p.angle === currentAngle)?.uri }}
                style={styles.preview}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removePhoto(currentAngle)}
                style={[styles.removeButton, { backgroundColor: theme.error }]}
              >
                <Ionicons name="trash" size={20} color={theme.white} />
              </Pressable>
            </View>
          ) : (
            <View style={[styles.emptyPreview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="camera-outline" size={64} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No photo for {PHOTO_ANGLES.find((a) => a.angle === currentAngle)?.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button title="Take Photo" onPress={handleTakePhoto} fullWidth />
          <Button title="Choose from Gallery" onPress={handlePickImage} variant="outline" fullWidth />
        </View>

        {photos.length > 0 && (
          <View style={styles.thumbnails}>
            {photos.map((photo) => (
              <View key={photo.angle} style={styles.thumbnail}>
                <Image source={{ uri: photo.uri }} style={styles.thumbnailImage} contentFit="cover" />
                <Text style={[styles.thumbnailLabel, { color: theme.textSecondary }]}>
                  {PHOTO_ANGLES.find((a) => a.angle === photo.angle)?.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          title="Generate Professional Photos"
          onPress={handleGenerate}
          loading={loading}
          disabled={photos.length === 0}
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
  angleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  angleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  angleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  previewSection: {
    marginBottom: spacing.lg,
  },
  previewContainer: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  thumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  thumbnail: {
    width: '30%',
  },
  thumbnailImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  thumbnailLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  cameraButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.white,
  },
  cameraFooter: {
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.white,
    borderWidth: 4,
    borderColor: colors.light.black,
  },
});
