// packages/mobile/src/screens/main/FavoritesScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

// Import existing component
import { FavoriteIcon } from '../../components/FavoriteIcon';
import AddressAutocompleteModal from '../../components/AddressAutocompleteModal';

// Import address APIs
import {
  getUserFavorites,
  getUserHomeAddress,
  setUserHomeAddress,
  getUserWorkAddress,
  setUserWorkAddress,
} from '../../services/users';

import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  miles: string;
  starred: boolean;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);

  // Home / Work state
  const [homeAddress, setHomeAddress] = useState<string | null>(null);
  const [workAddress, setWorkAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'home' | 'work' | null>(null);

  const { userId } = useAuth();

  // Fetch home, work, and favorites on mount
  useEffect(() => {
    async function loadAll() {
      if (!userId) return;
      try {
        const [homeRes, workRes, favRes] = await Promise.all([
          getUserHomeAddress(userId),
          getUserWorkAddress(userId),
          getUserFavorites(userId),
        ]);

        setHomeAddress(homeRes?.home_address?.trim() || null);
        setWorkAddress(workRes?.work_address?.trim() || null);

        setFavorites(
          favRes.map((fav, index) => ({
            id: String(index),
            name: fav.name,
            address: fav.address,
            miles: '',
            starred: true,
          }))
        );
      } catch (err) {
        console.error('Failed to load favorites screen data', err);
      } finally {
        setAddressLoading(false);
      }
    }

    loadAll();
  }, [userId]);

  // Opens the edit modal for home or work
  const openEditor = (type: 'home' | 'work') => {
    setEditingType(type);
    setModalVisible(true);
  };

  // Saves the address via API
  const saveAddress = async (address: string) => {
    if (!userId) return;
    if (!editingType) return;

    try {
      if (editingType === 'home') {
        await setUserHomeAddress(userId, address);
        setHomeAddress(address);
      } else {
        await setUserWorkAddress(userId, address);
        setWorkAddress(address);
      }
      setModalVisible(false);
    } catch (err) {
      console.error('SAVE ADDRESS ERROR:', err);
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const renderFavorite = ({ item }: { item: FavoriteLocation }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() =>
        navigation.navigate('Map', {
          destinationName: item.name,
          destinationAddress: item.address,
        })
      }
    >
      <TouchableOpacity
        style={styles.starButton}
        onPress={() => toggleFavorite(item.id)}
      >
        {item.starred ? (
          <FavoriteIcon />
        ) : (
          <Image
            source={require('../../assets/images/fav_icon_deactivate.png')}
            style={styles.starIcon}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteAddress}>{item.address}</Text>
      </View>
      <Text style={styles.favoriteMiles}>{item.miles}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

      <ScrollViewWrapper>
        {/* Quick Access — Home & Work */}
        <View style={styles.quickAccess}>
          {/* Home */}
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => openEditor('home')}
          >
            <View style={styles.quickCircle}>
              <Image
                source={require('../../assets/images/search_house.png')}
                style={styles.quickIcon}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.quickTitle}>Home</Text>
              {addressLoading ? (
                <ActivityIndicator size="small" color="#878585" />
              ) : (
                <Text style={styles.quickSubtitle}>
                  {homeAddress ?? 'Set location'}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Work */}
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => openEditor('work')}
          >
            <View style={styles.quickCircle}>
              <Image
                source={require('../../assets/images/search_job.png')}
                style={styles.quickIcon}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.quickTitle}>Work</Text>
              {addressLoading ? (
                <ActivityIndicator size="small" color="#878585" />
              ) : (
                <Text style={styles.quickSubtitle}>
                  {workAddress ?? 'Set location'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>My Favorites</Text>

        {/* Favorites List */}
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>
                Save your frequent destinations for quick access
              </Text>
            </View>
          }
        />
      </ScrollViewWrapper>

      {/* Address Autocomplete Modal */}
      <AddressAutocompleteModal
        visible={modalVisible}
        title={`Set ${editingType === 'home' ? 'Home' : 'Work'} Address`}
        initialValue={editingType === 'home' ? homeAddress || '' : workAddress || ''}
        onSave={saveAddress}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// Thin wrapper so FlatList doesn't conflict with outer scroll
function ScrollViewWrapper({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
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
  quickAccess: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  quickItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    width: 20,
    height: 17,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
  },
  quickSubtitle: {
    fontSize: 8,
    color: '#878585',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  starButton: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  starIcon: {
    width: 18,
    height: 18,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#1C1C1C',
  },
  favoriteAddress: {
    fontSize: 8,
    color: '#878585',
    marginTop: 1,
  },
  favoriteMiles: {
    fontSize: 12,
    color: '#878585',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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