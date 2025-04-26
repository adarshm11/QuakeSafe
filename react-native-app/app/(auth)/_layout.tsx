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
        <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    );
  };

  return (
    <>
      <StatusBar barStyle="default" />
      <Stack
        screenOptions={{
          headerShown: true, // Enable the header
          animation: "none",
          headerLeft: () => <BackButton />, // Add the back button
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  backText: {
    marginLeft: 5,
    color: "#0a7ea4",
    fontSize: 16,
  },
});
