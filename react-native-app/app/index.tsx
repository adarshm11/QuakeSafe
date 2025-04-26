import { StyleSheet, Image, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import { Link } from "expo-router";

import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import Spacer from "../components/Spacer";
import { Colors } from "../constants/Colors";

const Home = () => {

  const fadeAnim = useRef(new Animated.Value(0)).current; // start at invisible

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.1,   // slight transparency, not fully invisible
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);
  

  return (
    <ThemedView style={styles.container}>
      <Spacer />

      {/* Regular Static Logo */}
      <Animated.Image
        source={require("../assets/images/quake-wave.png")}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />

      <ThemedText style={styles.title}>
        QuakeSafe
      </ThemedText>

      <ThemedText style={{ marginTop: 10, marginBottom: 30 }}>
        Earthquake safety app
      </ThemedText>

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText style={{ color: "#b7f740"}}>Login</ThemedText>
      </Link>

      <Link href="/(auth)/register" style={styles.link}>
        <ThemedText style={{ color: "#b7f740"}}>Register</ThemedText>
      </Link>

      <Link href="/(dashboard)/profile" style={styles.link}>
        <ThemedText style={{ color: "#b7f740"}}>Profile</ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 100,
    backgroundColor: "#000",
  },
  logo: {
    width: 400,
    height: 150,
    marginBottom: 20,
  },
  img: {
    marginVertical: 20,
  },
  title: {
    fontWeight: "bold",
    fontSize: 25,
    color: "#b7f740",
  },
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
});
