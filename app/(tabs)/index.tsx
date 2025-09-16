import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

import { Colors } from '@/constants/theme';
import { Config } from '@/constants/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { performDailyRoll, getCurrentRoll, RollResult } from '@/lib/roll-service';
import { utcTodayYyyymmdd } from '@/utils/date';

const { width } = Dimensions.get('window');

const toPercentile = (rank: number, total: number) => {
  if (total <= 0) {
    return null;
  }
  const percentile = (rank / total) * 100;
  return percentile <= 0 ? 0 : percentile;
};

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roll, setRoll] = useState<RollResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const loadRoll = useCallback(async () => {
    setError(null);
    try {
      const existing = await getCurrentRoll();
      setRoll(existing);
    } catch (err) {
      console.warn('Failed to fetch current roll', err);
      setError('Unable to reach the leaderboard right now.');
    }
  }, []);

  useEffect(() => {
    loadRoll();
  }, [loadRoll]);

  useEffect(() => {
    if (!celebrate) {
      return;
    }
    const timeout = setTimeout(() => setCelebrate(false), 2800);
    return () => clearTimeout(timeout);
  }, [celebrate]);

  const handleRoll = useCallback(async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await performDailyRoll();
      setRoll(result);
      setCelebrate(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (err) {
      console.warn('Roll failed', err);
      setError('Roll failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const hasRolledToday = roll?.date === utcTodayYyyymmdd();
  const percentile = roll ? toPercentile(roll.rank, roll.total) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={Colors[theme].backgroundGradient} style={StyleSheet.absoluteFill} />
      {celebrate && (
        <ConfettiCannon
          count={140}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          fallSpeed={2400}
        />
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSpacing} />
        <BlurView intensity={80} tint="dark" style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">World Population Today</ThemedText>
            <ThemedText style={styles.populationValue}>
              {Config.world.populationToday.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.populationCaption}>Range: 1 ? {Config.world.populationToday.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.rollStatus}>
            {hasRolledToday ? (
              <View style={styles.resultContainer}>
                <ThemedText type="subtitle">Your roll</ThemedText>
                <ThemedText
                  style={styles.rollValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  ellipsizeMode='clip'
                >
                  {roll?.value.toLocaleString()}
                </ThemedText>
                {roll && (
                  <View style={styles.rankRow}>
                    <View style={styles.rankBadge}>
                      <ThemedText style={styles.rankBadgeText}>#{roll.rank}</ThemedText>
                    </View>
                    <ThemedText style={styles.rankDetails}>
                      {roll.rank === 1 ? 'Global leader!' : `Out of ${roll.total.toLocaleString()} rollers`}
                    </ThemedText>
                  </View>
                )}
                {percentile != null && (
                  <ThemedText style={styles.percentileText}>
                    Top {percentile.toFixed(1)}%
                  </ThemedText>
                )}
              </View>
            ) : (
              <View style={styles.resultContainer}>
                <ThemedText type="subtitle">Ready to roll?</ThemedText>
                <ThemedText style={styles.rollPrompt}>You get one shot every UTC day.</ThemedText>
              </View>
            )}
          </View>
          <Pressable
            disabled={isLoading || hasRolledToday}
            onPress={handleRoll}
            style={({ pressed }) => [
              styles.rollButton,
              { opacity: pressed ? 0.8 : hasRolledToday ? 0.5 : 1, backgroundColor: Colors[theme].accent },
            ]}>
            <ThemedText style={styles.rollButtonLabel}>
              {hasRolledToday ? 'Come back tomorrow' : isLoading ? 'Rolling…' : 'Roll the world'}
            </ThemedText>
          </Pressable>
          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        </BlurView>
        <BlurView intensity={60} tint="dark" style={styles.detailCard}>
          <ThemedText type="subtitle">How it works</ThemedText>
          <ThemedText style={styles.detailText}>
            We pick a random number between 1 and today&apos;s population. Everyone on the planet gets the same range. Highest roll leads the global board.
          </ThemedText>
          <ThemedText style={styles.detailText}>
            Your device ID stays on this phone, and we only store hashed identifiers in Turso.
          </ThemedText>
        </BlurView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSpacing: {
    height: 12,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 12,
  },
  cardHeader: {
    gap: 8,
  },
  populationValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  populationCaption: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  rollStatus: {
    paddingVertical: 8,
  },
  resultContainer: {
    gap: 12,
    alignItems: 'center',
  },
  rollValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 54,
  },
  rollPrompt: {
    fontSize: 18,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    backgroundColor: 'rgba(53, 92, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rankBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  rankDetails: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
  },
  percentileText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
  },
  rollButton: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 16,
  },
  rollButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
    color: '#FFB4B4',
    textAlign: 'center',
  },
  detailCard: {
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
  },
});
