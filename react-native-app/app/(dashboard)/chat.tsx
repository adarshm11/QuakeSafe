import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { ThemedView } from "../../components/ThemedView";
import { ThemedText } from "../../components/ThemedText";
import type { ScrollView as ScrollViewType } from "react-native";
import axios from "axios";
import supabase from "../../services/supabaseClient";
const { width } = Dimensions.get("window");

const Chat = () => {
    const [messages, setMessages] = useState([
        { sender: "assistant", text: "Hello! I'm your QuakeSafe assistant. How can I help you with earthquake safety today?" },
    ]);
    const [userInput, setUserInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollViewType>(null);
    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    // Fetch user ID when component mounts
    useEffect(() => {
        const fetchUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                console.log("Current user ID:", user.id);
            }
        };

        fetchUserId();
    }, []);
    
    const sendMessage = async () => {
        if (!userInput.trim()) return;
    
        // Add the user's message to the chat
        setMessages((prevMessages) => [...prevMessages, { sender: "user", text: userInput }]);
        
        // Store the current input before clearing
        const currentInput = userInput;
        
        // Clear the input field immediately for better UX
        setUserInput("");
        
        // Show loading state
        setIsLoading(true);
    
        try {
          // Send the user's input to the backend
          const response = await axios.post(`${API_URL}/chat`, {
            user_id: userId,
            prompt: currentInput,
          }, {
            headers: {
                "Content-Type": "application/json",
            }
          });
          
          const data = response.data;
    
          if (data.response) {
            // Add Claude's response to the chat
            setMessages((prevMessages) => [...prevMessages, { sender: "assistant", text: data.response }]);
          } else {
            // Handle empty response
            setMessages((prevMessages) => [...prevMessages, { 
              sender: "assistant", 
              text: "Sorry, I didn't receive a proper response. Please try again." 
            }]);
          }
        } catch (error) {
          console.error("Error communicating with backend:", error);

          const errorMessage = error instanceof Error ? error.message : "Unknown error";

          setMessages((prevMessages) => [...prevMessages, { 
            sender: "assistant", 
            text: `Sorry, I couldn't connect to the server. Please check your connection or try again later. (Error: ${errorMessage})` 
          }]);
        } finally {
          setIsLoading(false);
        }
    };

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "#0a0a0a" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ThemedView style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
            {/* Ambient glow background */}
            <View style={styles.ambientGlow} />
            
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={styles.title} type="title">
                QuakeSafe Assistant
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Get real-time earthquake safety information
              </ThemedText>
            </View>
    
            {/* Chat */}
            <ScrollView 
              style={styles.chatContainer}
              ref={scrollViewRef}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    message.sender === "user" ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <ThemedText style={styles.messageText}>{message.text}</ThemedText>
                </View>
              ))}
              
              {/* Loading spinner */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#b7f740" />
                  <ThemedText style={styles.loadingText}>QuakeSafe Assistant is responding...</ThemedText>
                </View>
              )}
            </ScrollView>
    
            {/* Input */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask QuakeSafe Assistant..."
                placeholderTextColor="#888"
                value={userInput}
                onChangeText={setUserInput}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  !userInput.trim() ? styles.sendButtonDisabled : {}
                ]} 
                onPress={sendMessage}
                disabled={!userInput.trim() || isLoading}
              >
                <ThemedText style={styles.sendButtonText}>Send</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    borderRadius: 18,
    padding: 15,
    maxWidth: "80%",
    marginVertical: 8,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: "rgba(183, 247, 64, 0.15)",
    borderColor: "rgba(183, 247, 64, 0.4)",
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: "rgba(183, 247, 64, 0.05)",
    borderColor: "rgba(183, 247, 64, 0.2)",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#e0e0e0",
    fontSize: 16,
  },
  inputArea: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(183, 247, 64, 0.2)",
  },
  textInput: {
    flex: 1,
    height: 50,
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderRadius: 25,
    paddingHorizontal: 20,
    color: "#e0e0e0",
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
  },
  sendButton: {
    backgroundColor: "rgba(183, 247, 64, 0.8)",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(183, 247, 64, 0.3)",
  },
  sendButtonText: {
    color: "#111",
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(183, 247, 64, 0.05)",
    borderColor: "rgba(183, 247, 64, 0.2)",
    borderWidth: 1,
    alignSelf: "flex-start",
    marginVertical: 8,
  },
  loadingText: {
    color: "#b7f740",
    marginLeft: 10,
    fontSize: 14,
  }
});
