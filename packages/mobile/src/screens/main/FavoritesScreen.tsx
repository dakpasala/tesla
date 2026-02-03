// packages/mobile/src/screens/main/FavoritesScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

// Import existing component
import { FavoriteIcon } from '../../components/FavoriteIcon';

// Import address APIs
import {
  getUserFavorites,
  getUserHomeAddress,
  setUserHomeAddress,
  getUserWorkAddress,
  setUserWorkAddress,
} from '../../services/users';

// Import route API
import { getRoutesGoHome } from '../../services/maps';
import type { GoHomeResponse } from '../../services/maps';

// Import location utility
import { getUserLocation } from '../../services/location';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  miles: string;
  starred: boolean;
}

const USER_ID = 1; // TODO: replace with auth context

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
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch home, work, and favorites on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const [homeRes, workRes, favRes] = await Promise.all([
          getUserHomeAddress(USER_ID),
          getUserWorkAddress(USER_ID),
          getUserFavorites(USER_ID),
        ]);

        setHomeAddress(homeRes?.home_address ?? null);
        setWorkAddress(workRes?.work_address ?? null);

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
  }, []);

  const [fetchingRoute, setFetchingRoute] = useState(false);

  // Opens the edit modal for home or work
  const openEditor = (type: 'home' | 'work') => {
    setEditingType(type);
    setInputValue(type === 'home' ? homeAddress ?? '' : workAddress ?? '');
    setModalVisible(true);
  };

  // Saves the address via API, then auto-navigates to Routes
  const saveAddress = async () => {
  if (!editingType) return;
  setSaving(true);
  try {
    if (editingType === 'home') {
      console.log('Saving home address:', inputValue);
      const res = await setUserHomeAddress(USER_ID, inputValue);
      console.log('Save home response:', JSON.stringify(res));
      setHomeAddress(inputValue);
      setModalVisible(false);

      console.log('Getting user location...');
      setFetchingRoute(true);
     // const origin = await getUserLocation();
      const origin = { lat: 37.3935, lng: -122.15 };
      console.log('Got location:', JSON.stringify(origin));

      const routeData = await getRoutesGoHome({
        origin,
        destination: inputValue,
      });
      console.log('Got routes:', JSON.stringify(routeData));
      navigation.navigate('Routes', { routeData });
    } else {
      // ...work stuff
    }
  } catch (err) {
    console.error('SAVE ADDRESS ERROR:', err); // <-- check which log is the last one before this
    Alert.alert('Error', 'Something went wrong. Try again.');
  }
  };

  // Loading state for route fetching
  // Tapping Home/Work — fetches user location then routes, then navigates
  const handleQuickTap = async (type: 'home' | 'work') => {
    const address = type === 'home' ? homeAddress : workAddress;

    if (!address) {
      openEditor(type);
      return;
    }

    if (type === 'home') {
      setFetchingRoute(true);
      try {
        // 1. Get user's current location
        //const origin = await getUserLocation();
        const origin = { lat: 37.3935, lng: -122.15 };

        // 2. Fetch routes from current location to home
        const routeData = await getRoutesGoHome({
          origin,
          destination: address,
        });

        // 3. Navigate with the route data
        navigation.navigate('Routes', { routeData });
      } catch (err) {
        console.error('Failed to fetch routes', err);
        Alert.alert('Error', 'Could not fetch routes. Try again.');
      } finally {
        setFetchingRoute(false);
      }
    } else {
      // Work — just navigate for now (can wire up getRoutesToOffice later)
      navigation.navigate('Routes', { destination: address });
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.map(item =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const renderFavorite = ({ item }: { item: FavoriteLocation }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('Routes')}
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
            onPress={() => handleQuickTap('home')}
            disabled={fetchingRoute}
          >
            <View style={styles.quickCircle}>
              {fetchingRoute ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <Image
                  source={require('../../assets/images/search_house.png')}
                  style={styles.quickIcon}
                  resizeMode="contain"
                />
              )}
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
            {/* Edit pencil if already set */}
            {homeAddress && (
              <TouchableOpacity onPress={() => openEditor('home')} style={styles.editButton}>
                <Text style={styles.editText}>✎</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Work */}
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => handleQuickTap('work')}
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
            {workAddress && (
              <TouchableOpacity onPress={() => openEditor('work')} style={styles.editButton}>
                <Text style={styles.editText}>✎</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>My Favorites</Text>

        {/* Favorites List */}
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={item => item.id}
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

      {/* Edit Address Modal */}
      <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Set {editingType === 'home' ? 'Home' : 'Work'} Address
              </Text>

              <TextInput
                style={styles.modalInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter address..."
                autoFocus
                clearButtonMode="while-editing"
                onSubmitEditing={saveAddress}
                returnKeyType="done"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={saveAddress}
                  disabled={saving || inputValue.trim() === ''}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  editButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  editText: {
    fontSize: 16,
    color: '#4285F4',
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
  // Modal
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'flex-end',
  paddingBottom: 34, // safe area for iPhone home indicator
},
modalCard: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 24,
  paddingBottom: 50, // extra space so buttons aren't cut off
},
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#FAFAFA',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});