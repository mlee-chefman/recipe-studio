import { useState, useCallback } from 'react';
import { SpoonacularIngredient, FridgeIngredient } from '~/types/ingredient';
import { getIngredientAutocomplete } from '~/services/ingredient.service';

/**
 * Custom hook to manage ingredient search functionality
 */
export const useIngredientSearch = (onSelectIngredient: (ingredient: FridgeIngredient) => void) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpoonacularIngredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setShowSearchResults(true);

      const result = await getIngredientAutocomplete(query);

      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        console.error('Error fetching ingredients:', result.error);
        setSearchResults([]);
      }

      setIsSearching(false);
    },
    []
  );

  const handleSelectIngredient = useCallback(
    (ingredient: SpoonacularIngredient) => {
      const fridgeIngredient: FridgeIngredient = {
        id: ingredient.id.toString(),
        name: ingredient.name,
        image: ingredient.image,
        addedAt: new Date(),
      };

      onSelectIngredient(fridgeIngredient);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setShowAddIngredient(false);
    },
    [onSelectIngredient]
  );

  const closeSearch = useCallback(() => {
    setShowAddIngredient(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    showAddIngredient,
    setShowAddIngredient,
    handleSearch,
    handleSelectIngredient,
    closeSearch,
  };
};
