// packages/mobile/src/screens/auth/LoginScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Hardcoded credentials
const CREDENTIALS = {
  'dpasala@calpoly.edu': { password: 'test123', userId: 1, isAdmin: false },
  'kbeltr03@calpoly.edu': { password: 'test123', userId: 2, isAdmin: false },
  'admin@tesla.com': { password: 'admin123', userId: 999, isAdmin: true },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = CREDENTIALS[trimmedEmail as keyof typeof CREDENTIALS];

    if (!user) {
      Alert.alert('Login Failed', 'Invalid email or password');
      return;
    }

    if (user.password !== password) {
      Alert.alert('Login Failed', 'Invalid email or password');
      return;
    }

    setLoading(true);
    try {
      await login(user.userId, user.isAdmin);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text.primary }]}>Tesla</Text>
            <Text style={[styles.subtitle, { color: c.text.secondary }]}>Commute App</Text>
          </View>

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text.primary, backgroundColor: c.card }]}
            placeholder="Email"
            placeholderTextColor={c.text.secondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text.primary, backgroundColor: c.card }]}
            placeholder="Password"
            placeholderTextColor={c.text.secondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled, { backgroundColor: c.primary }]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hintText, { color: c.text.secondary }]}>
            User: dpasala@calpoly.edu / test123{'\n'}
            Admin: admin@tesla.com / admin123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFCFC' },
  inner: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 36, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8E8E93' },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#B0D4FF' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  hintText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});