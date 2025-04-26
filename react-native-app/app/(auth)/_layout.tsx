import React from "react";
import { Stack } from "expo-router";
import { StatusBar, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function AuthLayout() {
  const BackButton = () => {
    const navigation = useNavigation();
    return (
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#b7f740" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: true, // Enable the header
          animation: "none",
          headerStyle: {
            backgroundColor: "#0a0a0a", // Dark background for headers
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
            color: "#b7f740", // Green text for headers
          },
          headerTintColor: "#b7f740", // Green tint color for other header elements
          headerLeft: () => <BackButton />, // Add the back button
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: "Login", 
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: "Register",
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  backText: {
    marginLeft: 5,
    color: "#b7f740", // Updated to match accent color
    fontSize: 16,
    fontWeight: "500",
  },
});
