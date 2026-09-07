import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../lib/theme";

export function QuickActionsSheet({
  visible,
  onClose,
  onSwap,
  onBridge,
}: {
  visible: boolean;
  onClose: () => void;
  onSwap: () => void;
  onBridge: () => void;
}) {
  const y = useRef(new Animated.Value(460)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 140 }).start();
    } else {
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      Animated.timing(y, { toValue: 460, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      // RN's Modal renders in its own native window, which otherwise ignores Expo SDK 54's
      // mandatory Android edge-to-edge and shows an opaque system nav bar behind it.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View style={[styles.sheet, { transform: [{ translateY: y }] }]}>
        <View style={styles.grip} />
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Quick actions</Text>
          <Text style={styles.headerSub}>ANY CHAIN · ARC EXECUTION</Text>
        </View>

        <Pressable
          onPress={onSwap}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={[styles.cardIcon, { backgroundColor: colors.gold }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3" stroke={colors.basalt} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Swap</Text>
            <Text style={styles.cardSub}>USDC ⇄ EURC at the book's best price</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          onPress={onBridge}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={[styles.cardIcon, { backgroundColor: "#1B3158" }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M3 17c2.5-8 5-8 7.5 0M13.5 17c2.5-8 5-8 7.5 0" stroke={colors.limestone} strokeWidth={2.4} strokeLinecap="round" />
              <Path d="M12 4v5M12 9l-2-2M12 9l2-2" stroke={colors.gold} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Bridge</Text>
            <Text style={styles.cardSub}>Any chain → Arc · Circle Gateway + CCTP v2</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(4,9,18,0.62)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 18,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: colors.mortar,
  },
  grip: { width: 40, height: 5, borderRadius: 3, backgroundColor: "rgba(245,241,230,0.2)", alignSelf: "center", marginBottom: 18 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
  headerTitle: { color: colors.limestone, fontSize: 21, fontWeight: "700" },
  headerSub: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.basalt,
    borderWidth: 1,
    borderColor: colors.mortar,
    borderRadius: 18,
  },
  cardPressed: { borderColor: "rgba(231,178,90,0.5)", transform: [{ scale: 0.98 }] },
  cardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.limestone, fontSize: 17, fontWeight: "700" },
  cardSub: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 11, marginTop: 3 },
  chevron: { color: "rgba(245,241,230,0.35)", fontSize: 20 },
});
