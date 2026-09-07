import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../lib/theme";
import { fetchStats, fetchReserveApy, type ProtocolStats } from "../../lib/indexer";

export default function Stats() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [apy, setApy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setError(null);
    return Promise.all([fetchStats(), fetchReserveApy()])
      .then(([s, a]) => {
        setStats(s);
        setApy(a.apy);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load stats"));
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.errorHint}>
          Check EXPO_PUBLIC_INDEXER_URL — the indexer needs to be reachable from this device.
        </Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 24, gap: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load().finally(() => setRefreshing(false));
          }}
          tintColor={colors.gold}
        />
      }
    >
      <Tile label="24h volume" value={stats.volume24h} />
      <Tile label="24h trades" value={String(stats.trades24h)} />
      <Tile label="TVL" value={stats.tvl} />
      <Tile label="Avg spread" value={`${stats.avgSpreadBps} bps`} />
      {apy !== null && <Tile label="Reserve APY" value={`${apy.toFixed(2)}%`} />}
    </ScrollView>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.basalt },
  center: {
    flex: 1,
    backgroundColor: colors.basalt,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  tile: {
    borderWidth: 1.5,
    borderColor: colors.mortar,
    borderRadius: 4,
    padding: 16,
  },
  tileLabel: { color: colors.inkFaint, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  tileValue: { color: colors.limestone, fontSize: 24, fontWeight: "700", marginTop: 6 },
  error: { color: colors.ask, textAlign: "center" },
  errorHint: { color: colors.inkFaint, textAlign: "center", fontSize: 12 },
});
