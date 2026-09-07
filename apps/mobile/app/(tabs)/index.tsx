import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { colors } from "../../lib/theme";
import { readArcBalances } from "../../lib/viemClient";

export default function Portfolio() {
  const { isReady, user, logout } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const wallet = wallets[0];

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
      <Text style={styles.label}>Wallet</Text>
      <Text style={styles.address}>{wallet?.address ?? "—"}</Text>

      <Text style={[styles.label, { marginTop: 24 }]}>Arc Testnet balance</Text>
      {loadError ? (
        <Text style={styles.error}>{loadError}</Text>
      ) : balances ? (
        <>
          <Text style={styles.balance}>{balances.usdc} USDC</Text>
          <Text style={styles.balance}>{balances.eurc} EURC</Text>
        </>
      ) : (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 8 }} />
      )}

      <Pressable style={styles.logout} onPress={() => logout()}>
        <Text style={styles.logoutLabel}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.basalt, padding: 24 },
  center: {
    flex: 1,
    backgroundColor: colors.basalt,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  label: { color: colors.inkFaint, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  address: { color: colors.limestone, fontFamily: "monospace", fontSize: 14, marginTop: 4 },
  balance: { color: colors.limestone, fontSize: 22, fontWeight: "700", marginTop: 4 },
  error: { color: colors.ask, marginTop: 8 },
  emptyTitle: { color: colors.limestone, fontSize: 18, fontWeight: "700" },
  emptySubtitle: { color: colors.inkFaint, textAlign: "center" },
  cta: { backgroundColor: colors.gold, borderRadius: 4, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  ctaLabel: { color: colors.basalt, fontWeight: "700" },
  logout: { marginTop: 32, alignSelf: "flex-start" },
  logoutLabel: { color: colors.inkFaint, fontSize: 13 },
});
