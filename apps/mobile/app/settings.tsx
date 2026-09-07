import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { colors } from "../lib/theme";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Settings() {
  const { user, logout } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const wallet = wallets[0];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Settings</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.badge}>ARC TESTNET — real chain, test funds</Text>

      {user && wallet && (
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>WALLET</Text>
          <Text style={styles.walletAddress}>{short(wallet.address)}</Text>
        </View>
      )}

      {user && (
        <Pressable style={styles.logout} onPress={() => logout().then(() => router.replace("/landing"))}>
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.basalt, padding: 24, paddingTop: 60 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { color: colors.limestone, fontSize: 24, fontWeight: "700" },
  closeText: { color: colors.inkFaint, fontSize: 18 },
  badge: {
    color: colors.inkFaint,
    fontFamily: "monospace",
    fontSize: 11,
    borderWidth: 1,
    borderColor: colors.mortar,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  walletCard: { marginTop: 20, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 16, padding: 16 },
  walletLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  walletAddress: { color: colors.limestone, fontFamily: "monospace", fontSize: 14, marginTop: 6 },
  logout: { marginTop: 28, alignSelf: "flex-start" },
  logoutLabel: { color: colors.ask, fontSize: 14 },
});
