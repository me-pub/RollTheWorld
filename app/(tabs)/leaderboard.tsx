import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { fetchLeaderboardAround, fetchLeaderboardTop, LeaderboardEntry } from '@/lib/roll-service';

const renderRow = (entry: LeaderboardEntry) => (
  <View key={`${entry.deviceId}-${entry.rank}`} style={styles.row}>
    <View style={styles.rankPill}>
      <ThemedText style={styles.rankPillText}>#{entry.rank}</ThemedText>
    </View>
    <View style={styles.rowContent}>
      <ThemedText style={styles.rowValue}>{entry.value.toLocaleString()}</ThemedText>
      <ThemedText style={styles.rowDevice}>{entry.deviceId.slice(0, 8)}…</ThemedText>
    </View>
  </View>
);

export default function LeaderboardScreen() {
  const theme = useColorScheme() ?? 'light';
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  const [around, setAround] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [topRows, aroundRows] = await Promise.all([
        fetchLeaderboardTop(),
        fetchLeaderboardAround().catch((err) => {
          console.warn('Unable to fetch around me', err);
          return [] as LeaderboardEntry[];
        }),
      ]);
      setTop(topRows);
      setAround(aroundRows);
    } catch (err) {
      console.warn('Leaderboard fetch failed', err);
      setError('Cannot load leaderboard right now.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors[theme].backgroundGradient} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}>
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <ThemedText type="subtitle">Top 100 Today</ThemedText>
          <View style={styles.list}>{top.map(renderRow)}</View>
          {top.length === 0 && (
            <ThemedText style={styles.emptyText}>Be the first to roll today.</ThemedText>
          )}
        </BlurView>
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <ThemedText type="subtitle">Around You</ThemedText>
          <View style={styles.list}>{around.map(renderRow)}</View>
          {around.length === 0 && (
            <ThemedText style={styles.emptyText}>Roll first to see your neighbors.</ThemedText>
          )}
        </BlurView>
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
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
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankPill: {
    backgroundColor: 'rgba(53,92,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rankPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 8,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  rowDevice: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    color: '#FFB4B4',
  },
});
