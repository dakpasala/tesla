// Displays a scrollable list of currently active shuttles with name, route, and status color.
// Tapping a shuttle navigates to its detailed reports screen.

import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ShuttleListItem from './ShuttleListItem';

interface ActiveShuttlesListProps {
  shuttles: any[];
}

export default function ActiveShuttlesList({
  shuttles,
}: ActiveShuttlesListProps) {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {shuttles.map((shuttle, idx) => (
        <ShuttleListItem
          key={shuttle.id}
          title={shuttle.name}
          subtitle={shuttle.route}
          statusColor={shuttle.color}
          showSeparator={idx < shuttles.length - 1}
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
