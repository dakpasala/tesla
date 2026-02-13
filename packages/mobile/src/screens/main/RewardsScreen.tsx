// packages/mobile/src/screens/main/RewardsScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { getUserIncentives, getUserBalance } from '../../services/users';
import { useAuth } from '../../context/AuthContext';

const newBike = require('../../assets/icons/new/newBike.png');
const newBus = require('../../assets/icons/new/newBus.png');
const newCar = require('../../assets/icons/new/newCar.png');
const newShuttle = require('../../assets/icons/new/newShuttle.png');

export default function RewardsScreen() {
  const navigation = useNavigation();

  const { userId } = useAuth();

  const [balance, setBalance] = React.useState<number>(0);
  const [incentives, setIncentives] = React.useState<
    Array<{
      id: number;
      transit_type: string;
      amount: number;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadRewards() {
      if (!userId) return;
      try {
        const [balanceRes, incentivesRes] = await Promise.all([
          getUserBalance(userId),
          getUserIncentives(userId),
        ]);

        setBalance(balanceRes.balance);
        setIncentives(incentivesRes as typeof incentives);
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
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top nav row (Back + Settings) */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backLink}
            activeOpacity={0.7}
          >
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backLabel}>Settings</Text>
          </TouchableOpacity>

          {/* spacer to keep left-aligned feel (optional) */}
          <View style={{ width: 24 }} />
        </View>

        {/* Big screen title */}
        <Text style={styles.pageTitle}>Rewards</Text>

        {/* Main Card */}
        <LinearGradient
          colors={['#111', '#333']}
          style={styles.mainCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.mainCardInner}>
            <View>
              <Text style={styles.cardLabel}>TOTAL POINTS</Text>
              <Text style={styles.cardValue}>
                {loading ? '—' : `${balance} pts`}
              </Text>
              <Text style={styles.cardSub}>
                Keep using sustainable transport to earn more!
              </Text>
            </View>
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
            const type = inc.transit_type;

            const icon =
              type === 'shuttle'
                ? newShuttle
                : type === 'bus'
                  ? newBus
                  : type === 'car'
                    ? newCar
                    : newBike;

            const title =
              type === 'shuttle'
                ? 'Shuttle'
                : type === 'bus'
                  ? 'Bus'
                  : type === 'car'
                    ? 'Car'
                    : 'Biking';

            const dateText = new Date(inc.created_at)
              .toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
              .toUpperCase();

            return (
              <View key={inc.id} style={styles.historyCard}>
                <Image source={icon} style={styles.historyIconImg} />

                <View style={styles.historyMid}>
                  <Text style={styles.historyDateText}>{dateText}</Text>
                  <Text style={styles.historyTitleText}>{title}</Text>
                </View>

                <Text style={styles.historySavedText}>
                  SAVED {inc.amount}KG
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

  content: {
    paddingHorizontal: 40,
    paddingTop: 0,
    paddingBottom: 24,
  },

  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  backChevron: {
    fontSize: 22,
    lineHeight: 22,
    marginRight: 6,
    color: '#E83F3F',
  },

  backLabel: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    color: '#E83F3F',
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '600',
    color: '#000',
    marginTop: -5,
    marginBottom: 20,
  },

  mainCard: {
    width: 328,
    height: 165.13,

    borderRadius: 28,
    overflow: 'hidden',

    marginBottom: 20,

    shadowColor: '#1C1C1C',
  },

  mainCardInner: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardLabel: {
    color: '#FCFCFC',
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
  },
  cardValue: {
    color: '#FCFCFC',

    fontSize: 43,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 15,
    color: '#FCFCFC',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  historyCard: {
    width: 329,
    minHeight: 67,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    backgroundColor: '#FFF',

    flexDirection: 'row',
    alignItems: 'center',

    padding: 20,
    marginBottom: 20,
  },

  historyIconImg: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginRight: 15,
  },

  historyMid: {
    flex: 1,
  },

  historyDateText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    marginBottom: 4,
  },

  historyTitleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },

  historySavedText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#1A9C30',
  },
});
