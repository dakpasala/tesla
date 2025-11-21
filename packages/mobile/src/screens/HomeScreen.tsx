import React, { useMemo, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import BottomSheet from '@gorhom/bottom-sheet';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['25%', '50%'], []);

  return (
    // <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    //   <Text>Home Screen</Text>
    //   <Button
    //     title="Go to Profile"
    //     onPress={() => navigation.navigate('Profile')}
    //   />
    // </View>

    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile')}
      />
      <Button
        title="Open Bottom Sheet"
        onPress={() => sheetRef.current?.expand()}
      />

      <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints}>
        <View style={styles.sheetContent}>
          <Text>This is a bottom sheet 🎉</Text>
          <Button title="Close" onPress={() => sheetRef.current?.close()} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 20 },
  sheetContent: { flex: 1, alignItems: 'center', padding: 20 },
});
