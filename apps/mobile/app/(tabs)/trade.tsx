import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../../lib/theme";
import { useMidPrice } from "../../lib/hooks/useMidPrice";
import { useToast } from "../../lib/hooks/useToast";
import { levels } from "../../lib/mockMarket";
import { AppHeader } from "../../components/AppHeader";
import { DemoBadge } from "../../components/DemoBadge";
import { UsdcIcon, EurcIcon } from "../../components/BrandIcons";
import { Toast } from "../../components/Toast";

const PCTS = [25, 50, 75, 100];

export default function Trade() {
  const { mid, midDisplay } = useMidPrice();
  const { toast, showToast } = useToast();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState("1.1508");
  const [amount, setAmount] = useState("");

  const asks = levels("ask", mid);
  const bids = levels("bid", mid);
  const isBuy = side === "buy";
  const isLimit = type === "limit";

  const placeOrder = () => {
    const amt = parseFloat(amount.replace(/,/g, "")) || 1000;
    const px = isLimit ? parseFloat(price) || mid : mid;
    showToast(
      isLimit ? "ORDER RESTING ON THE BOOK (DEMO)" : "MARKET ORDER FILLED (DEMO)",
      `${isBuy ? "Buy" : "Sell"} ${amt.toLocaleString("en-US")} USDC @ ${px.toFixed(4)} · not a real transaction`,
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <Toast title={toast?.title ?? null} body={toast?.body ?? null} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pairRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flexDirection: "row" }}>
              <UsdcIcon size={28} />
              <View style={{ marginLeft: -9 }}>
                <EurcIcon size={28} />
              </View>
            </View>
            <View>
              <Text style={styles.pairLabel}>USDC/EURC</Text>
              <Text style={styles.pairSub}>ON-CHAIN FX · ARC</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.lastPrice}>{midDisplay}</Text>
            <DemoBadge small />
          </View>
        </View>

        <View style={styles.book}>
          <View style={styles.bookHeaderRow}>
            <Text style={[styles.colHeader, { flex: 1.1 }]}>PRICE</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: "right" }]}>SIZE</Text>
            <Text style={[styles.colHeader, { flex: 0.8, textAlign: "right" }]}>TOTAL</Text>
          </View>
          {asks
            .slice()
            .reverse()
            .map((l, i) => (
              <View key={`ask-${i}`} style={styles.row}>
                <View style={[styles.depthBar, { width: `${l.depthPct}%`, backgroundColor: "rgba(229,72,77,0.13)" }]} />
                <Text style={[styles.rowText, { flex: 1.1, color: colors.ask }]}>{l.price}</Text>
                <Text style={[styles.rowText, { flex: 1, textAlign: "right", color: "rgba(245,241,230,0.75)" }]}>{l.size}</Text>
                <Text style={[styles.rowText, { flex: 0.8, textAlign: "right", color: colors.inkFaint }]}>{l.total}</Text>
              </View>
            ))}
          <View style={styles.midRow}>
            <Text style={styles.midPrice}>{midDisplay}</Text>
            <Text style={styles.midSub}>◆ MID · 3.5 bps</Text>
          </View>
          {bids.map((l, i) => (
            <View key={`bid-${i}`} style={styles.row}>
              <View style={[styles.depthBar, { width: `${l.depthPct}%`, backgroundColor: "rgba(47,191,113,0.13)" }]} />
              <Text style={[styles.rowText, { flex: 1.1, color: colors.bid }]}>{l.price}</Text>
              <Text style={[styles.rowText, { flex: 1, textAlign: "right", color: "rgba(245,241,230,0.75)" }]}>{l.size}</Text>
              <Text style={[styles.rowText, { flex: 0.8, textAlign: "right", color: colors.inkFaint }]}>{l.total}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ticket}>
          <View style={styles.segment}>
            <Pressable style={[styles.segmentBtn, { backgroundColor: isBuy ? colors.bid : "transparent" }]} onPress={() => setSide("buy")}>
              <Text style={[styles.segmentText, { color: isBuy ? "#08240F" : colors.inkFaint }]}>BUY</Text>
            </Pressable>
            <Pressable style={[styles.segmentBtn, { backgroundColor: !isBuy ? colors.ask : "transparent" }]} onPress={() => setSide("sell")}>
              <Text style={[styles.segmentText, { color: !isBuy ? "#2A0A0A" : colors.inkFaint }]}>SELL</Text>
            </Pressable>
          </View>

          <View style={styles.typeRow}>
            <Pressable onPress={() => setType("limit")}>
              <Text style={[styles.typeText, { color: isLimit ? colors.limestone : colors.inkFaint, borderBottomColor: isLimit ? colors.gold : "transparent" }]}>LIMIT</Text>
            </Pressable>
            <Pressable onPress={() => setType("market")}>
              <Text style={[styles.typeText, { color: !isLimit ? colors.limestone : colors.inkFaint, borderBottomColor: !isLimit ? colors.gold : "transparent" }]}>MARKET</Text>
            </Pressable>
          </View>

          {isLimit && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>PRICE</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <Pressable onPress={() => setPrice(mid.toFixed(4))}>
                <Text style={styles.midButton}>MID</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>AMOUNT</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(245,241,230,0.3)"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.inputSuffix}>USDC</Text>
          </View>

          <View style={styles.pctRow}>
            {PCTS.map((p) => (
              <Pressable key={p} style={styles.pctBtn} onPress={() => setAmount(Math.round(12480 * (p / 100)).toLocaleString("en-US"))}>
                <Text style={styles.pctText}>{p}%</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.submit, { backgroundColor: isBuy ? colors.bid : colors.ask }]} onPress={placeOrder}>
            <Text style={styles.submitText}>
              {isBuy ? "BUY" : "SELL"} USDC · {isLimit ? "LIMIT" : "MARKET"}
            </Text>
          </Pressable>
          <View style={styles.feeRow}>
            <Text style={styles.feeText}>TAKER / MAKER 2.0 / 0.0 bps</Text>
            <Text style={[styles.feeText, { color: colors.bid }]}>GAS &lt; $0.01 flat</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 130, paddingHorizontal: 18, paddingBottom: 180 },
  pairRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  pairLabel: { color: colors.limestone, fontFamily: "monospace", fontSize: 15, fontWeight: "700" },
  pairSub: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, marginTop: 2 },
  lastPrice: { color: colors.bid, fontFamily: "monospace", fontSize: 19, fontWeight: "700" },
  book: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, padding: 12 },
  bookHeaderRow: { flexDirection: "row", paddingHorizontal: 6, paddingBottom: 8 },
  colHeader: { color: "rgba(245,241,230,0.4)", fontFamily: "monospace", fontSize: 9.5, letterSpacing: 1 },
  row: { flexDirection: "row", paddingHorizontal: 6, paddingVertical: 5, position: "relative", borderRadius: 6, overflow: "hidden" },
  depthBar: { position: "absolute", top: 0, bottom: 0, right: 0 },
  rowText: { fontFamily: "monospace", fontSize: 12 },
  midRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(231,178,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(231,178,90,0.35)",
  },
  midPrice: { color: colors.gold, fontFamily: "monospace", fontSize: 16, fontWeight: "700" },
  midSub: { color: colors.gold, fontFamily: "monospace", fontSize: 10 },
  ticket: { marginTop: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.mortar, borderRadius: 20, padding: 14 },
  segment: { flexDirection: "row", gap: 6, backgroundColor: colors.basalt, padding: 4, borderRadius: 12, marginBottom: 14 },
  segmentBtn: { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: "center" },
  segmentText: { fontFamily: "monospace", fontWeight: "700", fontSize: 13 },
  typeRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  typeText: { fontFamily: "monospace", fontSize: 11, letterSpacing: 1, fontWeight: "700", paddingBottom: 4, borderBottomWidth: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.basalt,
    borderWidth: 1,
    borderColor: "rgba(245,241,230,0.10)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputLabel: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 10, letterSpacing: 1, width: 60 },
  input: { flex: 1, color: colors.limestone, fontFamily: "monospace", fontSize: 16, paddingVertical: 13, textAlign: "right" },
  midButton: { color: colors.gold, fontFamily: "monospace", fontSize: 10, fontWeight: "700", marginLeft: 10 },
  inputSuffix: { color: "rgba(245,241,230,0.5)", fontFamily: "monospace", fontSize: 11, marginLeft: 10 },
  pctRow: { flexDirection: "row", gap: 6, marginVertical: 10 },
  pctBtn: { flex: 1, paddingVertical: 7, alignItems: "center", backgroundColor: "rgba(245,241,230,0.05)", borderWidth: 1, borderColor: colors.mortar, borderRadius: 8 },
  pctText: { color: "rgba(245,241,230,0.7)", fontFamily: "monospace", fontSize: 11 },
  submit: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 4 },
  submitText: { color: "#08240F", fontFamily: "monospace", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
  feeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  feeText: { color: colors.inkFaint, fontFamily: "monospace", fontSize: 11 },
});
