import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from 'react-native';

type CarItem = {
  id: string;
  name: string;
  description?: string;
};

interface CarSubViewProps {
  initialItems?: CarItem[];
  onSelect?: (item: CarItem) => void;
}

const DEFAULT_ITEMS: CarItem[] = [
  { id: '1', name: 'Sedan', description: '4 seats, comfortable' },
  { id: '2', name: 'Hatchback', description: 'Compact city car' },
  { id: '3', name: 'SUV', description: 'Higher clearance' },
  { id: '4', name: 'Electric', description: 'Zero emissions' },
  { id: '5', name: 'Convertible', description: 'Open top' },
  { id: '6', name: 'Minivan', description: 'Extra cargo space' },
];

export default function CarSubView({
  initialItems = DEFAULT_ITEMS,
  onSelect,
}: CarSubViewProps) {
  const renderItem: ListRenderItem<CarItem> = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onSelect && onSelect(item)}
      accessibilityRole="button"
    >
      <Text style={styles.itemTitle}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.itemSubtitle}>{item.description}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Car (Sub-view preview)</Text>
      <FlatList
        data={initialItems}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});
