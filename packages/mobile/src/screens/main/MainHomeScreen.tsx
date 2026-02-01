import React, { useRef, useState, useCallback, memo } from 'react';
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
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Modalize } from 'react-native-modalize';

// Import existing components
import SearchBar from '../../components/SearchBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MainHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const modalRef = useRef<Modalize>(null);

  // Search expanded state only - SearchBar manages its own search text
  const [searchExpanded, setSearchExpanded] = useState(true);

  // Stable callbacks
  const handleSelectDestination = useCallback(
    (destination: { id: string; title: string; subtitle: string }) => {
      navigation.navigate('Routes', {
        destinationId: destination.id,
        destinationName: destination.title,
      });
    },
    [navigation]
  );

  const handleExpand = useCallback(() => {
    setSearchExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setSearchExpanded(false);
  }, []);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.3935, // Tesla HQ area
            longitude: -122.15,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        />

        {/* Settings button overlay on map */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
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
      >
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SearchBar - shows search, Home/Work, Favorites, All Offices */}
          <View style={styles.searchContainer}>
            <SearchBar
              expanded={searchExpanded}
              onExpand={handleExpand}
              onCollapse={handleCollapse}
              onSelectDestination={handleSelectDestination}
            />
          </View>
        </ScrollView>
      </Modalize>
    </View>
  );
}

export default memo(MainHomeScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
