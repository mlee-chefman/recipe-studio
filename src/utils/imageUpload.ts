import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import * as FileSystem from 'expo-file-system';

/**
 * Uploads a base64 encoded image to Firebase Storage
 * React Native compatible version using FileSystem and fetch blob
 * @param base64Image - Base64 encoded image string (with or without data URI prefix)
 * @param userId - User ID for organizing storage
 * @param recipeId - Recipe ID for organizing storage
 * @param filename - Optional filename, defaults to 'cover.jpg'
 * @returns Download URL of the uploaded image
 */
export async function uploadBase64ImageToStorage(
  base64Image: string,
  userId: string,
  recipeId: string,
  filename: string = 'cover.jpg'
): Promise<string> {
  try {
    // Remove data URI prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    // Create temporary file path
    const tempFilePath = `${FileSystem.cacheDirectory}temp-${Date.now()}.jpg`;

    // Write base64 to temporary file
    await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Temporary file created: ${tempFilePath}`);

    // Fetch the file as a blob
    const response = await fetch(tempFilePath);
    const blob = await response.blob();

    // Create storage reference
    const storagePath = `recipe-images/${userId}/${recipeId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Upload blob to Firebase Storage
    console.log(`Uploading image to: ${storagePath}`);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    // Clean up temporary file
    try {
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
    } catch (cleanupError) {
      console.warn('Failed to delete temp file:', cleanupError);
    }

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Image uploaded successfully: ${downloadURL}`);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Uploads a local image URI to Firebase Storage
 * Used for manual image uploads (from camera or gallery)
 * @param imageUri - Local file URI (e.g., file://, content://)
 * @param userId - User ID for organizing storage
 * @param recipeId - Recipe ID for organizing storage
 * @param filename - Optional filename
 * @returns Download URL of the uploaded image
 */
export async function uploadLocalImageToStorage(
  imageUri: string,
  userId: string,
  recipeId: string,
  filename?: string
): Promise<string> {
  try {
    // Fetch the local image and convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate filename if not provided
    const finalFilename = filename || `upload-${Date.now()}.jpg`;

    // Create storage reference
    const storagePath = `recipe-images/${userId}/${recipeId}/${finalFilename}`;
    const storageRef = ref(storage, storagePath);

    // Upload blob to Firebase Storage
    console.log(`Uploading local image to: ${storagePath}`);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Local image uploaded successfully: ${downloadURL}`);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading local image to storage:', error);
    throw new Error(`Failed to upload local image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a unique filename with timestamp
 * @param prefix - Prefix for the filename (e.g., 'generated', 'cover')
 * @param extension - File extension (default: 'jpg')
 * @returns Filename with timestamp
 */
export function generateUniqueFilename(prefix: string = 'image', extension: string = 'jpg'): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}.${extension}`;
}
