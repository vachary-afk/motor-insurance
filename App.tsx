import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Platform } from 'react-native';

import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import PlateEntryScreen from './src/screens/PlateEntryScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import QuoteListScreen from './src/screens/QuoteListScreen';
import PlateEntryScreenV2 from './src/screens/PlateEntryScreenV2';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppContent = () => (
  <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="PlateEntry"
            component={PlateEntryScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="PlateEntryV2"
            component={PlateEntryScreenV2}
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="QuoteList"
            component={QuoteListScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={styles.webPhone}>
          <AppContent />
        </View>
      </View>
    );
  }
  return <AppContent />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webOuter: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPhone: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    overflow: 'hidden',
    // subtle phone-like shadow on desktop
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 60px rgba(0,0,0,0.4)',
    } as any : {}),
  },
});
