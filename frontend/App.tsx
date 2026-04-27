import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { healthCheck } from './api/client';

export default function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await healthCheck();
      const data = response.data as { message?: string };
      setBackendStatus(`✅ Connected: ${data.message}`);
    } catch (error) {
      setBackendStatus('❌ Backend not connected');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Expense Tracker</Text>
      <Text style={styles.subtitle}>Your personal finance app</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>Backend Status:</Text>
        <Text style={styles.statusValue}>{backendStatus}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkBackend}>
        <Text style={styles.buttonText}>Check Backend</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 40,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});