// import React from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';
import React, { useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Modalize } from 'react-native-modalize';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;



export default function WalkScreen() {
    const navigation = useNavigation<NavigationProp>();
    const modalRef = useRef<Modalize>(null);
    const [screen, setScreen] = useState<"walk" | "home">("walk");
  return (

    <View style={styles.container}>
      <Text>WALK</Text>
        </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1, 
    // alignItems: 'center', 
    // justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20
  },
  modalScreen: {
    backgroundColor: '#E0E0E0'
  }
});
