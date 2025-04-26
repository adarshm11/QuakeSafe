import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

// This file is no longer needed with Expo Router
// It's kept as a reference for navigation examples

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

export default function AppExample() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Example Navigation Component</Text>

      <TouchableOpacity
        style={{ padding: 15, backgroundColor: "#0a7ea4", borderRadius: 5 }}
        onPress={() => router.push("/screens/login")}
      >
        <Text style={{ color: "#fff" }}>Go to Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ padding: 15, backgroundColor: "#0a7ea4", borderRadius: 5 }}
        onPress={() => router.push("/screens/register")}
      >
        <Text style={{ color: "#fff" }}>Go to Register</Text>
      </TouchableOpacity>
    </View>
  );
}
