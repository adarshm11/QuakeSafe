import React, { useState } from "react";
import { StyleSheet, TextInput, ActivityIndicator, Text } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import ThemedButton from "../../components/ThemedButton";

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
      await signUp(email, password);
      alert("Check your email for the confirmation link");
      router.push("/(auth)/login");
    } catch (error: any) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText style={styles.title}>
        Register an Account
      </ThemedText>

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
