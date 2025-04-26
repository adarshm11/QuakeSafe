import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { router } from "expo-router";

type NavButtonProps = {
  to: string;
  label: string;
};

export default function NavButton({ to, label }: NavButtonProps) {
  // Using type assertion to handle the router's expected path type
  const handleNavigation = () => {
    router.push(to as any);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleNavigation}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  button: {
    backgroundColor: "#0a7ea4",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
