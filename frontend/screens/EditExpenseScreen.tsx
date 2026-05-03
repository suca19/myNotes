import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getExpenses, updateExpense } from '../api/client';

const CATEGORIES = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Other'];

interface Expense {
  id: number;
  amount: number;
  place: string;
  category: string;
  date: string;
  notes?: string;
}

export const EditExpenseScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { id } = route.params;
  const [amount, setAmount] = useState('');
  const [place, setPlace] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpense();
  }, []);

  const loadExpense = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();
      const expense = response.data.expenses.find((e: Expense) => e.id === id);
      if (expense) {
        setAmount(expense.amount.toString());
        setPlace(expense.place);
        setCategory(expense.category);
        setDate(expense.date);
        setNotes(expense.notes || '');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!amount || !place || !category || !date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateExpense(id, {
        amount: parseFloat(amount),
        place,
        category,
        date,
        notes: notes || undefined,
      });
      Alert.alert('Success', 'Expense updated', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update expense');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Place *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Starbucks, Grocery Store"
            value={place}
            onChangeText={setPlace}
            editable={!saving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  category === cat && styles.categoryBtnActive,
                ]}
                onPress={() => setCategory(cat)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.categoryBtnText,
                    category === cat && styles.categoryBtnTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            editable={!saving}
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional notes"
            value={notes}
            onChangeText={setNotes}
            editable={!saving}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleUpdateExpense}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Expense</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    paddingLeft: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  categoryBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryBtnTextActive: {
    color: '#fff',
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
