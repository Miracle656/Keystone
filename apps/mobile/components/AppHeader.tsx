import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { colors } from "../lib/theme";
import { KeystoneIcon } from "./BrandIcons";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function AppHeader() {
  const { user } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const wallet = wallets[0];

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <KeystoneIcon size={30} />
        <Text style={styles.brandName}>Keystone</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.testnetBadge}>
          <Text style={styles.testnetText}>ARC TESTNET</Text>
        </View>
        <Pressable style={styles.walletPill} onPress={() => router.push("/settings")}>
          <Text style={styles.walletText}>{user && wallet ? `● ${short(wallet.address)}` : "Get started"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 62,
    left: 0,
    right: 0,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    zIndex: 5,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: { color: colors.limestone, fontWeight: "700", fontSize: 19, letterSpacing: -0.4 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  testnetBadge: {
    borderWidth: 1,
    borderColor: "rgba(231,178,90,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testnetText: { color: colors.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  walletPill: {
    backgroundColor: "rgba(47,191,113,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  walletText: { color: colors.bid, fontFamily: "monospace", fontSize: 11 },
});
