import { Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <AuthProvider>
      <>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#0a0a0a", // Dark background for headers
            },
            headerTintColor: "#b7f740", // Green text color for headers
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 18,
            },
            headerShadowVisible: false, // Remove header shadow
            contentStyle: {
              backgroundColor: "#0a0a0a", // Match the app background
            },
          }}
        >
          {/* Groups */}
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false, // Keep auth screens without headers
            }}
          />
          <Stack.Screen
            name="(dashboard)"
            options={{
              headerShown: false,
              title: "QuakeSafe Dashboard",
            }}
          />
          <Stack.Screen
            name="(chat)"
            options={{
              headerShown: true,
              title: "Safety Chat",
            }}
          />

          {/* Individual Screens */}
          <Stack.Screen
            name="index"
            options={{
              title: "Welcome!",
            }}
          />
        </Stack>
      </>
    </AuthProvider>
  );
}
