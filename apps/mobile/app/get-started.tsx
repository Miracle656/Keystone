import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { usePrivy } from "@privy-io/expo";
import { useLoginWithPasskey, useSignupWithPasskey } from "@privy-io/expo/passkey";
import { colors } from "../lib/theme";

// The domain that must serve /.well-known/apple-app-site-association (iOS) and
// /.well-known/assetlinks.json (Android) — see apps/mobile/README.md. Defaults to the deployed
// web app since that's the domain we already control; override per-environment if needed.
const RELYING_PARTY =
  process.env.EXPO_PUBLIC_PASSKEY_RELYING_PARTY ?? "https://keystone-web-nine.vercel.app";

export default function GetStarted() {
  const { isReady } = usePrivy();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [error, setError] = useState<string | null>(null);

  const { signupWithPasskey, state: signupState } = useSignupWithPasskey({
    onSuccess: () => router.replace("/(tabs)/home"),
    onError: (e) => setError(readableError(e)),
  });
  const { loginWithPasskey, state: loginState } = useLoginWithPasskey({
    onSuccess: () => router.replace("/(tabs)/home"),
    onError: (e) => setError(readableError(e)),
  });

  const state = mode === "signup" ? signupState : loginState;
  const busy = state?.status && state.status !== "initial" && state.status !== "done" && state.status !== "error";

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get started</Text>
      <Text style={styles.subtitle}>
        No seed phrase, no extension — just your device's Face ID / fingerprint. This creates a
        real wallet on Arc Testnet behind the scenes.
      </Text>

      <Pressable
        style={[styles.button, styles.primary]}
        disabled={!!busy}
        onPress={() => {
          setError(null);
          signupWithPasskey({ relyingParty: RELYING_PARTY });
        }}
      >
        {busy && mode === "signup" ? (
          <ActivityIndicator color={colors.basalt} />
        ) : (
          <Text style={styles.primaryLabel}>Create my wallet with a passkey</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.secondary}
        disabled={!!busy}
        onPress={() => {
          setMode("login");
          setError(null);
          loginWithPasskey({ relyingParty: RELYING_PARTY });
        }}
      >
        <Text style={styles.secondaryLabel}>I already have a Keystone passkey</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function readableError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong — try again.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.basalt,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    color: colors.limestone,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.inkFaint,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  button: {
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.gold,
  },
  primaryLabel: {
    color: colors.basalt,
    fontWeight: "700",
    fontSize: 15,
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: colors.mortar,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryLabel: {
    color: colors.limestone,
    fontSize: 14,
  },
  error: {
    color: colors.ask,
    fontSize: 13,
    textAlign: "center",
  },
});
