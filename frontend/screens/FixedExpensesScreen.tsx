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
  Modal,
  TextInput,
} from 'react-native';
import {
  getFixedExpenses,
  deleteFixedExpense,
  createFixedExpense,
  FixedExpenseInput,
} from '../api/client';

interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  due_day: number;
  notes?: string;
}

const FREQUENCIES = ['weekly', 'monthly', 'yearly'];

export const FixedExpensesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FixedExpenseInput>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: 'Utilities',
    due_day: 1,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

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
      const response = await getFixedExpenses();
      setExpenses(response.data.fixedExpenses || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load fixed expenses');
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
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteFixedExpense(id);
            setExpenses(expenses.filter((e) => e.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!form.name || form.amount <= 0) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    try {
      setSaving(true);
      await createFixedExpense(form);
      setModalVisible(false);
      setForm({ name: '', amount: 0, frequency: 'monthly', category: 'Utilities', due_day: 1 });
      await loadExpenses();
    } catch {
      Alert.alert('Error', 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const renderExpense = ({ item }: { item: FixedExpense }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>{item.category} • Due day {item.due_day}</Text>
        <Text style={styles.frequency}>{item.frequency}</Text>
      </View>
      <View style={styles.actions}>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Text>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
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
              <View style={styles.center}>
                <Text style={styles.emptyText}>No fixed expenses yet</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Fixed Expense</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Netflix"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currency}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={form.amount.toString()}
                  onChangeText={(text) => setForm({ ...form, amount: parseFloat(text) || 0 })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency *</Text>
              <View style={styles.buttonGroup}>
                {FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.freqBtn,
                      form.frequency === freq && styles.freqBtnActive,
                    ]}
                    onPress={() => setForm({ ...form, frequency: freq as any })}
                  >
                    <Text
                      style={[
                        styles.freqBtnText,
                        form.frequency === freq && styles.freqBtnTextActive,
                      ]}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Due Day (1-31) *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={form.due_day.toString()}
                onChangeText={(text) => setForm({ ...form, due_day: parseInt(text) || 1 })}
                keyboardType="number-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={styles.buttonText}>{saving ? 'Adding...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  detail: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  frequency: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  deleteBtn: {
    padding: 4,
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
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeBtn: {
    fontSize: 24,
    color: '#999',
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    paddingLeft: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    alignItems: 'center',
  },
  freqBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  freqBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  freqBtnTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
