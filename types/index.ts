export type Gender = 'male' | 'female';

export type ClothingType = 'tshirt' | 'shirt' | 'pants' | 'dress' | 'jacket' | 'hoodie' | 'shorts' | 'skirt';

export type PhotoAngle = 'front' | 'back' | 'left_sleeve' | 'right_sleeve' | 'left_side' | 'right_side';

export type ItemStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface ClothingItem {
  id: string;
  user_id: string;
  gender: Gender;
  clothing_type: ClothingType;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ClothingPhoto {
  id: string;
  clothing_item_id: string;
  angle: PhotoAngle;
  photo_url: string;
  storage_path: string;
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  clothing_item_id: string;
  image_url: string;
  storage_path: string;
  angle: string;
  created_at: string;
}

export interface CapturedPhoto {
  angle: PhotoAngle;
  uri: string;
}
