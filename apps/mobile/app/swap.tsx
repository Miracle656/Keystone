import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors } from "../lib/theme";
import { useMidPrice } from "../lib/hooks/useMidPrice";
import { useToast } from "../lib/hooks/useToast";
import { UsdcIcon, EurcIcon } from "../components/BrandIcons";
import { DemoBadge } from "../components/DemoBadge";
import { Toast } from "../components/Toast";

export default function Swap() {
  const { mid, midDisplay } = useMidPrice();
  const { toast, showToast } = useToast();
  const [amount, setAmount] = useState("1,000.00");

  const numeric = parseFloat(amount.replace(/,/g, "")) || 0;
  const out = (numeric * mid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={styles.container}>
      <Toast title={toast?.title ?? null} body={toast?.body ?? null} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Swap</Text>
          <View style={{ marginLeft: "auto" }}>
            <DemoBadge small />
          </View>
        </View>

        <View style={{ position: "relative" }}>
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardLabel}>YOU PAY</Text>
              <Text style={styles.cardLabel}>BALANCE 12,480.00</Text>
            </View>
            <View style={styles.amountRow}>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} />
              <View style={styles.tokenChip}>
                <UsdcIcon size={24} />
                <Text style={styles.tokenLabel}>USDC</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.flipBtn}
            onPress={() => showToast("DIRECTION FLIPPED (DEMO)", "EURC → USDC · same book, same price")}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" stroke={colors.basalt} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>

          <View style={[styles.card, { marginTop: 8 }]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardLabel}>YOU RECEIVE</Text>
              <Text style={styles.cardLabel}>BALANCE 4,205.11</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.receiveAmount}>{out}</Text>
              <View style={styles.tokenChip}>
                <EurcIcon size={24} />
                <Text style={styles.tokenLabel}>EURC</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RATE</Text>
            <Text style={styles.infoValue}>1 USDC = {midDisplay} EURC</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ROUTE</Text>
            <Text style={[styles.infoValue, { color: colors.gold }]}>Keystone Book · best ask</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FEE · SETTLEMENT</Text>
            <Text style={[styles.infoValue, { color: colors.bid }]}>&lt; $0.01 · ~0.8s</Text>
          </View>
        </View>

        <Pressable
          style={styles.submit}
          onPress={() => showToast(`SWAPPED ${numeric.toLocaleString("en-US")} USDC → EURC (DEMO)`, `Not a real transaction · would settle @ ${midDisplay} in ~0.8s`)}
        >
          <Text style={styles.submitText}>SWAP USDC → EURC</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 70, paddingHorizontal: 18, paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, borderColor: "rgba(245,241,230,0.12)", backgroundColor: "rgba(245,241,230,0.05)", alignItems: "center", justifyContent: "center" },
  backText: { color: colors.limestone, fontSize: 18 },
  title: { color: colors.limestone, fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  amountInput: { flex: 1, color: colors.limestone, fontFamily: "monospace", fontSize: 30, fontWeight: "700", padding: 0 },
  receiveAmount: { color: colors.bid, fontFamily: "monospace", fontSize: 30, fontWeight: "700" },
  tokenChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.basalt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  tokenLabel: { color: colors.limestone, fontFamily: "monospace", fontSize: 13, fontWeight: "700" },
  flipBtn: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gold,
    borderWidth: 4,
    borderColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  infoBox: { marginTop: 14, padding: 14, backgroundColor: "rgba(245,241,230,0.04)", borderRadius: 14, gap: 9 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { color: "rgba(245,241,230,0.5)", fontFamily: "monospace", fontSize: 11.5 },
  infoValue: { color: colors.limestone, fontFamily: "monospace", fontSize: 11.5 },
  submit: { marginTop: 14, backgroundColor: colors.gold, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  submitText: { color: colors.basalt, fontFamily: "monospace", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
});
