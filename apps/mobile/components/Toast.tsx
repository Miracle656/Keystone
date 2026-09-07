import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

export function Toast({ title, body }: { title: string | null; body: string | null }) {
  const y = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!title) return;
    Animated.parallel([
      Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 180 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [title, body]);

  if (!title) return null;

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY: y }], opacity }]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✓</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 60,
    zIndex: 70,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "rgba(47,191,113,0.5)",
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(47,191,113,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.bid, fontWeight: "700" },
  title: { color: colors.bid, fontFamily: "monospace", fontSize: 12, fontWeight: "700" },
  body: { color: "rgba(245,241,230,0.6)", fontFamily: "monospace", fontSize: 11, marginTop: 2 },
});
