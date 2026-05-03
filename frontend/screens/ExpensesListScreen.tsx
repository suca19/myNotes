import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { getExpenses, deleteExpense } from '../api/client';

interface Expense {
  id: number;
  amount: number;
  place: string;
  category: string;
  date: string;
  notes?: string;
}

export const ExpensesListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadExpenses();
    });
    return unsubscribe;
  }, [navigation]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();
      setExpenses(response.data.expenses || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteExpense(id);
            setExpenses(expenses.filter((e) => e.id !== id));
            Alert.alert('Success', 'Expense deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseInfo}>
        <View>
          <Text style={styles.place}>{item.place}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.expenseActions}>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditExpense', { id: item.id })}
          >
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <>
          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>Tap "+" to add your first expense</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseInfo: {
    flex: 1,
  },
  place: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
  expenseActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 14,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#FFE0E0',
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
