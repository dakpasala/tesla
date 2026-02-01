import React, { useState, useCallback, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { FavoriteIcon } from './FavoriteIcon';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSelectDestination?: (destination: {
    id: string;
    title: string;
    subtitle: string;
  }) => void;
};

type RowData = {
  id: string;
  title: string;
  subtitle: string;
  miles: string;
  isFavorite: boolean;
};

type RowItemProps = {
  item: RowData;
  onPressRow: () => void;
  onToggleStar: () => void;
};

function RowItem({ item, onPressRow, onToggleStar }: RowItemProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onToggleStar}
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
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.rowContent}
        activeOpacity={0.7}
        onPress={onPressRow}
      >
        <View style={styles.rowTextContainer}>
          <Text style={styles.rowText}>{item.title}</Text>
          <Text style={styles.placeSub}>{item.subtitle}</Text>
        </View>
        <Text style={styles.milesText}>{item.miles}</Text>
      </TouchableOpacity>
    </View>
  );
}

type QuickItemProps = {
  title: string;
  subtitle: string;
  icon: any;
  onPress?: () => void;
  style?: ViewStyle;
};

function QuickItem({ title, subtitle, icon, onPress, style }: QuickItemProps) {
  return (
    <TouchableOpacity
      style={[styles.quickItem, style]}
      activeOpacity={0.85}
      onPress={onPress}
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
}

// Initial data with unique IDs and isFavorite flag
const INITIAL_LOCATIONS: RowData[] = [
  {
    id: 'loc-1',
    title: 'Tesla Deer Creek',
    subtitle: '3500 Deer Creek Rd, Palo Alto',
    miles: '2.5 miles',
    isFavorite: true,
  },
  {
    id: 'loc-2',
    title: 'Tesla Page Mill',
    subtitle: '1501 Page Mill Rd, Palo Alto',
    miles: '2.8 miles',
    isFavorite: true,
  },
  {
    id: 'loc-3',
    title: 'Tesla Fremont Factory',
    subtitle: '45500 Fremont Blvd, Fremont',
    miles: '12.3 miles',
    isFavorite: true,
  },
  {
    id: 'loc-4',
    title: 'Tesla Palo Alto HQ',
    subtitle: '3500 Deer Creek Rd, Palo Alto',
    miles: '2.5 miles',
    isFavorite: false,
  },
  {
    id: 'loc-5',
    title: 'Tesla Sunnyvale',
    subtitle: '1100 W Maude Ave, Sunnyvale',
    miles: '5.2 miles',
    isFavorite: false,
  },
];

export default function SearchBar({
  value = '',
  onChangeText,
  expanded = false,
  onExpand,
  onCollapse,
  onSelectDestination,
}: Props) {
  const [sort, setSort] = useState<'A-Z' | 'Z-A'>('A-Z');
  const [localSearchValue, setLocalSearchValue] = useState(value);
  const [locations, setLocations] = useState<RowData[]>(INITIAL_LOCATIONS);

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearchValue(text);
      onChangeText?.(text);
    },
    [onChangeText]
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearchValue('');
    onChangeText?.('');
  }, [onChangeText]);

  const handleCollapse = useCallback(() => {
    handleClearSearch();
    onCollapse?.();
  }, [handleClearSearch, onCollapse]);

  const toggleFavorite = useCallback((id: string) => {
    setLocations(prev =>
      prev.map(loc =>
        loc.id === id ? { ...loc, isFavorite: !loc.isFavorite } : loc
      )
    );
  }, []);

  const handleSelectDestination = useCallback(
    (item: RowData) => {
      onSelectDestination?.({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
      });
    },
    [onSelectDestination]
  );

  // Derived state - favorites
  const favorites = useMemo(() => {
    return locations.filter(loc => loc.isFavorite);
  }, [locations]);

  // Derived state - offices (non-favorites), sorted
  const offices = useMemo(() => {
    const nonFavorites = locations.filter(loc => !loc.isFavorite);
    const sorted = [...nonFavorites].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    if (sort === 'Z-A') sorted.reverse();
    return sorted;
  }, [locations, sort]);

  // Filter based on search
  const filteredFavorites = useMemo(() => {
    if (!localSearchValue.trim()) return favorites;
    const query = localSearchValue.toLowerCase();
    return favorites.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [favorites, localSearchValue]);

  const filteredOffices = useMemo(() => {
    if (!localSearchValue.trim()) return offices;
    const query = localSearchValue.toLowerCase();
    return offices.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [offices, localSearchValue]);

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.collapsed}
        onPress={onExpand}
        activeOpacity={0.85}
      >
        <Image
          source={require('../assets/images/search.png')}
          style={styles.searchIcon}
        />
        <Text style={styles.placeholder}>Search Here</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.expanded}>
      {/* Search input row */}
      <View style={styles.inputRow}>
        <Image
          source={require('../assets/images/search_activate.png')}
          style={styles.searchIcon}
        />
        <TextInput
          value={localSearchValue}
          onChangeText={handleSearchChange}
          placeholder="Search Here"
          placeholderTextColor="#A0A0A0"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={
            localSearchValue.length > 0 ? handleClearSearch : handleCollapse
          }
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* home / work */}
      <View style={styles.quickRow}>
        <QuickItem
          title="Home"
          subtitle="Set location"
          icon={require('../assets/images/search_house.png')}
          onPress={() =>
            onSelectDestination?.({
              id: 'home',
              title: 'Home',
              subtitle: 'Set location',
            })
          }
        />
        <QuickItem
          title="Work"
          subtitle="Set location"
          icon={require('../assets/images/search_job.png')}
          style={{ marginLeft: -100 }}
          onPress={() =>
            onSelectDestination?.({
              id: 'work',
              title: 'Work',
              subtitle: 'Set location',
            })
          }
        />
      </View>

      {/* favorites */}
      <Text style={styles.section}>My Favorites</Text>
      {filteredFavorites.length === 0 ? (
        <Text style={styles.emptyText}>
          {localSearchValue.trim()
            ? 'No matching favorites'
            : 'No favorites yet'}
        </Text>
      ) : (
        filteredFavorites.map(item => (
          <RowItem
            key={item.id}
            item={item}
            onPressRow={() => handleSelectDestination(item)}
            onToggleStar={() => toggleFavorite(item.id)}
          />
        ))
      )}

      {/* offices header with dropdown */}
      <View style={styles.sectionRow}>
        <Text style={styles.section}>All Offices</Text>

        <TouchableOpacity
          style={styles.sortBtn}
          activeOpacity={0.8}
          onPress={() => setSort(s => (s === 'A-Z' ? 'Z-A' : 'A-Z'))}
        >
          <Text style={styles.sortText}>{sort}</Text>
          <Text style={styles.sortChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {filteredOffices.length === 0 ? (
        <Text style={styles.emptyText}>
          {localSearchValue.trim() ? 'No matching offices' : 'No offices'}
        </Text>
      ) : (
        filteredOffices.map(item => (
          <RowItem
            key={item.id}
            item={item}
            onPressRow={() => handleSelectDestination(item)}
            onToggleStar={() => toggleFavorite(item.id)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  expanded: {
    backgroundColor: '#FCFCFC',
    borderRadius: 22,
    padding: 16,
  },

  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    opacity: 0.9,
  },

  placeholder: {
    color: '#A0A0A0',
    fontSize: 14,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F6F6F6',
    marginBottom: 12,
  },

  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    color: '#1C1C1C',
  },

  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7878801F',
    marginLeft: 8,
  },

  clear: {
    fontSize: 14,
    color: '#3C3C4399',
    marginTop: -1,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },

  quickItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  quickCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickCircleIcon: {
    width: 20,
    height: 17,
    resizeMode: 'contain',
    opacity: 0.9,
  },

  quickTextWrap: {
    flex: 1,
  },

  quickTitle: {
    fontWeight: '400',
    fontSize: 12,
    color: '#000000',
  },

  sub: {
    fontSize: 8,
    color: '#878585',
    marginTop: 1,
  },

  section: {
    fontWeight: '500',
    fontSize: 14,
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  sortText: {
    color: '#878585',
    fontWeight: '400',
    fontSize: 12,
  },

  sortChevron: {
    color: '#878585',
    fontSize: 12,
    marginTop: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  starTouchable: {
    padding: 8,
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
    fontSize: 12,
    fontWeight: '400',
    color: '#1C1C1C',
  },

  star: {
    width: 18,
    height: 18,
  },

  starIcon: {
    width: 18,
    height: 18,
  },

  placeSub: {
    fontSize: 8,
    color: '#878585',
    marginTop: 1,
  },

  milesText: {
    color: '#878585',
    fontWeight: '400',
    fontSize: 12,
    marginLeft: 8,
  },

  emptyText: {
    color: '#888',
    paddingVertical: 8,
  },
});
