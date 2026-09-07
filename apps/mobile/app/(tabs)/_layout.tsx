import { useState } from "react";
import { View } from "react-native";
import { Tabs, router } from "expo-router";
import { colors } from "../../lib/theme";
import { TabBar } from "../../components/TabBar";
import { QuickActionsSheet } from "../../components/QuickActionsSheet";

export default function TabsLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <TabBar {...props} sheetOpen={sheetOpen} onToggleSheet={() => setSheetOpen((v) => !v)} />
        )}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="trade" />
        <Tabs.Screen name="earn" />
        <Tabs.Screen name="activity" />
      </Tabs>

      <QuickActionsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSwap={() => {
          setSheetOpen(false);
          router.push("/swap");
        }}
        onBridge={() => {
          setSheetOpen(false);
          router.push("/bridge");
        }}
      />
    </View>
  );
}
