import React from 'react';
import { View, StyleSheet, Image, Pressable, Text, TextInput } from 'react-native';


interface NavBoxProps {
    currentLocation: string;
    destination: string;
    currentLocationIcon: any;
    destinationIcon: any;
    onCurrentLocationChange: (text: string) => void;
    onDestinationChange: (text: string) => void;
  }
  
  export default function NavBox({ 
    currentLocation, 
    destination, 
    currentLocationIcon,
    destinationIcon,
    onCurrentLocationChange,
    onDestinationChange 
  }: NavBoxProps) {
    return (
      <View style={styles.inputContainer}>


        <View style={styles.inputRow}>
        <Image source={currentLocationIcon} style={styles.icon} />
        <TextInput
          style={styles.input}
          onChangeText={onCurrentLocationChange}
          value={currentLocation}
          placeholder="Current Location"
          keyboardType="default"
          placeholderTextColor="#999999"
        />
        </View>
        <View style={styles.divider} />
        <View style={styles.inputRow}>
            <Image source={destinationIcon} style={styles.icon} />
            <TextInput
            style={styles.input}
            onChangeText={onDestinationChange}
            value={destination}
            placeholder="Destination"
            keyboardType="default"
            placeholderTextColor="#999999"
            />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    inputContainer: {
      width: 321,
      height: 90,
      alignSelf: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#00000',
      borderRadius: 10,
      justifyContent: 'center',
      overflow: 'hidden',
    //   backgroundColor: '#1C1C1C'
    },
    inputRow: {
      flexDirection: 'row',      
      alignItems: 'center',      
      height: 45,          
    },
    icon: {
      width: 25,           
      height: 25,
      marginLeft: 10,            
      marginRight: 5,            
    },
    input: {
      flex: 1,                 
      height: 45,
      padding: 10,
      textAlignVertical: 'center',
      color: '#FFFFFF'
    },
    divider: {
      height: 1,
      backgroundColor: '#000000',
      marginHorizontal: 10,
    },
  });
