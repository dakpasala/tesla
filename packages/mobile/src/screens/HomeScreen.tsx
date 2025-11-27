// import React, { useMemo, useRef } from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RootStackParamList } from '../navigation/types';
// import BottomSheet from '@gorhom/bottom-sheet';

// type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// export default function HomeScreen() {
//   const navigation = useNavigation<NavigationProp>();
//   const sheetRef = useRef<BottomSheet>(null);

//   const snapPoints = useMemo(() => ['25%', '50%'], []);

//   return (
//     // <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//     //   <Text>Home Screen</Text>
//     //   <Button
//     //     title="Go to Profile"
//     //     onPress={() => navigation.navigate('Profile')}
//     //   />
//     // </View>

//     <View style={styles.container}>
//       <Text style={styles.title}>Home Screen</Text>
//       <Button
//         title="Go to Profile"
//         onPress={() => navigation.navigate('Profile')}
//       />
//       <Button
//         title="Open Bottom Sheet"
//         onPress={() => sheetRef.current?.expand()}
//       />

//       <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints}>
//         <View style={styles.sheetContent}>
//           <Text>This is a bottom sheet 🎉</Text>
//           <Button title="Close" onPress={() => sheetRef.current?.close()} />
//         </View>
//       </BottomSheet>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   title: { fontSize: 20, marginBottom: 20 },
//   sheetContent: { flex: 1, alignItems: 'center', padding: 20 },
// });

import React, { useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Modalize } from 'react-native-modalize';

import BikeScreen from '../screens/Bike';
import BusScreen from '../screens/Bus';
import TrainScreen from '../screens/Train';
import WalkScreen from '../screens/Walk';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const modalRef = useRef<Modalize>(null);
  const [screen, setScreen] = useState<"home" | "bike" | "bus" | "train" | "walk">("home");

  return (
    <View style={styles.container}>


      <Modalize modalStyle={styles.modalScreen} alwaysOpen={340} modalHeight={700} ref={modalRef}>

        <View style={styles.iconBar}>
          

          <Pressable onPress={() => setScreen("bike")}>
            <Image
              source={screen === "bike" ? require('../assets/bikeActive.png') : require('../assets/bike.png')}
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen("bus")}>
            <Image
              source = {screen === "bus" ? require('../assets/busActive.png') : require('../assets/bus.png')}
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen("home")}>
            <Image
              source={screen === "home" ? require('../assets/carActive.png') : require('../assets/car.png')}
              style={styles.icon}
            />
          </Pressable>


          <Pressable onPress={() => setScreen("train")}>
            <Image
              source={screen === "train" ? require('../assets/trainActive.png') : require('../assets/train.png')}
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen("walk")}>
            <Image
              source={screen === "walk" ? require('../assets/walkActive.png') : require('../assets/walk.png')}
              style={styles.icon}
            />
          </Pressable>



        </View>


        <View style={{ flex: 1 }}>
          {screen === "home" && (
            <View style={styles.container}>
              {/* car screen stuff */}  
              <Text>CAR</Text>
            </View>
          )}

          {screen === "bike" && <BikeScreen />}

          {screen === "bus" && <BusScreen />
          // (<BusScreen goBack={() => setScreen("home")} />)
          }

          {screen === "train" && <TrainScreen />}

          {screen === "walk" && <WalkScreen />}
        </View>
        

      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
   },
  title: { fontSize: 20, marginBottom: 20 },
  modalScreen: {
    backgroundColor: '#E0E0E0'
  }, 
  iconBar: {
    flexDirection: "row",
    marginTop: 15
  },
  icon: {
    width: 50, height: 50, marginLeft: 25, borderRadius: 40
  }
});
