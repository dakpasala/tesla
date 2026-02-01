import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Modalize } from 'react-native-modalize';

// Import existing components
import SearchBar from '../../components/SearchBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const modalRef = useRef<Modalize>(null);

  // Search state - expanded by default to show all content
  const [searchValue, setSearchValue] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(true);

  // Handle destination selection - navigate to Routes
  const handleSelectDestination = (destination: {
    id: string;
    title: string;
    subtitle: string;
  }) => {
    navigation.navigate('Routes', {
      destinationId: destination.id,
      destinationName: destination.title,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map Background (placeholder for now) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder} />

        {/* Settings button overlay on map */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet with Modalize - Landing page content */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={450}
        modalHeight={650}
        keyboardAvoidingBehavior="padding"
      >
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* SearchBar - shows search, Home/Work, Favorites, All Offices */}
          <View style={styles.searchContainer}>
            <SearchBar
              value={searchValue}
              onChangeText={setSearchValue}
              expanded={searchExpanded}
              onExpand={() => setSearchExpanded(true)}
              onCollapse={() => setSearchExpanded(false)}
              onSelectDestination={handleSelectDestination}
            />
          </View>
        </ScrollView>
      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 20,
  },
  modalStyle: {
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: '#DEDEDE',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
  },
  sheetContent: {
    flex: 1,
    paddingTop: 10,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
