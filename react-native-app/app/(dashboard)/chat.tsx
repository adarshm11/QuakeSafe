import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import Spacer from "../../components/Spacer";

const { width } = Dimensions.get("window");

const Chat = () => {
  return (
    <ThemedView style={styles.container}>
      {/* Ambient glow background */}
      <View style={styles.ambientGlow} />
      
      {/* Header section */}
      <View style={styles.header}>
        <ThemedText style={styles.title} type="title">
          QuakeSafe Assistant
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Get real-time earthquake safety information
        </ThemedText>
      </View>
      
      {/* Chat container - will hold messages */}
      <View style={styles.chatContainer}>
        {/* Placeholder for chat messages */}
        <View style={styles.messageBubble}>
          <ThemedText style={styles.messageText}>
            Hello! I'm your QuakeSafe assistant. How can I help you with earthquake safety today?
          </ThemedText>
        </View>
      </View>
      
      {/* Chat input area placeholder */}
      <View style={styles.inputArea}>
        <View style={styles.inputPlaceholder}>
          <ThemedText style={styles.inputPlaceholderText}>
            Ask QuakeSafe Assistant
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: "30%",
    width: width,
    height: width,
    borderRadius: width,
    backgroundColor: "rgba(183, 247, 64, 0.03)",
    transform: [{scaleX: 1.5}]
  },
  header: {
    width: "100%",
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(183, 247, 64, 0.2)",
  },
  title: {
    fontSize: width > 400 ? 28 : 22,
    fontWeight: "bold",
    color: "#b7f740",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#a0a0a0",
    textAlign: "center",
  },
  chatContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  messageBubble: {
    backgroundColor: "rgba(183, 247, 64, 0.1)",
    borderRadius: 18,
    padding: 15,
    maxWidth: "80%",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
  },
  messageText: {
    color: "#e0e0e0",
    fontSize: 16,
  },
  inputArea: {
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(183, 247, 64, 0.2)",
  },
  inputPlaceholder: {
    height: 54,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
    borderRadius: 30,
    paddingHorizontal: 20,
    width: "100%",
    backgroundColor: "rgba(20, 20, 20, 0.8)",
    justifyContent: "center",
  },
  inputPlaceholderText: {
    color: "#888",
    fontSize: 14,
    textAlign: "left",
    width: "100%",
  }
});