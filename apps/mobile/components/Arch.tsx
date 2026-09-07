import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Defs, RadialGradient, Stop, Ellipse, Line, Rect } from "react-native-svg";
import { colors } from "../lib/theme";

// Ported 1:1 from the Keystone Mobile design mockup's Component._arch()/_archStones() —
// the signature visual: a real arch of voussoirs whose radial length is cumulative order-book
// depth, bids rising on the left, asks on the right, keystone at mid. See KEYSTONE_PRD.md §8.
const CX = 160;
const CY = 124;
const N = 7;
const K = 3;
const R_IN = 58;
const GAP = 0.02;
const SIZES = [2600, 1900, 1300, 0, 1400, 2000, 2700];

function cum(i: number) {
  let c = 0;
  if (i < K) for (let j = i; j < K; j++) c += SIZES[j];
  else for (let j = K + 1; j <= i; j++) c += SIZES[j];
  return c;
}
function pol(a: number, r: number): [number, number] {
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}
function wedge(i: number, R: number) {
  const s = Math.PI - (Math.PI * i) / N - GAP;
  const e = Math.PI - (Math.PI * (i + 1)) / N + GAP;
  const [x1, y1] = pol(s, R);
  const [x2, y2] = pol(e, R);
  const [x3, y3] = pol(e, R_IN);
  const [x4, y4] = pol(s, R_IN);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${R_IN},${R_IN} 0 0 0 ${x4.toFixed(1)},${y4.toFixed(1)} Z`;
}

type Stone = {
  d: string;
  steps: number;
  bid: boolean;
  fill: string;
  labelColor: string;
  px: number;
  py: number;
  sx: number;
  sy: number;
  size: string;
  price: string;
};

function buildArch(mid: number): { stones: Stone[]; keystoneD: string } {
  const tick = 0.0002;
  const stones: Stone[] = [];
  for (let i = 0; i < N; i++) {
    if (i === K) continue;
    const R = R_IN + 14 + Math.min(44, cum(i) / 125);
    const steps = Math.abs(i - K);
    const k = steps / 3;
    const m = Math.PI - (Math.PI * (i + 0.5)) / N;
    const [px, py] = pol(m, R + 10);
    const [sx, sy] = pol(m, (R_IN + R) / 2);
    const bid = i < K;
    stones.push({
      d: wedge(i, R),
      steps,
      bid,
      fill: bid ? `rgba(47,191,113,${(0.34 + 0.3 * k).toFixed(2)})` : `rgba(229,72,77,${(0.34 + 0.3 * k).toFixed(2)})`,
      labelColor: bid ? colors.bid : colors.ask,
      px: (px / 320) * 100,
      py: (py / 132) * 100,
      sx: (sx / 320) * 100,
      sy: (sy / 132) * 100,
      size: (SIZES[i] / 1000).toFixed(1) + "K",
      price: (bid ? mid - tick * steps : mid + tick * steps).toFixed(4),
    });
  }
  return { stones, keystoneD: wedge(K, 96) };
}

export function Arch({ mid, midDisplay }: { mid: number; midDisplay: string }) {
  const { stones, keystoneD } = buildArch(mid);

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 320 132" width="100%" height="100%">
        <Defs>
          <RadialGradient id="archGlow" cx="50%" cy="100%" r="60%">
            <Stop offset="0" stopColor={colors.gold} stopOpacity={0.28} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={160} cy={124} rx={118} ry={58} fill="url(#archGlow)" />
        <Line x1={26} y1={124} x2={294} y2={124} stroke="rgba(245,241,230,0.14)" strokeWidth={1} />
        {stones.map((s, i) => (
          <Path key={i} d={s.d} fill={s.fill} stroke={colors.panel} strokeWidth={2} />
        ))}
        <Path d={keystoneD} fill={colors.gold} stroke={colors.panel} strokeWidth={2} />
        <Rect x={129} y={4} width={62} height={18} rx={5} fill={colors.gold} />
      </Svg>

      {stones.map((s, i) => (
        <View key={i} pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Text style={[styles.label, { left: `${s.px}%`, top: `${s.py}%`, color: s.labelColor, fontWeight: "700", fontSize: 7.5 }]}>
            {s.price}
          </Text>
          <Text style={[styles.label, { left: `${s.sx}%`, top: `${s.sy}%`, color: "rgba(245,241,230,0.9)", fontSize: 7 }]}>{s.size}</Text>
        </View>
      ))}
      <Text style={[styles.label, { left: "50%", top: "9.9%", color: colors.basalt, fontWeight: "700", fontSize: 10.5 }]}>
        {midDisplay}
      </Text>
      <Text style={[styles.label, { left: "50%", top: "45%", color: "rgba(11,20,36,0.8)", fontWeight: "700", fontSize: 7 }]}>MID</Text>
      <Text style={[styles.label, { left: "8.5%", top: "88%", color: colors.bid, fontSize: 8, letterSpacing: 1 }]}>BIDS ▸</Text>
      <Text style={[styles.label, { left: "91.5%", top: "88%", color: colors.ask, fontSize: 8, letterSpacing: 1 }]}>◂ ASKS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 320 / 132,
    position: "relative",
  },
  label: {
    position: "absolute",
    fontFamily: "monospace",
    // RN 0.74+ (New Architecture) supports percentage transforms — same centering trick as the
    // web mockup's translate(-50%, -50%).
    transform: [{ translateX: "-50%" as unknown as number }, { translateY: "-50%" as unknown as number }],
  },
});
