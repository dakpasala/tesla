import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showCarPreview, setShowCarPreview] = useState(false);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Profile"
          onPress={() => navigation.navigate('Profile')}
        />

        <View style={{ height: 20 }} />

        <Button
          title={showCarPreview ? 'Hide Car Sub-view' : 'Show Car Sub-view'}
          onPress={() => setShowCarPreview(prev => !prev)}
        />

        <View style={{ height: 12 }} />

        {showCarPreview ? (
          // Lazy-load
          <React.Suspense fallback={<Text>Loading sub-view...</Text>}>
            <CarPreviewHost />
          </React.Suspense>
        ) : null}
      </View>
    </ScrollView>
  );
}

function CarPreviewHost() {
  // Avoiding extra bundle cost unless we use the preview
  const CarSubView = require('../components/SubViews/CarSubView').default;

  return (
    <View style={{ width: '100%', padding: 16 }}>
      <CarSubView
        onSelect={(item: any) => console.log('Car selected (preview):', item)}
      />
    </View>
  );
}
