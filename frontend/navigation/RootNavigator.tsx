import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ExpensesListScreen } from '../screens/ExpensesListScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { EditExpenseScreen } from '../screens/EditExpenseScreen';
import { FixedExpensesScreen } from '../screens/FixedExpensesScreen';
import { SavingsGoalsScreen } from '../screens/SavingsGoalsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  ExpensesList: undefined;
  AddExpense: undefined;
  EditExpense: { id: number };
  FixedExpenses: undefined;
  SavingsGoals: undefined;
  Reports: undefined;
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      gestureEnabled: false,
    }}
  >
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerBackTitle: 'Back',
      headerTintColor: '#3B82F6',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen
      name="ExpensesList"
      component={ExpensesListScreen}
      options={{
        title: 'Expenses',
      }}
    />
    <Stack.Screen
      name="AddExpense"
      component={AddExpenseScreen}
      options={{
        title: 'Add Expense',
      }}
    />
    <Stack.Screen
      name="EditExpense"
      component={EditExpenseScreen}
      options={{
        title: 'Edit Expense',
      }}
    />
    <Stack.Screen
      name="FixedExpenses"
      component={FixedExpensesScreen}
      options={{
        title: 'Fixed Expenses',
      }}
    />
    <Stack.Screen
      name="SavingsGoals"
      component={SavingsGoalsScreen}
      options={{
        title: 'Savings Goals',
      }}
    />
    <Stack.Screen
      name="Reports"
      component={ReportsScreen}
      options={{
        title: 'Reports',
      }}
    />
  </Stack.Navigator>
);

export const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>;
};
