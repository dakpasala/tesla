import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showRideSharePreview, setShowRideSharePreview] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Profile"
          onPress={() => navigation.navigate('Profile')}
        />

        <View style={{ height: 20 }} />

        <Button
          title={
            showRideSharePreview
              ? 'Hide Rideshare Sub-view'
              : 'Show Rideshare Sub-view'
          }
          onPress={() => setShowRideSharePreview(prev => !prev)}
        />

        <View style={{ height: 12 }} />

        {showRideSharePreview ? (
          <React.Suspense fallback={<Text>Loading sub-view...</Text>}>
            <RideSharePreviewHost />
          </React.Suspense>
        ) : null}
      </View>
    </View>
  );
}

function RideSharePreviewHost() {
  const RideShareSubView =
    require('../components/SubViews/RideShareSubView').default;

  return (
    <View style={{ width: '100%', padding: 16 }}>
      <RideShareSubView
        onSelect={(item: any) =>
          console.log('Rideshare selected (preview):', item)
        }
      />
    </View>
  );
}
