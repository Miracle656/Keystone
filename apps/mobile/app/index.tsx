import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors } from "../lib/theme";
import { useMidPrice } from "../lib/hooks/useMidPrice";
import { Arch } from "../components/Arch";
import { KeystoneIcon, UsdcIcon, EurcIcon } from "../components/BrandIcons";

const HERO_WORDS = [
  { text: "Any", color: colors.limestone },
  { text: "chain", color: colors.limestone },
  { text: "in.", color: colors.limestone },
  { text: "Arc", color: colors.gold },
  { text: "execution.", color: colors.gold },
  { text: "Real", color: colors.limestone },
  { text: "yield", color: colors.limestone },
  { text: "out.", color: colors.limestone },
];

const FEATURES = [
  { glyph: "≡", color: colors.gold, bg: "rgba(231,178,90,0.14)", title: "The Book", sub: "On-chain CLOB · USDC/EURC · price-time priority" },
  { glyph: "⇄", color: "#5B9CF6", bg: "rgba(91,156,246,0.14)", title: "The Router", sub: "Any chain in via Gateway + CCTP v2" },
  { glyph: "%", color: colors.bid, bg: "rgba(47,191,113,0.14)", title: "Earn", sub: "Real yield from maker fees and spread" },
];

export default function Landing() {
  const [splashDone, setSplashDone] = useState(false);
  const { mid, midDisplay } = useMidPrice();

  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.9)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 120 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1.9, duration: 900, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(barWidth, { toValue: 1, duration: 1000, useNativeDriver: false }),
      ]),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(splashOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
          setSplashDone(true);
          Animated.timing(contentOpacity, { toValue: 1, duration: 450, useNativeDriver: true }).start();
        });
      }, 400);
    });
  }, []);

  return (
    <View style={styles.container}>
      {!splashDone && (
        <Animated.View style={[styles.splash, { opacity: splashOpacity }]}>
          <View style={{ position: "relative", width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
            <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
              <KeystoneIcon size={120} />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.splashWord, { opacity: wordOpacity }]}>Keystone</Animated.Text>
          <Animated.Text style={[styles.splashTag, { opacity: wordOpacity }]}>THE ON-CHAIN ORDER BOOK FOR INTERNET MONEY</Animated.Text>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, { width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
            </View>
            <Text style={styles.builtOn}>BUILT ON ARC · TESTNET</Text>
          </View>
        </Animated.View>
      )}

      {splashDone && (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.topRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <KeystoneIcon size={30} />
                <Text style={styles.brandName}>Keystone</Text>
              </View>
              <View style={styles.testnetBadge}>
                <Text style={styles.testnetText}>ARC TESTNET</Text>
              </View>
            </View>

            <View style={styles.archWrap}>
              <Arch mid={mid} midDisplay={midDisplay} />
            </View>
            <Text style={styles.pairCaption}>USDC/EURC · LIVE ON ARC · SPREAD 3.5 bps</Text>

            <View style={styles.heroWords}>
              {HERO_WORDS.map((w, i) => (
                <Text key={i} style={[styles.heroWord, { color: w.color }]}>
                  {w.text + " "}
                </Text>
              ))}
            </View>
            <Text style={styles.heroBody}>
              Fully on-chain matching for stablecoin pairs. Every fill is an event with a hash. Real yield from real trades.
            </Text>

            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                    <Text style={[styles.featureGlyph, { color: f.color }]}>{f.glyph}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureSub}>{f.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable style={styles.primaryBtn} onPress={() => router.push("/get-started")}>
              <Text style={styles.primaryBtnText}>CONNECT WALLET</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/(tabs)/home")}>
              <Text style={styles.secondaryBtnText}>EXPLORE THE BOOK</Text>
            </Pressable>

            <View style={styles.settledRow}>
              <Text style={styles.settledText}>SETTLED IN</Text>
              <UsdcIcon size={24} />
              <View style={{ marginLeft: -8 }}>
                <EurcIcon size={24} />
              </View>
              <Text style={styles.settledText}>· BUILT ON ARC</Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.basalt },
  ring: { position: "absolute", width: 164, height: 164, borderRadius: 82, borderWidth: 1.5, borderColor: "rgba(231,178,90,0.55)" },
  splashWord: { marginTop: 26, color: colors.limestone, fontSize: 34, fontWeight: "700", letterSpacing: -0.6 },
  splashTag: { marginTop: 10, color: colors.gold, fontFamily: "monospace", fontSize: 10.5, letterSpacing: 2 },
  progressWrap: { position: "absolute", bottom: 64, alignItems: "center", gap: 12 },
  progressTrack: { width: 120, height: 2, backgroundColor: "rgba(245,241,230,0.10)", borderRadius: 1, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: colors.gold },
  builtOn: { color: "rgba(245,241,230,0.35)", fontFamily: "monospace", fontSize: 10, letterSpacing: 1.4 },
  scroll: { paddingTop: 76, paddingHorizontal: 22, paddingBottom: 36 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandName: { color: colors.limestone, fontWeight: "700", fontSize: 19, letterSpacing: -0.4 },
  testnetBadge: { borderWidth: 1, borderColor: "rgba(231,178,90,0.4)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  testnetText: { color: colors.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  archWrap: { width: "92%", alignSelf: "center", marginTop: 22 },
  pairCaption: { textAlign: "center", color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 2, marginTop: 12 },
  heroWords: { flexDirection: "row", flexWrap: "wrap", marginTop: 26 },
  heroWord: { fontSize: 34, fontWeight: "700", letterSpacing: -0.6, lineHeight: 38 },
  heroBody: { color: "rgba(245,241,230,0.65)", fontSize: 14.5, lineHeight: 22, marginTop: 14 },
  features: { marginTop: 20, gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 11, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 14 },
  featureIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureGlyph: { fontFamily: "monospace", fontSize: 13, fontWeight: "700" },
  featureTitle: { color: colors.limestone, fontSize: 14, fontWeight: "700" },
  featureSub: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10.5, marginTop: 2 },
  primaryBtn: { marginTop: 24, backgroundColor: colors.gold, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  primaryBtnText: { color: colors.basalt, fontFamily: "monospace", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
  secondaryBtn: { marginTop: 10, backgroundColor: "rgba(245,241,230,0.06)", borderWidth: 1, borderColor: "rgba(245,241,230,0.12)", paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  secondaryBtnText: { color: colors.limestone, fontFamily: "monospace", fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  settledRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 },
  settledText: { color: "rgba(245,241,230,0.35)", fontFamily: "monospace", fontSize: 10, letterSpacing: 1.2 },
});
