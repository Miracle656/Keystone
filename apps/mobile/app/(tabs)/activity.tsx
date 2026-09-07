import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../lib/theme";
import { mockEvents } from "../../lib/mockMarket";
import { AppHeader } from "../../components/AppHeader";
import { DemoBadge } from "../../components/DemoBadge";

export default function Activity() {
  const events = mockEvents();

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Activity</Text>
          <DemoBadge />
        </View>
        <View style={styles.list}>
          {events.map((e, i) => (
            <View key={i} style={[styles.row, i === events.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrap, { backgroundColor: e.bg }]}>
                <Text style={[styles.glyph, { color: e.color }]}>{e.glyph}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventDetail}>{e.detail}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.eventTime}>{e.time}</Text>
                <Text style={styles.eventTx}>{e.tx}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 130, paddingHorizontal: 18, paddingBottom: 180 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { color: colors.limestone, fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  list: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderBottomWidth: 1, borderBottomColor: "rgba(245,241,230,0.06)" },
  iconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  glyph: { fontFamily: "monospace", fontSize: 14, fontWeight: "700" },
  eventTitle: { color: colors.limestone, fontSize: 14, fontWeight: "600" },
  eventDetail: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 11, marginTop: 2 },
  eventTime: { color: "rgba(245,241,230,0.5)", fontFamily: "monospace", fontSize: 11 },
  eventTx: { color: colors.gold, fontFamily: "monospace", fontSize: 10, marginTop: 3 },
});
