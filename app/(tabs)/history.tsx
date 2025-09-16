import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { fetchHistory, HistoryEntry } from '@/lib/roll-service';
import { formatYyyymmdd, shiftYyyymmdd, utcTodayYyyymmdd } from '@/utils/date';

const computeStreak = (history: HistoryEntry[]) => {
  if (history.length === 0) {
    return 0;
  }
  const today = utcTodayYyyymmdd();
  let expected = today;
  let streak = 0;
  for (const entry of history) {
    if (entry.date === expected) {
      streak += 1;
      expected = shiftYyyymmdd(expected, -1);
    } else if (entry.date === shiftYyyymmdd(expected, -1)) {
      expected = shiftYyyymmdd(expected, -1);
      streak += 1;
      expected = shiftYyyymmdd(expected, -1);
    } else {
      break;
    }
  }
  return streak;
};

export default function HistoryScreen() {
  const theme = useColorScheme() ?? 'light';
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const rows = await fetchHistory();
    setHistory(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const streak = useMemo(() => computeStreak(history), [history]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors[theme].backgroundGradient} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}>
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <ThemedText type="subtitle">Current streak</ThemedText>
          <View style={styles.streakRow}>
            <ThemedText style={styles.streakNumber}>{String(streak ?? 0)}</ThemedText>
            <ThemedText style={styles.streakCaption}>days in a row</ThemedText>
          </View>
        </BlurView>
        <BlurView intensity={70} tint="dark" style={styles.card}>
          <ThemedText type="subtitle">Last rolls</ThemedText>
          {history.length === 0 ? (
            <ThemedText style={styles.emptyText}>Roll to start your timeline.</ThemedText>
          ) : (
            history.map((entry) => (
              <View key={entry.date} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <ThemedText style={styles.historyDate}>{formatYyyymmdd(entry.date)}</ThemedText>
                  <ThemedText style={styles.historyRank}>#{entry.rank} of {entry.total.toLocaleString()}</ThemedText>
                </View>
                <ThemedText style={styles.historyValue}>{entry.value.toLocaleString()}</ThemedText>
              </View>
            ))
          )}
        </BlurView>
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
  streakRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: Platform.select({ android: 'sans-serif', ios: undefined, default: undefined }),
    lineHeight: 56,
    marginTop: 2,
    // Prevent extra top spacing on Android and avoid visual clipping
    includeFontPadding: false as unknown as undefined,
    textAlignVertical: Platform.OS === 'android' ? 'bottom' : undefined,
  },
  streakCaption: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    paddingBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  historyLeft: {
    gap: 4,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyRank: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  historyValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});

