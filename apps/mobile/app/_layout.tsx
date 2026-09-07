import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { PrivyProvider } from "@privy-io/expo";
import { colors } from "../lib/theme";
import { arcTestnet } from "../lib/chain";

const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

export default function RootLayout() {
  // Both env vars come from a Privy dashboard app the team creates themselves — see
  // apps/mobile/README.md. Rendering without them (e.g. a fresh clone before setup) would only
  // fail deep inside Privy's SDK, so surface a clear message instead.
  if (!PRIVY_APP_ID || !PRIVY_CLIENT_ID) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.basalt, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.limestone, fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
          Missing Privy config
        </Text>
        <Text style={{ color: colors.inkFaint, textAlign: "center" }}>
          Set EXPO_PUBLIC_PRIVY_APP_ID and EXPO_PUBLIC_PRIVY_CLIENT_ID in apps/mobile/.env — see
          apps/mobile/README.md.
        </Text>
      </View>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      supportedChains={[arcTestnet]}
      config={{
        embedded: {
          ethereum: {
            // Every new passkey signup gets a wallet immediately — that IS the onboarding flow,
            // there's no separate "create a wallet" step for the user to get stuck on.
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.basalt },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="get-started" options={{ presentation: "modal" }} />
      </Stack>
    </PrivyProvider>
  );
}
