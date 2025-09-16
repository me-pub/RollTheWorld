import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Config } from '@/constants/config';
import { resolveDeviceId } from '@/utils/device-id';
import { clearCachedRoll } from '@/utils/local-cache';

export default function SettingsScreen() {
  const theme = useColorScheme() ?? 'light';
  const [deviceId, setDeviceId] = useState<string>('Loading…');

  useEffect(() => {
    resolveDeviceId().then(setDeviceId).catch(() => setDeviceId('unavailable'));
  }, []);

  const handleReset = async () => {
    await clearCachedRoll();
    Alert.alert('Local data cleared', 'Your cached roll info has been removed from this device.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors[theme].backgroundGradient} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <ThemedText type="subtitle">Device</ThemedText>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Device ID (hashed)</ThemedText>
            <ThemedText style={styles.value}>{deviceId.slice(0, 12)}…</ThemedText>
          </View>
          <Pressable style={styles.actionButton} onPress={handleReset}>
            <ThemedText style={styles.actionLabel}>Reset local cache</ThemedText>
          </Pressable>
        </BlurView>
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <ThemedText type="subtitle">Turso</ThemedText>
          <ThemedText style={styles.label}>Database URL</ThemedText>
          <ThemedText style={styles.value}>{Config.turso.databaseUrl || 'not configured'}</ThemedText>
          <ThemedText style={styles.label}>World population</ThemedText>
          <ThemedText style={styles.value}>{Config.world.populationToday.toLocaleString()}</ThemedText>
        </BlurView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(53,92,255,0.35)',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
