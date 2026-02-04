import { Alert } from 'react-native';
import { getUserLocation } from '../src/services/location';

export async function runLocationTest() {
  Alert.alert('DEBUG', 'runLocationTest started');

  try {
    const loc = await getUserLocation();
    Alert.alert(
      'LOCATION RESULT',
      JSON.stringify(loc, null, 2)
    );
  } catch (err: any) {
    Alert.alert('LOCATION ERROR', String(err));
  }
}