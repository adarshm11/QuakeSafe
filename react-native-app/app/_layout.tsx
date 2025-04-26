import { Stack } from "expo-router";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext"; // Import AuthProvider

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <AuthProvider>
      {/* Wrap the entire layout with AuthProvider */}
      <>
        <StatusBar />
        <Stack>
          {/* Groups */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />

          {/* Individual Screens */}
          <Stack.Screen name="index" options={{ title: "Home" }} />
        </Stack>
      </>
    </AuthProvider>
  );
}
