import { StyleSheet } from "react-native";
import { Link } from "expo-router";

import { ThemedView } from "../components/ThemedView";
import { ThemedText } from "../components/ThemedText";
import Spacer from "../components/Spacer";
import { Colors } from "../constants/Colors";

const Home = () => {
  return (
    <ThemedView style={styles.container}>
      <Spacer />

      <ThemedText style={styles.title}>
        QuakeSafe
      </ThemedText>

      <ThemedText style={{ marginTop: 10, marginBottom: 30 }}>
        Earthquake safety app
      </ThemedText>

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText>Login</ThemedText>
      </Link>

      <Link href="/(auth)/register" style={styles.link}>
        <ThemedText>Register</ThemedText>
      </Link>

      <Link href="/(dashboard)/profile" style={styles.link}>
        <ThemedText>Profile</ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    marginVertical: 20,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
  },
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
});
