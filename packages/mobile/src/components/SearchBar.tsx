// packages/mobile/src/components/SearchBar.tsx

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import { FavoriteIcon } from './FavoriteIcon';

import { getUserHomeAddress, getUserWorkAddress, getUserFavorites, addUserFavorite, removeUserFavorite } from '../services/users';
import { getAllLocations } from '../services/parkings';
import { useAuth } from '../context/AuthContext';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '../theme/theme';

type RowData = {
  id: string;
  title: string;
  subtitle: string;
  miles: string;
  isFavorite: boolean;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
};

type RowItemProps = {
  item: RowData;
  onPressRow: (id: string) => void;
  onToggleStar: (id: string) => void;
};

// Memoized RowItem - only re-renders when props change
const RowItem = memo(function RowItem({
  item,
  onPressRow,
  onToggleStar,
}: RowItemProps) {
  return (
    <View style={styles.row}>
      <GHTouchableOpacity
        onPress={() => onToggleStar(item.id)}
        activeOpacity={0.6}
        style={styles.starTouchable}
      >
        <View style={styles.star}>
          {item.isFavorite ? (
            <FavoriteIcon />
          ) : (
            <Image
              source={require('../assets/images/fav_icon_deactivate.png')}
              style={styles.starIcon}
              resizeMode="contain"
            />
          )}
        </View>
      </GHTouchableOpacity>

      <TouchableOpacity
        style={styles.rowContent}
        activeOpacity={0.7}
        onPress={() => onPressRow(item.id)}
      >
        <View style={styles.rowTextContainer}>
          <Text style={styles.rowText}>{item.title}</Text>
          <Text style={styles.placeSub}>{item.subtitle}</Text>
        </View>
        <Text style={styles.milesText}>{item.miles}</Text>
      </TouchableOpacity>
    </View>
  );
});

type QuickItemProps = {
  title: string;
  subtitle: string;
  icon: any;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
};

// Memoized QuickItem
const QuickItem = memo(function QuickItem({
  title,
  subtitle,
  icon,
  onPress,
  onLongPress,
  style,
}: QuickItemProps) {
  return (
    <TouchableOpacity
      style={[styles.quickItem, style]}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={styles.quickCircle}>
        <Image source={icon} style={styles.quickCircleIcon} />
      </View>
      <View style={styles.quickTextWrap}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
});

type Props = {
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onFocus?: () => void;
  onSelectDestination?: (destination: {
    id: string;
    title: string;
    subtitle: string;
    coordinate?: { latitude: number; longitude: number };
  }) => void;
  onHomePress?: (address: string | null) => void;
  onWorkPress?: (address: string | null) => void;
  onHomeLongPress?: () => void;
  onWorkLongPress?: () => void;
};

function SearchBar({
  expanded = false,
  onExpand,
  onCollapse,
  onFocus,
  onSelectDestination,
  onHomePress,
  onWorkPress,
  onHomeLongPress,
  onWorkLongPress,
}: Props) {
  const { userId } = useAuth();
  const [sort, setSort] = useState<'A-Z' | 'Z-A'>('A-Z');
  const [searchText, setSearchText] = useState('');
  const [locations, setLocations] = useState<RowData[]>([]);
  const [homeAddress, setHomeAddress] = useState<string | null>(null);
  const [workAddress, setWorkAddress] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      if (!userId) return;
      
      try {
        const [homeRes, workRes, favRes, locationsRes] = await Promise.all([
          getUserHomeAddress(userId),
          getUserWorkAddress(userId),
          getUserFavorites(userId),
          getAllLocations(), // Add this
        ]);

        setHomeAddress(homeRes?.home_address?.trim() || null);
        setWorkAddress(workRes?.work_address?.trim() || null);

        // Build a Set of favorited location IDs
        const favIds = new Set(favRes.map((f: any) => f.location_id));

        // Map all locations and mark favorites
        const allMapped: RowData[] = locationsRes.map((loc: any) => ({
          id: String(loc.id),
          title: loc.name,
          subtitle: loc.address,
          miles: '', // Could calculate distance if we had user location
          isFavorite: favIds.has(loc.id),
        }));

        setLocations(allMapped);
      } catch (err) {
        console.error('Failed to fetch SearchBar data', err);
      }
    }
      fetchAll();
    }, [userId]);

    const handleSearchChange = useCallback((text: string) => {
      setSearchText(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const handleCollapse = useCallback(() => {
    setSearchText('');
    onCollapse?.();
  }, [onCollapse]);

  // Toggle favorite — calls API then updates local state
  const toggleFavorite = useCallback(async (id: string) => {
    if (!userId) return;
    
    const item = locations.find(loc => loc.id === id);
    if (!item) return;

    try {
      if (item.isFavorite) {
        await removeUserFavorite(userId, item.title);
      } else {
        await addUserFavorite(userId, {
          label: item.title,
          name: item.title,
          address: item.subtitle,
        });
      }

      setLocations(prev =>
        prev.map(loc =>
          loc.id === id ? { ...loc, isFavorite: !loc.isFavorite } : loc
        )
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }, [locations, userId]);

  const handleSelectDestination = useCallback(
    (id: string) => {
      const item = locations.find(loc => loc.id === id);
      if (item && onSelectDestination) {
        onSelectDestination({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          coordinate: item.coordinate,
        });
      }
    },
    [locations, onSelectDestination]
  );

  // Pass the address up to parent — parent decides what to do
  const handleHomePress = useCallback(() => {
    onHomePress?.(homeAddress);
  }, [onHomePress, homeAddress]);

  const handleWorkPress = useCallback(() => {
    onWorkPress?.(workAddress);
  }, [onWorkPress, workAddress]);

  const handleSortToggle = useCallback(() => {
    setSort(s => (s === 'A-Z' ? 'Z-A' : 'A-Z'));
  }, []);

  // Derived state
  const favorites = useMemo(
    () => locations.filter(loc => loc.isFavorite),
    [locations]
  );

  const offices = useMemo(() => {
    const nonFavorites = locations.filter(loc => !loc.isFavorite);
    const sorted = [...nonFavorites].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    if (sort === 'Z-A') sorted.reverse();
    return sorted;
  }, [locations, sort]);

  const filteredFavorites = useMemo(() => {
    if (!searchText.trim()) return favorites;
    const query = searchText.toLowerCase();
    return favorites.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [favorites, searchText]);

  const filteredOffices = useMemo(() => {
    if (!searchText.trim()) return offices;
    const query = searchText.toLowerCase();
    return offices.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [offices, searchText]);

  const renderContent = () => (
    <>
      <View style={styles.quickRow}>
        <QuickItem
          title="Home"
          subtitle={homeAddress ?? 'Set location'}
          icon={require('../assets/images/search_house.png')}
          onPress={handleHomePress}
          onLongPress={onHomeLongPress}
        />
        <QuickItem
          title="Work"
          subtitle={workAddress ?? 'Set location'}
          icon={require('../assets/images/search_job.png')}
          style={styles.workItem}
          onPress={handleWorkPress}
          onLongPress={onWorkLongPress}
        />
      </View>

      <Text style={styles.section}>My Favorites</Text>
      {filteredFavorites.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchText.trim() ? 'No matching favorites' : 'No favorites yet'}
        </Text>
      ) : (
        filteredFavorites.map(item => (
          <RowItem
            key={item.id}
            item={item}
            onPressRow={handleSelectDestination}
            onToggleStar={toggleFavorite}
          />
        ))
      )}

      <View style={styles.sectionRow}>
        <Text style={styles.section}>All Offices</Text>
        <TouchableOpacity
          style={styles.sortBtn}
          activeOpacity={0.8}
          onPress={handleSortToggle}
        >
          <Text style={styles.sortText}>{sort}</Text>
          <Text style={styles.sortChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {filteredOffices.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchText.trim() ? 'No matching offices' : 'No offices'}
        </Text>
      ) : (
        filteredOffices.map(item => (
          <RowItem
            key={item.id}
            item={item}
            onPressRow={handleSelectDestination}
            onToggleStar={toggleFavorite}
          />
        ))
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Search Input Row - Always visible to prevent flash */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={!expanded ? onExpand : undefined}
          style={[StyleSheet.absoluteFill, { zIndex: expanded ? -1 : 1 }]}
        />
        <Image
          source={require('../assets/images/search.png')}
          style={styles.searchIcon}
        />

        <TextInput
          value={searchText}
          onChangeText={handleSearchChange}
          onFocus={onFocus}
          placeholder="Search Here"
          placeholderTextColor={theme.colors.text.light}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Expanded Content - Always rendered */}
      {renderContent()}
    </View>
  );
}

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.l,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#000',
    opacity: 1,
  },
  placeholder: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F6F6F6',
    marginBottom: theme.spacing.l,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
    color: '#000000',
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  quickItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
  },
  workItem: {
    marginLeft: 0,
  },
  quickCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickCircleIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    opacity: 0.8,
  },
  quickTextWrap: {
    flex: 1,
  },
  quickTitle: {
    fontWeight: '500',
    fontSize: 16,
    color: '#000000',
  },
  sub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  section: {
    fontWeight: '700',
    fontSize: 14,
    paddingVertical: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  sortChevron: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#F2F2F7',
  },
  starTouchable: {
    padding: 8,
    marginRight: 8,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  star: {
    width: 20,
    height: 20,
  },
  starIcon: {
    width: 20,
    height: 20,
    tintColor: '#C7C7CC',
  },
  placeSub: {
    fontSize: 13,
    color: '#8E8E93',
  },
  milesText: {
    color: '#8E8E93',
    fontWeight: '500',
    fontSize: 13,
    marginLeft: 12,
  },
  emptyText: {
    color: '#8E8E93',
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 14,
  },
});