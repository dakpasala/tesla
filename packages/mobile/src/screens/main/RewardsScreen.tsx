// packages/mobile/src/screens/main/RewardsScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { getUserIncentives, getUserBalance } from '../../services/users';

export default function RewardsScreen() {
  const navigation = useNavigation();

  const USER_ID = 1; // TODO: replace with auth context

  const [balance, setBalance] = React.useState<number>(0);
  const [incentives, setIncentives] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadRewards() {
      try {
        const [balanceRes, incentivesRes] = await Promise.all([
          getUserBalance(USER_ID),
          getUserIncentives(USER_ID),
        ]);

        setBalance(balanceRes.balance);
        setIncentives(incentivesRes);
      } catch (err) {
        console.error('Failed to load rewards', err);
      } finally {
        setLoading(false);
      }
    }

    loadRewards();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Card */}
        <LinearGradient
          colors={['#111', '#333']}
          style={styles.mainCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View>
            <Text style={styles.cardLabel}>TOTAL POINTS</Text>
            <Text style={styles.cardValue}>
              {loading ? '—' : `${balance} pts`}
            </Text>
            <Text style={styles.cardSub}>
              Keep using sustainable transport to earn more!
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <Text style={styles.leafIcon}>🌿</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionHeader}>History</Text>

        {loading && (
          <Text style={{ textAlign: 'center', color: '#666' }}>
            Loading reward history…
          </Text>
        )}

        {!loading &&
          incentives.map(inc => {
            const isShuttle = inc.transit_type === 'shuttle';

            return (
              <View key={inc.id} style={styles.historyItem}>
                <View
                  style={[
                    styles.historyIcon,
                    {
                      backgroundColor: isShuttle ? '#E8F5E9' : '#E3F2FD',
                    },
                  ]}
                >
                  <Text style={styles.historyEmoji}>
                    {isShuttle ? '🚌' : '🚲'}
                  </Text>
                </View>

                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>
                    {isShuttle ? 'Shuttle Trip' : 'Bike Commute'}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(inc.created_at).toLocaleString()}
                  </Text>
                </View>

                <Text style={styles.historyPoints}>
                  +{inc.amount} pts
                </Text>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 20,
  },
  mainCard: {
    padding: 24,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSub: {
    color: '#ccc',
    fontSize: 13,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafIcon: {
    fontSize: 28,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyEmoji: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  historyDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34A853',
  },
});
