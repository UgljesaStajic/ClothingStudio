import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export const aiService = {
  async generateMannequinImage(
    photoUrl: string,
    gender: 'male' | 'female',
    clothingType: string,
    angle: string
  ): Promise<{ data: { imageUrl: string; storagePath: string } | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.functions.invoke('generate-mannequin', {
        body: {
          photoUrl,
          gender,
          clothingType,
          angle,
        },
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to read response'}`;
          }
        }
        return { data: null, error: errorMessage };
      }

      if (!data || !data.imageUrl) {
        return { data: null, error: 'No image URL returned' };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
