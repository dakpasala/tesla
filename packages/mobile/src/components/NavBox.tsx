import React from 'react';
import { View, StyleSheet, Image, Pressable, Text, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';


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
    const { activeTheme } = useTheme();
    const c = activeTheme.colors;

    return (
      <View style={[styles.inputContainer, { backgroundColor: c.card, borderColor: c.border }]}>

        <View style={styles.inputRow}>
        <Image source={currentLocationIcon} style={[styles.icon, { tintColor: c.text.primary }]} />
        <TextInput
          style={[styles.input, { color: c.text.primary }]}
          onChangeText={onCurrentLocationChange}
          value={currentLocation}
          placeholder="Current Location"
          keyboardType="default"
          placeholderTextColor={c.text.secondary}
        />
        </View>
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <View style={styles.inputRow}>
            <Image source={destinationIcon} style={[styles.icon, { tintColor: c.text.primary }]} />
            <TextInput
            style={[styles.input, { color: c.text.primary }]}
            onChangeText={onDestinationChange}
            value={destination}
            placeholder="Destination"
            keyboardType="default"
            placeholderTextColor={c.text.secondary}
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