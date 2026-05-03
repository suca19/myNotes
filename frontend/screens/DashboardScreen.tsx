import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getReportSummary } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface SummaryData {
  totalSpent: number;
  currentMonthSpent: number;
  totalExpenses: number;
}

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await getReportSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {user?.email}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : summary ? (
        <>
          <View style={styles.summarySection}>
            <View style={[styles.card, styles.totalCard]}>
              <Text style={styles.cardLabel}>Total Spent</Text>
              <Text style={styles.cardValue}>${summary.totalSpent.toFixed(2)}</Text>
            </View>

            <View style={[styles.card, styles.monthCard]}>
              <Text style={styles.cardLabel}>This Month</Text>
              <Text style={styles.cardValue}>${summary.currentMonthSpent.toFixed(2)}</Text>
            </View>

            <View style={[styles.card, styles.countCard]}>
              <Text style={styles.cardLabel}>Expenses</Text>
              <Text style={styles.cardValue}>{summary.totalExpenses}</Text>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ExpensesList')}
            >
              <Text style={styles.actionIcon}>💸</Text>
              <Text style={styles.actionText}>Expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('FixedExpenses')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Fixed Bills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SavingsGoals')}
            >
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionText}>Savings Goals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reports')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFE0E0',
    borderRadius: 6,
  },
  signOutText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  summarySection: {
    padding: 20,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCard: {
    backgroundColor: '#E3F2FD',
  },
  monthCard: {
    backgroundColor: '#F3E5F5',
  },
  countCard: {
    backgroundColor: '#E8F5E9',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
});
