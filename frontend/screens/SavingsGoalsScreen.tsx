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
import { getGoals, deleteGoal, createGoal, GoalInput } from '../api/client';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  notes?: string;
}

export const SavingsGoalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<GoalInput>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGoals();
    });
    return unsubscribe;
  }, [navigation]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await getGoals();
      setGoals(response.data.goals || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteGoal(id);
            setGoals(goals.filter((g) => g.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!form.name || form.target_amount <= 0 || !form.target_date) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    try {
      setSaving(true);
      await createGoal(form);
      setModalVisible(false);
      setForm({ name: '', target_amount: 0, current_amount: 0, target_date: '', notes: '' });
      await loadGoals();
    } catch (err) {
      Alert.alert('Error', 'Failed to add goal');
    } finally {
      setSaving(false);
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const progress = getProgress(item);
    const remaining = item.target_amount - item.current_amount;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>Target: {new Date(item.target_date).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteBtn}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amounts}>
          <View>
            <Text style={styles.amountLabel}>Current</Text>
            <Text style={styles.amount}>${item.current_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <View style={styles.rightAmount}>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={styles.amount}>${item.target_amount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={styles.stat}>{progress.toFixed(0)}% complete</Text>
          <Text style={styles.stat}>${remaining.toFixed(2)} remaining</Text>
        </View>

        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <>
          <FlatList
            data={goals}
            renderItem={renderGoal}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No savings goals yet</Text>
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
            <Text style={styles.modalTitle}>Add Savings Goal</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Vacation"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount *</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currency}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={form.target_amount.toString()}
                  onChangeText={(text) => setForm({ ...form, target_amount: parseFloat(text) || 0 })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currency}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={form.current_amount?.toString() || '0'}
                  onChangeText={(text) => setForm({ ...form, current_amount: parseFloat(text) || 0 })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-12-31"
                value={form.target_date}
                onChangeText={(text) => setForm({ ...form, target_date: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes"
                value={form.notes || ''}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={styles.buttonText}>{saving ? 'Adding...' : 'Add Goal'}</Text>
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteBtn: {
    fontSize: 18,
    padding: 4,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  amountLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rightAmount: {
    alignItems: 'flex-end',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  stat: {
    fontSize: 12,
    color: '#666',
  },
  notes: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
  textArea: {
    textAlignVertical: 'top',
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
