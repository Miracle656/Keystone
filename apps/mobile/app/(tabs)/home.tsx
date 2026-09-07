import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { colors } from "../../lib/theme";
import { readArcBalances } from "../../lib/viemClient";
import { useMidPrice } from "../../lib/hooks/useMidPrice";
import { AppHeader } from "../../components/AppHeader";
import { Arch } from "../../components/Arch";
import { UsdcIcon, EurcIcon } from "../../components/BrandIcons";
import { DemoBadge } from "../../components/DemoBadge";

export default function Home() {
  const { isReady, user } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const wallet = wallets[0];
  const { mid, midDisplay } = useMidPrice();

  const [balances, setBalances] = useState<{ usdc: string; eurc: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet?.address) return;
    readArcBalances(wallet.address as `0x${string}`)
      .then(setBalances)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load balance"));
  }, [wallet?.address]);

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <AppHeader />
        <Text style={styles.emptyTitle}>No wallet yet</Text>
        <Text style={styles.emptySubtitle}>Create one with a passkey — takes a few seconds.</Text>
        <Pressable style={styles.cta} onPress={() => router.push("/get-started")}>
          <Text style={styles.ctaLabel}>Get started</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>YOUR WALLET</Text>
        <Text style={styles.address}>{wallet?.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}` : "—"}</Text>

        {loadError ? (
          <Text style={styles.error}>{loadError}</Text>
        ) : balances ? (
          <View style={styles.balanceRow}>
            <View style={styles.balanceTile}>
              <UsdcIcon size={22} />
              <Text style={styles.balanceAmount}>{balances.usdc}</Text>
              <Text style={styles.balanceToken}>USDC</Text>
            </View>
            <View style={styles.balanceTile}>
              <EurcIcon size={22} />
              <Text style={styles.balanceAmount}>{balances.eurc}</Text>
              <Text style={styles.balanceToken}>EURC</Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 8 }} />
        )}

        <Pressable style={styles.bookCard} onPress={() => router.push("/(tabs)/trade")}>
          <View style={styles.bookHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flexDirection: "row" }}>
                <UsdcIcon size={24} />
                <View style={{ marginLeft: -8 }}>
                  <EurcIcon size={24} />
                </View>
              </View>
              <Text style={styles.pairLabel}>USDC/EURC</Text>
            </View>
            <DemoBadge />
          </View>
          <Arch mid={mid} midDisplay={midDisplay} />
          <View style={styles.bookFooterRow}>
            <Text style={styles.bookFooterText}>SPREAD <Text style={{ color: colors.limestone }}>3.5 bps</Text></Text>
            <Text style={styles.bookFooterText}>MATCHED ON-CHAIN · ~780ms</Text>
          </View>
        </Pressable>

        <View style={styles.tileRow}>
          <StatTile label="IN BOOK" value="—" demo />
          <StatTile label="RESERVE" value="—" demo />
          <StatTile label="APY" value="7.2%" color={colors.bid} demo />
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({ label, value, color, demo }: { label: string; value: string; color?: string; demo?: boolean }) {
  return (
    <View style={styles.tile}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.tileLabel}>{label}</Text>
        {demo && <DemoBadge small />}
      </View>
      <Text style={[styles.tileValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  scroll: { paddingTop: 130, paddingHorizontal: 18, paddingBottom: 180, gap: 14 },
  label: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 11, letterSpacing: 2 },
  address: { color: colors.limestone, fontFamily: "monospace", fontSize: 13, marginTop: 4 },
  error: { color: colors.ask, marginTop: 8 },
  balanceRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  balanceTile: { flex: 1, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 16, padding: 14, gap: 6 },
  balanceAmount: { color: colors.limestone, fontFamily: "monospace", fontSize: 20, fontWeight: "700" },
  balanceToken: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 11 },
  bookCard: { marginTop: 22, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, padding: 16 },
  bookHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pairLabel: { color: colors.limestone, fontFamily: "monospace", fontSize: 13, fontWeight: "700" },
  bookFooterRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  bookFooterText: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10 },
  tileRow: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 16, padding: 14 },
  tileLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 9.5, letterSpacing: 1 },
  tileValue: { color: colors.limestone, fontFamily: "monospace", fontSize: 15, fontWeight: "700", marginTop: 8 },
  emptyTitle: { color: colors.limestone, fontSize: 18, fontWeight: "700" },
  emptySubtitle: { color: colors.inkFaint, textAlign: "center" },
  cta: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  ctaLabel: { color: colors.basalt, fontWeight: "700" },
});
