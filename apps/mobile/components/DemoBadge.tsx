import { StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

// Same honesty-badge convention as web's component library (KEYSTONE_PRD.md §7:
// "honesty badge (demo rate/mock)") — flags data that isn't backed by real order-book,
// swap, or bridge execution yet (see apps/mobile/README.md).
export function DemoBadge({ small }: { small?: boolean }) {
  return (
    <View style={[styles.badge, small && styles.small]}>
      <Text style={[styles.text, small && styles.smallText]}>DEMO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: "rgba(245,241,230,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  small: { paddingHorizontal: 5, paddingVertical: 2 },
  text: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 9, letterSpacing: 1 },
  smallText: { fontSize: 8 },
});
