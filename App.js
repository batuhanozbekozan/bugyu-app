import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import GardenScreen from './screens/GardenScreen';
import AddPlantScreen from './screens/AddPlantScreen';
import PlantDetailScreen from './screens/PlantDetailScreen';
import CareLogScreen from './screens/CareLogScreen';
import ProfileScreen from './screens/ProfileScreen';

import { PlantContext } from './context/PlantContext';
import { COLORS, FONTS } from './theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function GardenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Garden" component={GardenScreen} />
      <Stack.Screen name="AddPlant" component={AddPlantScreen} />
      <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
      <Stack.Screen name="CareLog" component={CareLogScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused }) {
  const icons = {
    Bahçem: focused ? '🌿' : '🪴',
    Profil: focused ? '👤' : '👤',
  };
  return (
    <Text style={{ fontSize: 22 }}>{icons[name]}</Text>
  );
}

export default function App() {
  const [plants, setPlants] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPlants();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (loaded) savePlants();
  }, [plants]);

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
  }

  async function loadPlants() {
    try {
      const data = await AsyncStorage.getItem('bugyu_plants');
      if (data) setPlants(JSON.parse(data));
    } catch (e) {}
    setLoaded(true);
  }

  async function savePlants() {
    try {
      await AsyncStorage.setItem('bugyu_plants', JSON.stringify(plants));
    } catch (e) {}
  }

  async function scheduleWaterNotification(plant) {
    await Notifications.cancelScheduledNotificationAsync(plant.id + '_water').catch(() => {});
    const trigger = new Date();
    trigger.setDate(trigger.getDate() + plant.wateringDays);
    trigger.setHours(9, 0, 0);

    await Notifications.scheduleNotificationAsync({
      identifier: plant.id + '_water',
      content: {
        title: `${plant.name} susamış! 🌿`,
        body: `${plant.nickname || plant.name} bitkini sulamayı unutma.`,
        sound: true,
      },
      trigger,
    });
  }

  function addPlant(plant) {
    const newPlant = { ...plant, id: Date.now().toString(), addedAt: new Date().toISOString(), careLog: [] };
    setPlants(prev => [...prev, newPlant]);
    scheduleWaterNotification(newPlant);
    return newPlant;
  }

  function updatePlant(id, updates) {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  function deletePlant(id) {
    setPlants(prev => prev.filter(p => p.id !== id));
    Notifications.cancelScheduledNotificationAsync(id + '_water').catch(() => {});
  }

  function logCare(plantId, type) {
    const entry = { type, date: new Date().toISOString() };
    setPlants(prev => prev.map(p => {
      if (p.id !== plantId) return p;
      const updated = { ...p, careLog: [...(p.careLog || []), entry] };
      if (type === 'water') {
        updated.lastWatered = new Date().toISOString();
        scheduleWaterNotification(updated);
      }
      if (type === 'fertilize') updated.lastFertilized = new Date().toISOString();
      return updated;
    }));
  }

  return (
    <PlantContext.Provider value={{ plants, addPlant, updatePlant, deletePlant, logCare }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
            tabBarActiveTintColor: COLORS.green,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
          })}
        >
          <Tab.Screen name="Bahçem" component={GardenStack} />
          <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </PlantContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAFAF7',
    borderTopColor: '#E8EAE0',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 72,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
