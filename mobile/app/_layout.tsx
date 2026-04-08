import "react-native-gesture-handler";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)"
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Iosevka: require("../assets/fonts/Iosevka-Regular.ttf"),
    IosevkaSemiBold: require("../assets/fonts/Iosevka-SemiBold.ttf"),
    IosevkaBold: require("../assets/fonts/Iosevka-Bold.ttf")
  });

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      border: theme.colors.border,
      card: theme.colors.surface,
      primary: theme.colors.accent,
      text: theme.colors.text
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="list/[id]"
              options={{
                headerBackButtonDisplayMode: "minimal",
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  color: theme.colors.text,
                  fontFamily: theme.fonts.medium
                }
              }}
            />
            <Stack.Screen
              name="task/edit/[id]"
              options={{
                headerBackButtonDisplayMode: "minimal",
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  color: theme.colors.text,
                  fontFamily: theme.fonts.medium
                }
              }}
            />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
