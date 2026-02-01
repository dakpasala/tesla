import React from 'react';
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
};

type RowItemProps = {
  title: string;
  subtitle: string;
  miles: string;
  starred?: boolean;
  onPressRow?: () => void;
  onToggleStar?: () => void;
};

function RowItem({
  title,
  subtitle,
  miles,
  starred = false,
  onPressRow,
  onToggleStar,
}: RowItemProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={onPressRow}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.rowLeft}>
        <TouchableOpacity
          onPress={onToggleStar}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={
            starred ? 'Remove from favorites' : 'Add to favorites'
          }
        >
          <View style={styles.star}>
            {starred ? (
              <FavoriteIcon />
            ) : (
              <Image
                source={require('../assets/images/fav_icon_deactivate.png')}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>

        <View>
          <Text style={styles.rowText}>{title}</Text>
          <Text style={styles.placeSub}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.milesText}>{miles}</Text>
    </TouchableOpacity>
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
      {/* Grey circle with ONLY the logo inside */}
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

export default function SearchBar({
  value = '',
  onChangeText,
  expanded = false,
  onExpand,
  onCollapse,
  onSelectDestination,
}: Props) {
  const [sort, setSort] = React.useState<'A-Z' | 'Z-A'>('A-Z');

  const [favorites, setFavorites] = React.useState<RowData[]>([
    {
      id: 'fav-1',
      title: 'Tesla Deer Creek',
      subtitle: '1501 Page Mill Rd, Palo Alto',
      miles: '2.5 miles',
    },
    {
      id: 'fav-2',
      title: 'Tesla Page Mill',
      subtitle: '1501 Page Mill Rd, Palo Alto',
      miles: '2.5 miles',
    },
    {
      id: 'fav-3',
      title: 'Tesla Page Mill',
      subtitle: '1501 Page Mill Rd, Palo Alto',
      miles: '2.5 miles',
    },
  ]);

  const [offices, setOffices] = React.useState<RowData[]>([
    {
      id: 'off-1',
      title: 'Tesla Page Mill',
      subtitle: '1501 Page Mill Rd, Palo Alto',
      miles: '2.5 miles',
    },
    {
      id: 'off-2',
      title: 'Tesla Page Mill',
      subtitle: '1501 Page Mill Rd, Palo Alto',
      miles: '2.5 miles',
    },
  ]);

  // - If item is in favorites: unstar -> move back to All Offices
  // - If item is in offices: star -> move to Favorites
  const toggleFavorite = React.useCallback(
    (item: RowData) => {
      setFavorites(prevFavs => {
        const isFav = prevFavs.some(f => f.id === item.id);

        if (isFav) return prevFavs.filter(f => f.id !== item.id);

        return [item, ...prevFavs];
      });

      setOffices(prevOffices => {
        const inOffices = prevOffices.some(o => o.id === item.id);

        if (inOffices) {
          return prevOffices.filter(o => o.id !== item.id);
        }

        return [...prevOffices, item];
      });
    },
    [favorites]
  );

  const sortedOffices = React.useMemo(() => {
    const copy = [...offices];
    copy.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'Z-A') copy.reverse();
    return copy;
  }, [offices, sort]);

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.collapsed}
        onPress={onExpand}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open search"
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
          value={value}
          onChangeText={onChangeText}
          placeholder="Search Here"
          placeholderTextColor="#A0A0A0"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={onCollapse}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel="Close search"
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
        />
        <QuickItem
          title="Work"
          subtitle="Set location"
          icon={require('../assets/images/search_job.png')}
          style={{ marginLeft: -100 }}
        />
      </View>

      {/* favorites */}
      <Text style={styles.section}>My Favorites</Text>
      {favorites.length === 0 ? (
        <Text style={styles.emptyText}>No favorites yet</Text>
      ) : (
        favorites.map(item => (
          <RowItem
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            miles={item.miles}
            starred
            onPressRow={() =>
              onSelectDestination?.({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
              })
            }
            onToggleStar={() => toggleFavorite(item)}
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

      {sortedOffices.map(item => (
        <RowItem
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          miles={item.miles}
          starred={false}
          onPressRow={() =>
            onSelectDestination?.({
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
            })
          }
          onToggleStar={() => toggleFavorite(item)}
        />
      ))}
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
    backgroundColor: '#FCFCFC',
    marginBottom: 12,
  },

  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    color: '#A0A0A0',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  rowText: {
    fontSize: 12,
    fontWeight: 400,
    color: '#1C1C1C',
  },

  star: {
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
  },

  emptyText: {
    color: '#888',
    paddingVertical: 8,
  },
});
