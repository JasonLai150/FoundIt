import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Simple function to test if an image URL is accessible
export const testImageUrl = async (url: string): Promise<{ accessible: boolean; status?: number; error?: string }> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error: any) {
    return {
      accessible: false,
      error: error.message
    };
  }
};

export const pickAndUploadAvatar = async (userId: string): Promise<AvatarUploadResult> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission to access media library is required'
      };
    }

    // Launch image picker with base64 enabled
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for avatar
      quality: 0.8,
      base64: true, // Enable base64 for more reliable upload
      allowsMultipleSelection: false,
    });

    if (result.canceled) {
      return {
        success: false,
        error: 'User cancelled image selection'
      };
    }

    const image = result.assets[0];

    if (!image.uri || !image.base64) {
      return {
        success: false,
        error: 'No image data available'
      };
    }

    // Improved file extension detection
    let fileExt = 'jpg'; // Default fallback
    
    // Try to get extension from multiple sources
    if (image.fileName) {
      const extFromFileName = image.fileName.split('.').pop()?.toLowerCase();
      if (extFromFileName) fileExt = extFromFileName;
    } else if (image.uri) {
      const extFromUri = image.uri.split('.').pop()?.toLowerCase();
      if (extFromUri && !extFromUri.includes('?')) fileExt = extFromUri;
    }
    
    // Use mimeType as fallback if available
    if (image.mimeType) {
      const mimeToExt: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff',
        'image/heic': 'heic',
        'image/heif': 'heif'
      };
      const extFromMime = mimeToExt[image.mimeType.toLowerCase()];
      if (extFromMime) fileExt = extFromMime;
    }
    
    // Convert HEIC/HEIF and other problematic formats to JPEG for better compatibility
    const problematicFormats = ['heic', 'heif', 'tiff', 'tif', 'bmp'];
    let finalFileExt = fileExt;
    let finalContentType = '';
    
    if (problematicFormats.includes(fileExt)) {
      finalFileExt = 'jpg';
      finalContentType = 'image/jpeg';
    }

    // Generate unique filename and determine content type
    const fileName = `avatar_${Date.now()}.${finalFileExt}`;
    const filePath = `${userId}/${fileName}`;  // User ID as folder name

    // Convert base64 to binary data using a more robust method
    const base64Data = image.base64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to Uint8Array using a more reliable method
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Map file extensions to proper MIME types
    const getContentType = (extension: string): string => {
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        'svg': 'image/svg+xml',
        'heic': 'image/heic',
        'heif': 'image/heif'
      };
      return mimeTypes[extension] || 'image/jpeg'; // Default to JPEG if unknown
    };
    
    // Use finalContentType if conversion happened, otherwise use detected type
    const contentType = finalContentType || getContentType(finalFileExt);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('avatar-images')
      .upload(filePath, bytes, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error('Avatar upload failed:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatar-images')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      return {
        success: false,
        error: 'Failed to get public URL'
      };
    }

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

export const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'avatar-images');
    if (bucketIndex === -1) {
      console.error('Invalid avatar URL - bucket not found');
      return false;
    }
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    if (!filePath) {
      console.error('Invalid avatar URL - no file path');
      return false;
    }
    
    const { error } = await supabase.storage
      .from('avatar-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete avatar error:', error);
    return false;
  }
}; 