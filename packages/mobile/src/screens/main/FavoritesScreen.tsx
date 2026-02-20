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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import { useTheme } from '../../context/ThemeContext';

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

  const { activeTheme } = useTheme();
  const c = activeTheme.colors;
  const components = activeTheme.components;

  // Home / Work state
  const [homeAddress, setHomeAddress] = useState<string | null>(null);
  const [workAddress, setWorkAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);

  // Modal state
  const [homeModalVisible, setHomeModalVisible] = useState(false);
  const [workModalVisible, setWorkModalVisible] = useState(false);
  const [homeInputValue, setHomeInputValue] = useState('');
  const [saving, setSaving] = useState(false);

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
  const openHomeEditor = () => {
    setHomeInputValue(homeAddress || '');
    setHomeModalVisible(true);
  };

  const openWorkEditor = () => {
    setWorkModalVisible(true);
  };

  // Save home address via API
  const saveHomeAddress = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      await setUserHomeAddress(userId, homeInputValue);
      setHomeAddress(homeInputValue);
      setHomeModalVisible(false);
    } catch (err: any) {
      console.error('SAVE HOME ADDRESS ERROR:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Something went wrong. Try again.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  };

  // Save work address via API
  const saveWorkAddress = async (address: string) => {
    if (!userId) return;

    try {
      await setUserWorkAddress(userId, address);
      setWorkAddress(address);
      setWorkModalVisible(false);
    } catch (err: any) {
      console.error('SAVE WORK ADDRESS ERROR:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Something went wrong. Try again.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
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
      style={[styles.favoriteCard, { borderBottomColor: c.border }]}
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
            style={[styles.starIcon, { tintColor: components.icon }]}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
      <View style={styles.favoriteInfo}>
        <Text style={[styles.favoriteName, { color: c.text.primary }]}>{item.name}</Text>
        <Text style={[styles.favoriteAddress, { color: c.text.secondary }]}>{item.address}</Text>
      </View>
      <Text style={[styles.favoriteMiles, { color: c.text.secondary }]}>{item.miles}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: c.text.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text.primary }]}>Favorites</Text>
        <TouchableOpacity>
          <Text style={[styles.addButton, { color: c.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollViewWrapper>
        {/* Quick Access — Home & Work */}
        <View style={styles.quickAccess}>
          {/* Home */}
          <TouchableOpacity
            style={styles.quickItem}
            onPress={openHomeEditor}
          >
            <View style={[styles.quickCircle, { backgroundColor: c.backgroundAlt }]}>
              <Image
                source={require('../../assets/images/search_house.png')}
                style={[styles.quickIcon, { tintColor: c.text.primary }]}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: c.text.primary }]}>Home</Text>
              {addressLoading ? (
                <ActivityIndicator size="small" color="#878585" />
              ) : (
                <Text style={[styles.quickSubtitle, { color: c.text.secondary }]} numberOfLines={1} ellipsizeMode="tail">
                  {homeAddress ?? 'Set location'}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Work */}
          <TouchableOpacity
            style={styles.quickItem}
            onPress={openWorkEditor}
          >
            <View style={[styles.quickCircle, { backgroundColor: c.backgroundAlt }]}>
              <Image
                source={require('../../assets/images/search_job.png')}
                style={[styles.quickIcon, { tintColor: c.text.primary }]}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: c.text.primary }]}>Work</Text>
              {addressLoading ? (
                <ActivityIndicator size="small" color="#878585" />
              ) : (
                <Text style={[styles.quickSubtitle, { color: c.text.secondary }]} numberOfLines={1} ellipsizeMode="tail">
                  {workAddress ?? 'Set location'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: c.text.primary }]}>My Favorites</Text>

        {/* Favorites List */}
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: c.text.primary }]}>No favorites yet</Text>
              <Text style={[styles.emptySubtext, { color: c.text.secondary }]}>
                Save your frequent destinations for quick access
              </Text>
            </View>
          }
        />
      </ScrollViewWrapper>

      {/* Home Address Modal - Simple Text Input */}
      <Modal
        visible={homeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHomeModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalCard, { backgroundColor: c.card }]}>
            <Text style={[styles.modalTitle, { color: c.text.primary }]}>Set Home Address</Text>

            <TextInput
              style={[styles.modalInput, { borderColor: c.border, color: c.text.primary, backgroundColor: c.backgroundAlt }]}
              value={homeInputValue}
              onChangeText={setHomeInputValue}
              placeholder="Enter address..."
              placeholderTextColor={c.text.secondary}
              autoFocus
              clearButtonMode="while-editing"
              onSubmitEditing={saveHomeAddress}
              returnKeyType="done"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: c.border }]}
                onPress={() => setHomeModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: c.text.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: c.primary }]}
                onPress={saveHomeAddress}
                disabled={saving || homeInputValue.trim() === ''}
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

      {/* Work Address Modal - Autocomplete */}
      <AddressAutocompleteModal
        visible={workModalVisible}
        title="Set Work Address"
        initialValue={workAddress || ''}
        onSave={saveWorkAddress}
        onCancel={() => setWorkModalVisible(false)}
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
    minWidth: 0, // Allow flex children to shrink
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 34,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 50,
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