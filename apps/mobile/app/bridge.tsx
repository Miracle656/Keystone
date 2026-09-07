import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { colors } from "../lib/theme";
import { useToast } from "../lib/hooks/useToast";
import { BRIDGE_CHAINS } from "../lib/mockMarket";
import { ArcNetworkIcon, UsdcIcon } from "../components/BrandIcons";
import { DemoBadge } from "../components/DemoBadge";
import { Toast } from "../components/Toast";

const arbitrumLogo = require("../assets/arbitrum.png");

export default function Bridge() {
  const { toast, showToast } = useToast();
  const [chain, setChain] = useState("BASE");
  const [amount, setAmount] = useState("2,500.00");
  const dotX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotX, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.delay(400),
        Animated.timing(dotX, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const activeChain = BRIDGE_CHAINS.find((c) => c.name === chain) ?? BRIDGE_CHAINS[0];

  return (
    <View style={styles.container}>
      <Toast title={toast?.title ?? null} body={toast?.body ?? null} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Bridge</Text>
          <Text style={styles.headerSub}>GATEWAY · CCTP v2</Text>
        </View>

        <Text style={styles.sectionLabel}>FROM CHAIN</Text>
        <View style={styles.chainGrid}>
          {BRIDGE_CHAINS.map((c) => {
            const active = chain === c.name;
            return (
              <Pressable
                key={c.name}
                onPress={() => setChain(c.name)}
                style={[styles.chainCard, { backgroundColor: active ? "rgba(231,178,90,0.12)" : colors.panel, borderColor: active ? colors.gold : colors.mortar }]}
              >
                {c.logo ? (
                  <Image source={arbitrumLogo} style={styles.chainLogo} resizeMode="contain" />
                ) : (
                  <View style={[styles.chainBadge, { backgroundColor: c.color }]} />
                )}
                <Text style={styles.chainName}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.amountCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>AMOUNT</Text>
            <Text style={styles.cardLabel}>ON {chain} · 8,214.50</Text>
          </View>
          <View style={styles.amountRow}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} />
            <Pressable onPress={() => setAmount("8,214.50")}>
              <Text style={styles.maxBtn}>MAX</Text>
            </Pressable>
            <View style={styles.tokenChip}>
              <UsdcIcon size={24} />
              <Text style={styles.tokenLabel}>USDC</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={{ alignItems: "center" }}>
            {activeChain.logo ? (
              <Image source={arbitrumLogo} style={styles.chainLogo} resizeMode="contain" />
            ) : (
              <View style={[styles.chainBadge, { backgroundColor: activeChain.color }]} />
            )}
            <Text style={styles.routeChainLabel}>{chain}</Text>
          </View>
          <View style={styles.routeMiddle}>
            <View style={styles.dottedLine}>
              <Animated.View
                style={[
                  styles.routeDot,
                  {
                    left: dotX.interpolate({ inputRange: [0, 1], outputRange: ["0%", "94%"] }),
                  },
                ]}
              />
            </View>
            <Text style={styles.routeMiddleText}>CIRCLE · CCTP v2 · ~45s</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <ArcNetworkIcon size={50} />
            <Text style={styles.routeChainLabel}>ARC</Text>
          </View>
        </View>

        <View style={[styles.rowBetween, { paddingHorizontal: 4, marginTop: 12 }]}>
          <Text style={styles.footerText}>Lands in your Keystone book balance</Text>
          <Text style={[styles.footerText, { color: colors.bid }]}>FEE &lt; $0.01</Text>
        </View>

        <Pressable
          style={styles.submit}
          onPress={() => showToast(`BRIDGING ${amount} USDC (DEMO)`, `${chain} → ARC · not a real transaction · would land in ~45s`)}
        >
          <Text style={styles.submitText}>BRIDGE TO ARC</Text>
        </Pressable>

        <View style={{ alignItems: "center", marginTop: 14 }}>
          <DemoBadge />
        </View>
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
  headerSub: { marginLeft: "auto", color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  sectionLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  chainGrid: { flexDirection: "row", gap: 8 },
  chainCard: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 16, borderWidth: 1.5 },
  chainBadge: { width: 32, height: 32, borderRadius: 9 },
  chainLogo: { width: 32, height: 32, borderRadius: 9 },
  chainName: { color: colors.limestone, fontFamily: "monospace", fontSize: 11, fontWeight: "700" },
  amountCard: { marginTop: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  amountInput: { flex: 1, color: colors.limestone, fontFamily: "monospace", fontSize: 30, fontWeight: "700", padding: 0 },
  maxBtn: { color: colors.gold, fontFamily: "monospace", fontSize: 11, fontWeight: "700" },
  tokenChip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.basalt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  tokenLabel: { color: colors.limestone, fontFamily: "monospace", fontSize: 13, fontWeight: "700" },
  routeCard: {
    marginTop: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.mortar,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  routeChainLabel: { color: "rgba(245,241,230,0.5)", fontFamily: "monospace", fontSize: 9.5, marginTop: 6 },
  routeMiddle: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  dottedLine: { width: "100%", height: 1, backgroundColor: "rgba(245,241,230,0.25)", position: "relative" },
  routeDot: { position: "absolute", top: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold },
  routeMiddleText: { color: colors.gold, fontFamily: "monospace", fontSize: 9, marginTop: 10, letterSpacing: 0.5, textAlign: "center" },
  footerText: { color: "rgba(245,241,230,0.5)", fontFamily: "monospace", fontSize: 11 },
  submit: { marginTop: 14, backgroundColor: colors.gold, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  submitText: { color: colors.basalt, fontFamily: "monospace", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
});
