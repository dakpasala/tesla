import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimeSelectorScreenProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
}

type TimeMode = 'now' | 'leave' | 'arrive';

export default function TimeSelectorScreen({
  visible,
  onClose,
  onSelectTime,
}: TimeSelectorScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeMode, setTimeMode] = useState<TimeMode>('leave');

function handleDone() {
  if (timeMode === 'now') {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    onSelectTime(`Now: ${formattedTime}`);  // Add this line
  } else {
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = selectedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    
    const prefix = timeMode === 'leave' ? 'Leave at' : 'Arrive by';
    const timeString = `${prefix}: ${formattedDate} at ${formattedTime}`;
    onSelectTime(timeString);
  }
  onClose();
}

  function handleCancel() {
    setSelectedDate(new Date());
    setTimeMode('leave');
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date & Time</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View> */}

        
          <View style={styles.timeModeContainer}>
            <TouchableOpacity
              style={[styles.timeModeButton, timeMode === 'now' && styles.timeModeButtonActive]}
              onPress={() => setTimeMode('now')}
            >
              <Text style={[styles.timeModeText, timeMode === 'now' && styles.timeModeTextActive]}>
                Now
              </Text>
            </TouchableOpacity>

       

            <TouchableOpacity
              style={[styles.timeModeButton, timeMode === 'leave' && styles.timeModeButtonActive]}
              onPress={() => setTimeMode('leave')}
            >
              <Text style={[styles.timeModeText, timeMode === 'leave' && styles.timeModeTextActive]}>
                Leave
              </Text>
            </TouchableOpacity>



            <TouchableOpacity
              style={[styles.timeModeButton, timeMode === 'arrive' && styles.timeModeButtonActive]}
              onPress={() => setTimeMode('arrive')}
            >
              <Text style={[styles.timeModeText, timeMode === 'arrive' && styles.timeModeTextActive]}>
                Arrive
              </Text>
            </TouchableOpacity>
          </View>


          {timeMode !== 'now' && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="datetime"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
                textColor="#000"
                style={styles.dateTimePicker}
                minuteInterval={1}
              />
            </View>
          )}

          {timeMode === 'now' && (
            <View style={styles.nowTextContainer}>
              <Text style={styles.nowText}>Departure time is now</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      padding: 20,
      paddingBottom: 30,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111',
    },
    closeButton: {
      fontSize: 28,
      color: '#666',
      fontWeight: '300',
    },
  
    timeModeContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 7,  
      marginTop: 15,
    },
    timeModeButton: {
      flex: 1,
      paddingVertical: 4,
      alignItems: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
    },
    timeModeButtonActive: {
      borderColor: '#007AFF',
    },
    timeModeText: {
      fontSize: 13,
      color: '#6A6A6A',
      fontWeight: '500',
    },
    timeModeTextActive: {
      color: '#007AFF',
    },
  
    // Picker
    pickerContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    dateTimePicker: {
      height: 200,
      width: '100%',
    },
  
    nowTextContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    nowText: {
      fontSize: 18,
      color: '#666',
    },
  
    // Buttons
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: '#D9D9D9',
      alignItems: 'center',
      width: 180,
      height: 40,
    },
    cancelButtonText: {
      fontSize: 16,
      color: '#FFFFF',
      fontWeight: '500',

    },
    doneButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: '#454545',
      alignItems: 'center',
      width: 180,
      height: 40,
    },
    doneButtonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '500',
    },
  });
