import { useState } from 'react';

interface RecipeInfoFormData {
  cookTimeHours: number;
  cookTimeMinutes: number;
  servings: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

interface UseRecipeInfoFormReturn {
  formData: RecipeInfoFormData;
  setCookTimeHours: (hours: number) => void;
  setCookTimeMinutes: (minutes: number) => void;
  setServings: (servings: number) => void;
  setCategory: (category: string) => void;
  setDifficulty: (difficulty: 'Easy' | 'Medium' | 'Hard') => void;
  setTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  addCustomTag: (tag: string) => void;
}

/**
 * Custom hook for managing recipe info form state
 * @param initialData - Initial form data
 * @returns Form data and setter functions
 */
export const useRecipeInfoForm = (initialData: Partial<RecipeInfoFormData>): UseRecipeInfoFormReturn => {
  const [cookTimeHours, setCookTimeHours] = useState(initialData.cookTimeHours ?? 0);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(initialData.cookTimeMinutes ?? 30);
  const [servings, setServings] = useState(initialData.servings ?? 4);
  const [category, setCategory] = useState(initialData.category ?? '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(initialData.difficulty ?? 'Medium');
  const [tags, setTags] = useState<string[]>(initialData.tags ?? []);

  const toggleTag = (tag: string) => {
    const isSelected = tags.includes(tag);
    if (isSelected) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  return {
    formData: {
      cookTimeHours,
      cookTimeMinutes,
      servings,
      category,
      difficulty,
      tags,
    },
    setCookTimeHours,
    setCookTimeMinutes,
    setServings,
    setCategory,
    setDifficulty,
    setTags,
    toggleTag,
    addCustomTag,
  };
};
