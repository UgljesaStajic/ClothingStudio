import { useState } from 'react';
import { clothingService } from '@/services/clothingService';
import { aiService } from '@/services/aiService';
import type { ClothingItem, ClothingPhoto, GeneratedImage, Gender, ClothingType, PhotoAngle, CapturedPhoto } from '@/types';

export function useClothing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (gender: Gender, clothingType: ClothingType) => {
    setLoading(true);
    setError(null);
    const result = await clothingService.createClothingItem(gender, clothingType);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
    return result;
  };

  const uploadPhoto = async (uri: string, clothingItemId: string, angle: PhotoAngle) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const result = await clothingService.uploadPhoto(blob, clothingItemId, angle);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setLoading(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  };

  const generateImages = async (
    clothingItemId: string,
    photos: CapturedPhoto[],
    gender: Gender,
    clothingType: ClothingType
  ) => {
    setLoading(true);
    setError(null);

    await clothingService.updateItemStatus(clothingItemId, 'processing');

    const results: GeneratedImage[] = [];

    for (const photo of photos) {
      const photoResult = await clothingService.getClothingPhotos(clothingItemId);
      if (photoResult.error || !photoResult.data) {
        continue;
      }

      const uploadedPhoto = photoResult.data.find((p) => p.angle === photo.angle);
      if (!uploadedPhoto) {
        continue;
      }

      const aiResult = await aiService.generateMannequinImage(
        uploadedPhoto.photo_url,
        gender,
        clothingType,
        photo.angle
      );

      if (aiResult.error || !aiResult.data) {
        console.error(`Failed to generate image for ${photo.angle}:`, aiResult.error);
        continue;
      }

      const saveResult = await clothingService.saveGeneratedImage(
        clothingItemId,
        aiResult.data,
        photo.angle
      );

      if (saveResult.error || !saveResult.data) {
        console.error(`Failed to save generated image for ${photo.angle}:`, saveResult.error);
        continue;
      }

      results.push(saveResult.data);
    }

    if (results.length > 0) {
      await clothingService.updateItemStatus(clothingItemId, 'completed');
    } else {
      await clothingService.updateItemStatus(clothingItemId, 'failed');
      setError('Failed to generate images');
    }

    setLoading(false);
    return { data: results, error: results.length === 0 ? 'No images generated' : null };
  };

  const getPhotos = async (clothingItemId: string) => {
    const result = await clothingService.getClothingPhotos(clothingItemId);
    if (result.error) {
      setError(result.error);
    }
    return result;
  };

  const getGeneratedImages = async (clothingItemId: string) => {
    const result = await clothingService.getGeneratedImages(clothingItemId);
    if (result.error) {
      setError(result.error);
    }
    return result;
  };

  const getUserItems = async () => {
    const result = await clothingService.getUserClothingItems();
    if (result.error) {
      setError(result.error);
    }
    return result;
  };

  const deleteItem = async (itemId: string) => {
    setLoading(true);
    const result = await clothingService.deleteClothingItem(itemId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
    return result;
  };

  return {
    loading,
    error,
    createItem,
    uploadPhoto,
    generateImages,
    getPhotos,
    getGeneratedImages,
    getUserItems,
    deleteItem,
  };
}
