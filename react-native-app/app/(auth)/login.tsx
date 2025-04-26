import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Animated,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import Spacer from "../../components/Spacer";
import ThemedButton from "../../components/ThemedButton";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
      console.log("Login successful");
      router.push("/userDashboard");
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Ambient glow background */}
      <View style={styles.ambientGlow} />
      
      <Spacer height={40} />
      <ThemedText style={styles.title}>
        Login to QuakeSafe
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Access your personalized safety information
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

      <Spacer height={15} />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Spacer height={30} />

      <ThemedButton 
        onPress={handleLogin} 
        disabled={loading} 
        style={styles.loginButton}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginButtonText}>Log In</Text>
        )}
      </ThemedButton>

      <Spacer height={60} />
      
      <Link href="/register" replace>
        <ThemedText style={styles.registerText}>
          Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
        </ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0a0a0a",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: "40%",
    width: width,
    height: width,
    borderRadius: width,
    backgroundColor: "rgba(183, 247, 64, 0.03)",
    transform: [{scaleX: 1.5}]
  },
  title: {
    fontSize: width > 400 ? 32 : 25,
    fontWeight: "bold",
    color: "#b7f740",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
    borderRadius: 30,
    paddingHorizontal: 20,
    width: width * 0.85,
    color: "#e0e0e0",
    backgroundColor: "rgba(20, 20, 20, 0.8)",
    fontSize: 16,
  },
  loginButton: {
    width: width * 0.7,
    height: 54,
    borderRadius: 30,
    backgroundColor: "#b7f740",
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  error: {
    color: "#ff5252",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },
  registerText: {
    textAlign: "center",
    color: "#a0a0a0",
    fontSize: 15,
  },
  registerHighlight: {
    color: "#b7f740",
    fontWeight: "600",
  }
});
