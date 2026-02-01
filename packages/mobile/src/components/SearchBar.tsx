import React, { useState, useCallback, useMemo, memo } from 'react';
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
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';

type RowData = {
  id: string;
  title: string;
  subtitle: string;
  miles: string;
  isFavorite: boolean;
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
  style?: ViewStyle;
};

// Memoized QuickItem
const QuickItem = memo(function QuickItem({
  title,
  subtitle,
  icon,
  onPress,
  style,
}: QuickItemProps) {
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
});

// Initial data
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

type Props = {
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSelectDestination?: (destination: {
    id: string;
    title: string;
    subtitle: string;
  }) => void;
};

function SearchBar({
  expanded = false,
  onExpand,
  onCollapse,
  onSelectDestination,
}: Props) {
  const [sort, setSort] = useState<'A-Z' | 'Z-A'>('A-Z');
  const [searchText, setSearchText] = useState('');
  const [locations, setLocations] = useState<RowData[]>(INITIAL_LOCATIONS);

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

  const toggleFavorite = useCallback((id: string) => {
    setLocations(prev =>
      prev.map(loc =>
        loc.id === id ? { ...loc, isFavorite: !loc.isFavorite } : loc
      )
    );
  }, []);

  const handleSelectDestination = useCallback(
    (id: string) => {
      const item = locations.find(loc => loc.id === id);
      if (item && onSelectDestination) {
        onSelectDestination({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
        });
      }
    },
    [locations, onSelectDestination]
  );

  const handleHomePress = useCallback(() => {
    onSelectDestination?.({
      id: 'home',
      title: 'Home',
      subtitle: 'Set location',
    });
  }, [onSelectDestination]);

  const handleWorkPress = useCallback(() => {
    onSelectDestination?.({
      id: 'work',
      title: 'Work',
      subtitle: 'Set location',
    });
  }, [onSelectDestination]);

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
      <View style={styles.inputRow}>
        <Image
          source={require('../assets/images/search_activate.png')}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchText}
          onChangeText={handleSearchChange}
          placeholder="Search Here"
          placeholderTextColor="#A0A0A0"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={searchText.length > 0 ? handleClearSearch : handleCollapse}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickRow}>
        <QuickItem
          title="Home"
          subtitle="Set location"
          icon={require('../assets/images/search_house.png')}
          onPress={handleHomePress}
        />
        <QuickItem
          title="Work"
          subtitle="Set location"
          icon={require('../assets/images/search_job.png')}
          style={styles.workItem}
          onPress={handleWorkPress}
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
    </View>
  );
}

export default memo(SearchBar);

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  expanded: { backgroundColor: '#FCFCFC', borderRadius: 22, padding: 16 },
  searchIcon: { width: 18, height: 18, marginRight: 10, opacity: 0.9 },
  placeholder: { color: '#A0A0A0', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F6F6F6',
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 0, color: '#1C1C1C' },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7878801F',
    marginLeft: 8,
  },
  clear: { fontSize: 14, color: '#3C3C4399', marginTop: -1 },
  quickRow: { flexDirection: 'row', marginBottom: 10 },
  quickItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  workItem: { marginLeft: -80 },
  quickCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickCircleIcon: {
    width: 20,
    height: 17,
    resizeMode: 'contain',
    opacity: 0.9,
  },
  quickTextWrap: { flex: 1 },
  quickTitle: { fontWeight: '400', fontSize: 12, color: '#000000' },
  sub: { fontSize: 8, color: '#878585', marginTop: 1 },
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sortText: {
    color: '#878585',
    fontWeight: '400',
    fontSize: 12,
    marginRight: 6,
  },
  sortChevron: { color: '#878585', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  starTouchable: { padding: 8 },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowTextContainer: { flex: 1 },
  rowText: { fontSize: 12, fontWeight: '400', color: '#1C1C1C' },
  star: { width: 18, height: 18 },
  starIcon: { width: 18, height: 18 },
  placeSub: { fontSize: 8, color: '#878585', marginTop: 1 },
  milesText: {
    color: '#878585',
    fontWeight: '400',
    fontSize: 12,
    marginLeft: 8,
  },
  emptyText: { color: '#888', paddingVertical: 8 },
});
