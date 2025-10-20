/**
 * Firebase Helper Utilities
 * Contains helper functions for Firebase operations
 */

import { Timestamp, DocumentData } from 'firebase/firestore';
import { Recipe } from '../../types/recipe';

/**
 * Recursively removes all undefined values from an object, including nested objects and arrays
 * This is necessary because Firebase Firestore does not accept undefined values
 *
 * @param obj - The object to clean
 * @returns A new object with all undefined values removed
 *
 * @example
 * const data = { name: 'Recipe', tags: undefined, steps: [{ text: 'Step 1', image: undefined }] };
 * const clean = deepCleanUndefined(data);
 * // Result: { name: 'Recipe', steps: [{ text: 'Step 1' }] }
 */
export function deepCleanUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => deepCleanUndefined(item)) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.keys(obj).forEach(key => {
      const value = (obj as Record<string, unknown>)[key];
      if (value !== undefined) {
        cleaned[key] = deepCleanUndefined(value);
      }
    });
    return cleaned as T;
  }
  return obj;
}

/**
 * Converts a Firestore timestamp to a Date object or returns the value as-is
 * Handles both Timestamp objects and regular Date objects
 *
 * @param value - The value to convert
 * @returns A Date object or the original value
 */
export function convertTimestamp(value: unknown): Date | string | unknown {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return value;
}

/**
 * Ensures a value is not undefined by providing a default
 *
 * @param value - The value to check
 * @param defaultValue - The default value to use if undefined
 * @returns The value or the default
 */
export function withDefault<T>(value: T | undefined, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

/**
 * Maps Firebase document data to a Recipe object
 * Ensures all required fields are present and properly typed
 * Automatically derives the status field from the published boolean
 *
 * @param id - The document ID
 * @param data - The Firebase document data
 * @returns A properly typed Recipe object
 *
 * @example
 * const recipe = mapFirebaseDataToRecipe(doc.id, doc.data());
 */
export function mapFirebaseDataToRecipe(id: string, data: DocumentData): Recipe {
  const published = data.published ?? false;
  return {
    id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    ingredients: data.ingredients,
    steps: data.steps,
    cookTime: data.cookTime,
    servings: data.servings,
    difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
    category: data.category,
    tags: data.tags,
    image: data.image,
    chefiqAppliance: data.chefiqAppliance,
    stepSections: data.stepSections,
    useProbe: data.useProbe,
    published,
    status: published ? 'Published' : 'Draft',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
  };
}
