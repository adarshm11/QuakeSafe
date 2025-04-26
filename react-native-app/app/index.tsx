import { StyleSheet, Animated, Easing, Dimensions, View, Text } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Link } from "expo-router";

const ThemedView = View;
const ThemedText = Text;

const { width, height } = Dimensions.get("window");

const Home = () => {
  const wavesAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wave movement animation
    Animated.loop(
      Animated.timing(wavesAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Content fade-in animation
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Button entrance animation
    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 1000,
      delay: 500,
      easing: Easing.back(1),
      useNativeDriver: true,
    }).start(() => setIsReady(true));
  }, []);

  // Transform for the wave effect
  const waveTransform = wavesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, 0],
  });

  // Button animations
  const buttonsTranslateY = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const buttonsOpacity = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ThemedView style={styles.container}>
      {/* Ambient glow background */}
      <View style={styles.ambientGlow} />
      
      {/* Background waves animation */}
      <Animated.View 
        style={[
          styles.wavesContainer, 
          { transform: [{ translateX: waveTransform }] },
        ]}
      >
        <View style={styles.wave} />
      </Animated.View>

      {/* App Info - Centered */}
      <Animated.View style={[styles.contentContainer, { opacity: contentAnim }]}>
        <ThemedText style={styles.title}>
          QuakeSafe
        </ThemedText>

        <ThemedText style={styles.tagline}>
          Stay prepared. Stay safe.
        </ThemedText>

        <ThemedText style={styles.description}>
          Real-time alerts, safety tips, and personalized earthquake preparedness for you and your loved ones.
        </ThemedText>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[
        styles.buttonContainer,
        {
          opacity: buttonsOpacity,
          transform: [{ translateY: buttonsTranslateY }]
        }
      ]}>
        <Link href="/(auth)/login">
          <View style={styles.primaryButton}>
            <ThemedText style={styles.primaryButtonText}>Log In</ThemedText>
          </View>
        </Link>

        {/* Added spacing View */}
        <View style={styles.buttonSpacer} />

        <Link href="/(auth)/register">
          <View style={styles.primaryButton}>
            <ThemedText style={styles.primaryButtonText}>Register</ThemedText>
          </View>
        </Link>
      </Animated.View>

      {/* Safety stats */}
      {isReady && (
        <View style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            Helping households stay prepared daily
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // Center everything
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    top: height * 0.3,
    width: width,
    height: width,
    borderRadius: width, 
    backgroundColor: "rgba(183, 247, 64, 0.03)",
    transform: [{scaleX: 1.5}]
  },
  wavesContainer: {
    position: "absolute",
    width: width * 2,
    height: height,
    zIndex: 0,
  },
  wave: {
    position: "absolute",
    top: height * 0.3,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: "rgba(183, 247, 64, 0.05)",
    borderRadius: 300,
    transform: [{ rotate: "-15deg" }, { scaleX: 2 }],
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontWeight: "bold",
    fontSize: 42,
    color: "#b7f740",
    textAlign: "center",
    marginBottom: 16,
  },
  tagline: {
    fontSize: 20,
    color: "#e0e0e0",
    marginBottom: 24,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    maxWidth: "80%",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonSpacer: {
    height: 20, // Space between buttons
  },
  primaryButton: {
    width: width * 0.7,
    height: 54,
    borderRadius: 30,
    backgroundColor: "#b7f740",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
  statsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#808080",
    textAlign: "center",
  }
});
