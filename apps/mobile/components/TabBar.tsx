import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "../lib/theme";

const ROUTE_LABEL: Record<string, string> = { index: "HOME", trade: "TRADE", earn: "EARN", activity: "ACTIVITY" };

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const c = active ? colors.gold : colors.inkFainter;
  if (name === "index") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={7.5} height={7.5} rx={2} stroke={c} strokeWidth={2} />
        <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} stroke={c} strokeWidth={2} />
        <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} stroke={c} strokeWidth={2} />
        <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} fill={c} />
      </Svg>
    );
  }
  if (name === "trade") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M6 4v16M12 7v10M18 4v16" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
        <Rect x={4} y={8} width={4} height={7} rx={1} fill={c} />
        <Rect x={10} y={10} width={4} height={4} rx={1} fill={c} />
        <Rect x={16} y={7} width={4} height={9} rx={1} fill={c} />
      </Svg>
    );
  }
  if (name === "earn") {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M3 19a9 9 0 0 1 18 0" stroke={c} strokeWidth={2} strokeLinecap="round" />
        <Path d="M3 19h18" stroke={c} strokeWidth={2} strokeLinecap="round" />
        <Rect x={9.5} y={8.5} width={5} height={4} rx={1} fill={c} />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 7.5V12l3 2" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z" stroke={c} strokeWidth={2} />
    </Svg>
  );
}

export function TabBar({ state, navigation, sheetOpen, onToggleSheet }: BottomTabBarProps & { sheetOpen: boolean; onToggleSheet: () => void }) {
  const rotate = useRef(new Animated.Value(0)).current;

  Animated.timing(rotate, { toValue: sheetOpen ? 1 : 0, duration: 380, useNativeDriver: true }).start();
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    const focused = state.index === routeIndex;
    const label = ROUTE_LABEL[route.name] ?? route.name.toUpperCase();
    return (
      <Pressable
        key={route.key}
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
      >
        <TabIcon name={route.name} active={focused} />
        <Text style={[styles.label, { color: focused ? colors.gold : colors.inkFainter }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      {renderTab(0)}
      {renderTab(1)}
      <View style={styles.fabSlot}>
        <Pressable onPress={onToggleSheet} style={styles.fabTouchable} accessibilityLabel="Quick actions">
          <View style={styles.fabShape}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                <Path d="M12 5v14M5 12h14" stroke={colors.basalt} strokeWidth={3} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </View>
        </Pressable>
      </View>
      {renderTab(2)}
      {renderTab(3)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 42,
    height: 68,
    borderRadius: 24,
    backgroundColor: "rgba(22,35,59,0.92)",
    borderWidth: 1,
    borderColor: colors.mortar,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8 },
  label: { fontFamily: "monospace", fontSize: 9, letterSpacing: 1 },
  fabSlot: { width: 78, alignItems: "center" },
  fabTouchable: { position: "absolute", top: -22, width: 66, height: 60 },
  fabShape: {
    width: 66,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
