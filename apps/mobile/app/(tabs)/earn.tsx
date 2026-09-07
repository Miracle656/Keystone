import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { colors } from "../../lib/theme";
import { useToast } from "../../lib/hooks/useToast";
import { AppHeader } from "../../components/AppHeader";
import { DemoBadge } from "../../components/DemoBadge";
import { Toast } from "../../components/Toast";

export default function Earn() {
  const { toast, showToast } = useToast();

  return (
    <View style={styles.container}>
      <AppHeader />
      <Toast title={toast?.title ?? null} body={toast?.body ?? null} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>YOUR MONEY</Text>
            <DemoBadge small />
          </View>
          <Text style={styles.heroTotal}>$1,264.18</Text>
          <Text style={styles.heroSub}>1,264.18 USDC in the Reserve</Text>
          <View style={styles.pillRow}>
            <View style={styles.apyPill}>
              <Text style={styles.apyText}>7.2% APY</Text>
            </View>
            <View style={styles.quotingPill}>
              <View style={styles.dot} />
              <Text style={styles.quotingText}>QUOTING NOW</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.addBtn} onPress={() => router.push("/bridge")}>
              <Text style={styles.addBtnText}>ADD MONEY</Text>
            </Pressable>
            <Pressable style={styles.outBtn} onPress={() => showToast("WITHDRAWAL STARTED (DEMO)", "Not a real transaction — Reserve withdrawal isn't wired up yet")}>
              <Text style={styles.outBtnText}>TAKE OUT</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>EARNED SO FAR</Text>
            <Text style={styles.earned}>+$24.60</Text>
          </View>
          <Svg viewBox="0 0 330 90" width="100%" height={90} style={{ marginTop: 10 }}>
            <Line x1={0} y1={88} x2={330} y2={88} stroke="rgba(245,241,230,0.12)" strokeWidth={1} />
            <Path
              d="M0,84 C30,82 50,78 80,74 C110,70 130,64 160,56 C190,48 210,40 250,30 C280,22 300,16 330,10"
              fill="none"
              stroke={colors.bid}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Circle cx={330} cy={10} r={4} fill={colors.bid} />
          </Svg>
          <View style={styles.rowBetween}>
            <Text style={styles.faintSmall}>30 DAYS AGO</Text>
            <Text style={styles.faintSmall}>TODAY</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>WHERE DOES THIS COME FROM?</Text>
          <Text style={styles.explainer}>Your money is quoting on the market and earning the fees. No lending, no leverage.</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.metricLabel}>MAKER FEES</Text>
            <Text style={styles.metricValue}>$14.10</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: "57%", backgroundColor: colors.gold }]} />
          </View>
          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Text style={styles.metricLabel}>SPREAD CAPTURE</Text>
            <Text style={styles.metricValue}>$10.50</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: "43%", backgroundColor: colors.bid }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 130, paddingHorizontal: 18, paddingBottom: 180 },
  hero: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 24, padding: 20, alignItems: "center" },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  heroLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 2 },
  heroTotal: { color: colors.limestone, fontFamily: "monospace", fontSize: 42, fontWeight: "700" },
  heroSub: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 12, marginTop: 8 },
  pillRow: { flexDirection: "row", gap: 8, marginTop: 18 },
  apyPill: { backgroundColor: colors.bid, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  apyText: { color: "#08240F", fontFamily: "monospace", fontWeight: "700", fontSize: 12 },
  quotingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(231,178,90,0.4)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  quotingText: { color: colors.gold, fontFamily: "monospace", fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 22, width: "100%" },
  addBtn: { flex: 1, backgroundColor: colors.gold, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  addBtnText: { color: colors.basalt, fontFamily: "monospace", fontWeight: "700", fontSize: 13 },
  outBtn: { flex: 1, backgroundColor: "rgba(245,241,230,0.06)", borderWidth: 1, borderColor: "rgba(245,241,230,0.12)", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  outBtnText: { color: colors.limestone, fontFamily: "monospace", fontWeight: "700", fontSize: 13 },
  card: { marginTop: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, padding: 18 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  cardLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1.5 },
  earned: { color: colors.bid, fontFamily: "monospace", fontSize: 16, fontWeight: "700" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  faintSmall: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 9.5 },
  explainer: { color: "rgba(245,241,230,0.75)", fontSize: 14, lineHeight: 20, marginTop: 10, marginBottom: 16 },
  metricLabel: { color: "rgba(245,241,230,0.5)", fontFamily: "monospace", fontSize: 11 },
  metricValue: { color: colors.limestone, fontFamily: "monospace", fontSize: 11, fontWeight: "700" },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.basalt, overflow: "hidden", marginTop: 5 },
  barFill: { height: "100%", borderRadius: 4 },
});
