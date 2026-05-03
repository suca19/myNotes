import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { getReportSummary, getReportByCategory, getReportMonthly } from '../api/client';

interface CategoryData {
  category: string;
  total: string | number;
  count: string | number;
}

interface MonthlyData {
  month: string;
  total: string | number;
  count: string | number;
}

interface Summary {
  totalSpent: number;
  currentMonthSpent: number;
  totalExpenses: number;
}

export const ReportsScreen: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, categoriesRes, monthlyRes] = await Promise.all([
        getReportSummary(),
        getReportByCategory(),
        getReportMonthly(),
      ]);

      setSummary(summaryRes.data);
      setCategories(categoriesRes.data.categories || []);
      setMonthly(monthlyRes.data.monthlyData || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const formatMonth = (monthStr: string) => {
    return new Date(monthStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary Cards */}
      {summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.cardsContainer}>
            <View style={[styles.card, styles.totalCard]}>
              <Text style={styles.cardLabel}>Total Spent</Text>
              <Text style={styles.cardValue}>${summary.totalSpent.toFixed(2)}</Text>
            </View>
            <View style={[styles.card, styles.monthCard]}>
              <Text style={styles.cardLabel}>This Month</Text>
              <Text style={styles.cardValue}>${summary.currentMonthSpent.toFixed(2)}</Text>
            </View>
            <View style={[styles.card, styles.countCard]}>
              <Text style={styles.cardLabel}>Transactions</Text>
              <Text style={styles.cardValue}>{summary.totalExpenses}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {categories.map((cat, idx) => {
            const maxTotal = Math.max(...categories.map((c) => parseFloat(c.total.toString())));
            const percentage = (parseFloat(cat.total.toString()) / maxTotal) * 100;

            return (
              <View key={idx} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <Text style={styles.categoryAmount}>
                    ${parseFloat(cat.total.toString()).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.categoryCount}>{cat.count} transactions</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Monthly Trend */}
      {monthly.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
          {monthly.map((mon, idx) => {
            const maxTotal = Math.max(...monthly.map((m) => parseFloat(m.total.toString())));
            const percentage = (parseFloat(mon.total.toString()) / maxTotal) * 100;

            return (
              <View key={idx} style={styles.monthItem}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthName}>{formatMonth(mon.month)}</Text>
                  <Text style={styles.monthAmount}>
                    ${parseFloat(mon.total.toString()).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.monthBar, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.monthCount}>{mon.count} transactions</Text>
              </View>
            );
          })}
        </View>
      )}

      {categories.length === 0 && monthly.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data yet. Add some expenses to see reports.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  cardsContainer: {
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
  categoryItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  barContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  bar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  categoryCount: {
    fontSize: 11,
    color: '#999',
  },
  monthItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  monthBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  monthCount: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
