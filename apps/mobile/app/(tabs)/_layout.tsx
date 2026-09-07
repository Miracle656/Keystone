import { Tabs } from "expo-router";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.basalt },
        headerTintColor: colors.limestone,
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: { backgroundColor: colors.basalt, borderTopColor: colors.mortar },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.inkFaint,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Portfolio" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
