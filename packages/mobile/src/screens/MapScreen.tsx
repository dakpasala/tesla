import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView from 'react-native-maps';

export default function MapScreen() {
  // temp click handler to show the buttons do work ( we can later make it trigger some changes )
  const handlePress = (id: string) => {
    console.log(`temp button ${id} pressed`);
  };

  return (
    <View style={styles.container}>
      {/* full screen map background */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
      {/* temporarily buttons floating on top of the map */}
      <View style={styles.buttonsContainer}>
        <Pressable style={styles.button} onPress={() => handlePress('a')}>
          <Text>temp btn a</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => handlePress('b')}>
          <Text>temp btn b</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => handlePress('c')}>
          <Text>temp btn c</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    marginHorizontal: 6,
    borderRadius: 8,
  },
});
