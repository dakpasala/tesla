import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ShuttleListItem from './ShuttleListItem';

// TODO fetch from API

const HARDCODED_SHUTTLES = [
  {
    id: '1',
    name: 'Tesla HQ Deer Creek Shuttle A',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'red' as const,
  },
  {
    id: '2',
    name: 'Tesla HQ Deer Creek Shuttle B',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'blue' as const,
  },
  {
    id: '3',
    name: 'Tesla HQ Deer Creek Shuttle C',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'green' as const,
  },
  {
    id: '4',
    name: 'Tesla HQ Deer Creek Shuttle D',
    route: 'Stevens Creek / Albany → Palo Alto BART',
    color: 'orange' as const,
  },
];

export default function ActiveShuttlesList() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {HARDCODED_SHUTTLES.map((shuttle, idx) => (
        <ShuttleListItem
          key={shuttle.id}
          title={shuttle.name}
          subtitle={shuttle.route}
          statusColor={shuttle.color}
          showSeparator={idx < HARDCODED_SHUTTLES.length - 1}
          onPress={() =>
            navigation.navigate('ShuttleReports', {
              shuttleName: shuttle.name,
            })
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 30,
  },
});
