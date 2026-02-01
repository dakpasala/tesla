import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  icon: string;
}

const MOCK_FAVORITES: FavoriteLocation[] = [
  {
    id: '1',
    name: 'Home',
    address: '123 Main St, San Francisco, CA',
    icon: '🏠',
  },
  { id: '2', name: 'Work', address: 'Tesla HQ, Palo Alto, CA', icon: '🏢' },
  {
    id: '3',
    name: 'Gym',
    address: '456 Fitness Ave, Mountain View, CA',
    icon: '💪',
  },
  {
    id: '4',
    name: "Mom's House",
    address: '789 Family Ln, San Jose, CA',
    icon: '❤️',
  },
];

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>();

  const renderFavorite = ({ item }: { item: FavoriteLocation }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('Routes')}
    >
      <View style={styles.favoriteIcon}>
        <Text style={styles.favoriteIconText}>{item.icon}</Text>
      </View>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteAddress}>{item.address}</Text>
      </View>
      <Text style={styles.favoriteArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <TouchableOpacity>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Favorites List */}
      <FlatList
        data={MOCK_FAVORITES}
        renderItem={renderFavorite}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Save your frequent destinations for quick access
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  addButton: {
    fontSize: 28,
    color: '#4285F4',
  },
  listContent: {
    padding: 16,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteIconText: {
    fontSize: 24,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  favoriteAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  favoriteArrow: {
    fontSize: 20,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
