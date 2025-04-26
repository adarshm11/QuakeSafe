import { useEffect } from "react";
import { Redirect, router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (user) {
    // User is authenticated, redirect to home/tabs
    return <Redirect href="/(tabs)" />;
  } else {
    // User is not authenticated, redirect to login
    return <Redirect href="/screens/login" />;
  }
}
