import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import RideShareSubView from '../components/SubViews/RideShareSubView';
import TimeSelector from '../components/SubViews/TimeSelector';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CarScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text>CAR</Text>
      <TimeSelector>

      </TimeSelector>
      {/* <RideShareSubView
        onSelect={item => console.log('Selected rideshare:', item)}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
});

