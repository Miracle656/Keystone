import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePrivy } from "@privy-io/expo";
import { colors } from "../../lib/theme";

export default function Settings() {
  const { user, logout } = usePrivy();

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>Arc Testnet — real chain, test funds</Text>

      {user && (
        <Pressable style={styles.logout} onPress={() => logout()}>
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.basalt, padding: 24 },
  badge: {
    color: colors.inkFaint,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.mortar,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  logout: { marginTop: 24, alignSelf: "flex-start" },
  logoutLabel: { color: colors.ask, fontSize: 14 },
});
