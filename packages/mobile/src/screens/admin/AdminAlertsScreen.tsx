import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type AlertType = 'info' | 'warning' | 'emergency';

interface RecentAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  sentAt: string;
  recipients: number;
}

const RECENT_ALERTS: RecentAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Lot B Filling Up',
    message: 'Lot B is at 85% capacity',
    sentAt: '2h ago',
    recipients: 450,
  },
  {
    id: '2',
    type: 'info',
    title: 'New Shuttle Route',
    message: 'Route 5 now available from Building C',
    sentAt: '1d ago',
    recipients: 2100,
  },
  {
    id: '3',
    type: 'emergency',
    title: 'Building Evacuation',
    message: 'Fire drill at 2PM today',
    sentAt: '3d ago',
    recipients: 2451,
  },
];

const ALERT_COLORS: Record<AlertType, string> = {
  info: '#4285F4',
  warning: '#FBBC04',
  emergency: '#EA4335',
};

export default function AdminAlertsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [alertType, setAlertType] = useState<AlertType>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const sendAlert = () => {
    // In a real app, this would send the alert
    console.log('Sending alert:', { alertType, title, message });
    setTitle('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Alerts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Compose Alert */}
        <View style={styles.composeCard}>
          <Text style={styles.sectionTitle}>New Alert</Text>

          {/* Alert Type */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(['info', 'warning', 'emergency'] as AlertType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  alertType === type && { backgroundColor: ALERT_COLORS[type] },
                ]}
                onPress={() => setAlertType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    alertType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type === 'info' && 'ℹ️ '}
                  {type === 'warning' && '⚠️ '}
                  {type === 'emergency' && '🚨 '}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Alert title..."
            placeholderTextColor="#999"
          />

          {/* Message */}
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Alert message..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />

          {/* Target */}
          <Text style={styles.label}>Recipients</Text>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientCount}>2,451</Text>
            <Text style={styles.recipientLabel}>All active users</Text>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: ALERT_COLORS[alertType] },
            ]}
            onPress={sendAlert}
          >
            <Text style={styles.sendButtonText}>Send Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts */}
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {RECENT_ALERTS.map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View
              style={[
                styles.alertTypeIndicator,
                { backgroundColor: ALERT_COLORS[alert.type] },
              ]}
            />
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertMeta}>
                {alert.sentAt} • Sent to {alert.recipients} users
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  composeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  recipientInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  recipientCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  recipientLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sendButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  alertTypeIndicator: {
    width: 4,
  },
  alertInfo: {
    flex: 1,
    padding: 14,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alertMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
});
