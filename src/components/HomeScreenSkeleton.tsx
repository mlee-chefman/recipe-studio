import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RecipeCardSkeleton } from './RecipeCardSkeleton';
import { theme } from '@theme/index';

export const HomeScreenSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Search Bar Skeleton */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar} />
          <View style={styles.filterButton} />
        </View>

        {/* Results Count Skeleton */}
        <View style={styles.resultsCount} />

        {/* Recipe List Skeleton */}
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => <RecipeCardSkeleton viewMode="detailed" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  filterButton: {
    width: 80,
    height: 48,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  resultsCount: {
    height: 16,
    width: 120,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
