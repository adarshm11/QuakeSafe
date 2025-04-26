import React, { useState } from "react";
import { StyleSheet, TextInput, ActivityIndicator, Text } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import ThemedButton from "../../components/ThemedButton";
import supabase from "../../services/supabaseClient";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      // Register the user with Supabase Auth
      const response = await signUp(email, password);

      // Check if response and data exist
      if (!response || !response.data) {
        throw new Error("Failed to get valid response during registration");
      }

      const { data, error: signUpError } = response;

      if (signUpError) throw signUpError;

      // Get the user ID from the registration response
      const userId = data.user?.id;

      if (!userId) {
        throw new Error("Failed to get user ID after registration");
      }

      // Create a profile in the user_profiles table
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: userId,
            email: email,
          },
        ]);

      if (profileError) throw profileError;

      alert("Check your email for the confirmation link");
      router.push("/(auth)/login");
    } catch (error: any) {
      setError(error.message || "Registration failed");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText style={styles.title}>Register an Account</ThemedText>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <ThemedButton onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#f2f2f2" />
        ) : (
          <Text style={{ color: "#f2f2f2" }}>Register</Text>
        )}
      </ThemedButton>

      <Spacer height={100} />
      <Link href="/login" replace>
        <ThemedText style={{ textAlign: "center" }}>Login instead</ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 10,
    paddingHorizontal: 10,
    width: "100%",
    color: "#000",
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
