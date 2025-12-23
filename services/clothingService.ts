import { getSupabaseClient } from '@/template';
import type { ClothingItem, ClothingPhoto, GeneratedImage, Gender, ClothingType, PhotoAngle } from '@/types';

const supabase = getSupabaseClient();

export const clothingService = {
  async createClothingItem(gender: Gender, clothingType: ClothingType) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .insert({
        user_id: userData.user.id,
        gender,
        clothing_type: clothingType,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ClothingItem, error: null };
  },

  async uploadPhoto(file: Blob, clothingItemId: string, angle: PhotoAngle) {
    const fileName = `${clothingItemId}/${angle}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clothing-photos')
      .upload(fileName, file, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return { data: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('clothing-photos')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('clothing_photos')
      .insert({
        clothing_item_id: clothingItemId,
        angle,
        photo_url: urlData.publicUrl,
        storage_path: fileName,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ClothingPhoto, error: null };
  },

  async getClothingPhotos(clothingItemId: string) {
    const { data, error } = await supabase
      .from('clothing_photos')
      .select('*')
      .eq('clothing_item_id', clothingItemId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ClothingPhoto[], error: null };
  },

  async updateItemStatus(itemId: string, status: 'draft' | 'processing' | 'completed' | 'failed') {
    const { error } = await supabase
      .from('clothing_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  async saveGeneratedImage(
    clothingItemId: string,
    imageData: { imageUrl: string; storagePath: string },
    angle: string
  ) {
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        clothing_item_id: clothingItemId,
        image_url: imageData.imageUrl,
        storage_path: imageData.storagePath,
        angle,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as GeneratedImage, error: null };
  },

  async getGeneratedImages(clothingItemId: string) {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('clothing_item_id', clothingItemId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as GeneratedImage[], error: null };
  },

  async getUserClothingItems() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ClothingItem[], error: null };
  },

  async deleteClothingItem(itemId: string) {
    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },
};
