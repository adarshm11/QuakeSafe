import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView, // Import ScrollView
  Linking, // Import Linking
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import supabase from "../../services/supabaseClient";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type AnalysisResult = {
  Description: string;
  Score: number;
  "Magnitude Survivability": string;
};

const UserDashboard = () => {
  const [image, setImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<
    AnalysisResult | string | null
  >(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string>("");
  const [showLocationInput, setShowLocationInput] = useState<boolean>(false);

  // Get user ID and location on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("email", user.email)
          .single();

        if (data) {
          setUserId(data.id);
        } else if (error) {
          console.error("Error fetching user profile:", error);
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "We need location permission to analyze your surroundings properly"
        );
        return;
      }
    };

    fetchUserData();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Location Error", "Could not get your current location");
      return null;
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need access to your media library to upload images."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);

      Alert.alert(
        "Location Information",
        "Do you want to use your current location or specify location manually?",
        [
          {
            text: "Use Current Location",
            onPress: () => {
              setUseCurrentLocation(true);
              setShowLocationInput(false);
              uploadImageWithData(result.assets[0].uri, true);
            },
          },
          {
            text: "Specify Manually",
            onPress: () => {
              setUseCurrentLocation(false);
              setShowLocationInput(true);
            },
          },
        ]
      );
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need access to your camera to take photos."
        );
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      uploadImageWithData(result.assets[0].uri, true);
    }
  };

  const uploadImageWithData = async (
    imageUri: string,
    useGPS: boolean = true
  ) => {
    if (!userId) {
      Alert.alert("Error", "User profile not found. Please log in again.");
      return;
    }

    setUploading(true);
    setAnalysisResult(null);

    try {
      // Prepare form data for upload
      const formData = new FormData();

      // Add the image file
      const filename = imageUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // @ts-ignore - TypeScript doesn't like FormData append
      formData.append("file", {
        uri: imageUri,
        name: filename,
        type,
      });

      // Add user ID
      formData.append("user_id", userId);

      // Handle location - either get current GPS location or use manual input
      if (useGPS) {
        // Get current location when uploading
        const currentLocation = await getCurrentLocation();
        if (!currentLocation) {
          setUploading(false);
          return;
        }

        formData.append("longitude", currentLocation.longitude.toString());
        formData.append("latitude", currentLocation.latitude.toString());
      } else {
        // Use manual location string - use Expo's geocoding instead of Google Places
        try {
          console.log(`Geocoding location: "${locationName}"`);
          formData.append("location_name", locationName);

          // Use Expo's geocoding which doesn't require Google API key
          const geocodedLocations = await Location.geocodeAsync(locationName);

          if (geocodedLocations && geocodedLocations.length > 0) {
            const lat = geocodedLocations[0].latitude;
            const lng = geocodedLocations[0].longitude;

            console.log("Geocoding successful:", { lat, lng });

            formData.append("longitude", lng.toString());
            formData.append("latitude", lat.toString());
          } else {
            throw new Error(
              "Could not find this location. Please try a more specific name."
            );
          }
        } catch (error) {
          console.error("Error with geocoding:", error);
          Alert.alert(
            "Location Error",
            "Could not find this location. Please try a more specific name."
          );
          setUploading(false);
          return;
        }
      }

      // At this point we have valid coordinates in the formData
      console.log("Sending data to server...");

      // Make the API request
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.analysis) {
        // Store the analysis object instead of trying to render it directly
        setAnalysisResult(response.data.analysis);
      } else {
        setAnalysisResult({
          Description: "Analysis completed, but no detailed results available.",
          Score: 0,
          "Magnitude Survivability": "Unknown",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Show more detailed error message
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        Alert.alert(
          "Upload Failed",
          `Server error (${error.response.status}): ${JSON.stringify(
            error.response.data
          )}`
        );
      } else {
        Alert.alert(
          "Upload Failed",
          "There was an error uploading your image."
        );
      }
    } finally {
      setUploading(false);
      setShowLocationInput(false);
    }
  };

  const submitManualLocation = () => {
    if (!locationName.trim()) {
      Alert.alert(
        "Location Required",
        "Please specify location (Be specific: type in the address):"
      );
      return;
    }

    if (image) {
      uploadImageWithData(image, false);
    }
  };

  // Reset function to clear all states
  const resetDashboard = () => {
    setImage(null);
    setLocation(null);
    setUploading(false);
    setAnalysisResult(null);
    setUseCurrentLocation(true);
    setLocationName("");
    setShowLocationInput(false);
  };

  // Handler for "Call 911" (does NOT actually call)
  const handleCall911 = () => {
    Alert.alert("Emergency Call", "This would call 911 in a real emergency.", [
      { text: "OK" },
    ]);
  };

  const handleSendLocationToContact = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      const emergencyNumber = "1234567890"; // Replace with actual contact
      const message = `I'm at this location: ${mapsUrl}`;
      const smsUrl = `sms:${emergencyNumber}?body=${encodeURIComponent(
        message
      )}`;
      Linking.openURL(smsUrl);
    } catch (error) {
      Alert.alert("Error", "Could not get your location.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -100} // Adjust offset as needed
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.ambientGlow} />
          <Text style={styles.title}>Earthquake Safety Dashboard</Text>
          <Text style={styles.subtitle}>
            Upload an image of your city to help us analyze safety measures.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.highlightedButton]}
              onPress={pickImage}
            >
              <Text
                style={[styles.actionButtonText, styles.highlightedButtonText]}
              >
                Upload Image
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity
              style={[styles.actionButton, styles.highlightedButton]}
              onPress={takePhoto}
            >
              <Text
                style={[styles.actionButtonText, styles.highlightedButtonText]}
              >
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>
          {/* Move Call 911 below as a full-width button */}
          <View
            style={{ width: "100%", alignItems: "center", marginBottom: 20 }}
          >
            <TouchableOpacity
              style={[styles.actionButton, { width: "80%" }]}
              onPress={handleCall911}
            >
              <Text style={styles.actionButtonText}>Call 911</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { width: "80%", marginTop: 10 }]}
              onPress={handleSendLocationToContact}
            >
              <Text style={styles.actionButtonText}>
                Send Location to Emergency Contact
              </Text>
            </TouchableOpacity>
          </View>

          {showLocationInput && (
            <View style={styles.locationInputContainer}>
              <Text style={styles.locationLabel}>
                Please specify location (Be specific: type in the address):
              </Text>
              <TextInput
                style={styles.locationInput}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Enter specific location..."
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitManualLocation}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

          {uploading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#b7f740" />
              <Text style={styles.loadingText}>Analyzing image...</Text>
            </View>
          )}

          {image &&
            !uploading &&
            !showLocationInput &&
            (!analysisResult || typeof analysisResult !== "string") && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <Text style={styles.imageText}>
                  Image Uploaded Successfully!
                </Text>
              </View>
            )}

          {analysisResult && (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>Safety Analysis:</Text>
              {typeof analysisResult === "string" ? (
                <Text style={styles.analysisText}>{analysisResult}</Text>
              ) : (
                <>
                  <Text style={styles.analysisLabel}>Description:</Text>
                  <Text style={styles.analysisText}>
                    {analysisResult.Description}
                  </Text>

                  <Text style={styles.analysisLabel}>Safety Score:</Text>
                  <View style={styles.scoreBarBackground}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${Math.max(
                            0,
                            Math.min(100, analysisResult.Score)
                          )}%`,
                        },
                      ]}
                    />
                    <Text style={styles.scoreBarText}>
                      {analysisResult.Score}/100
                    </Text>
                  </View>

                  <Text style={styles.analysisLabel}>
                    Magnitude Survivability:
                  </Text>
                  <View
                    style={[
                      styles.survivabilityBadge,
                      analysisResult["Magnitude Survivability"] === "High"
                        ? styles.survivabilityHigh
                        : analysisResult["Magnitude Survivability"] === "Medium"
                        ? styles.survivabilityMedium
                        : styles.survivabilityLow,
                    ]}
                  >
                    <Text style={styles.survivabilityBadgeText}>
                      {analysisResult["Magnitude Survivability"]}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
          {/* Conditionally Render the Done Button */}
          {image && !uploading && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={resetDashboard}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default UserDashboard;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30, // Add extra padding at the bottom for scrolling
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0a0a0a", // Matches profile.tsx background color
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: "30%",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(183, 247, 64, 0.03)", // Subtle glow effect
    transform: [{ scaleX: 1.5 }],
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#b7f740", // Matches profile.tsx title color
    marginTop: 50, // Add more top margin for scrolling
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#a0a0a0", // Matches profile.tsx subtitle color
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
  },
  buttonSpacer: {
    width: 20,
  },
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageText: {
    fontSize: 14,
    color: "#e0e0e0", // Matches profile.tsx general text color
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#a0a0a0", // Matches profile.tsx subtitle color
  },
  analysisContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "rgba(20, 20, 20, 0.8)", // Matches profile.tsx card background
    borderRadius: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)", // Matches profile.tsx border color
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#b7f740", // Matches profile.tsx title color
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#e0e0e0", // Matches profile.tsx general text color
  },
  actionButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)", // Matches profile.tsx button background
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)", // Matches profile.tsx border color
  },
  actionButtonText: {
    color: "#b7f740", // Matches profile.tsx title color
    fontSize: 16,
    fontWeight: "bold",
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#a0a0a0", // Updated to match the app's color scheme
  },
  locationInputContainer: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "rgba(20, 20, 20, 0.8)", // Matches profile.tsx input background
    borderRadius: 8,
  },
  locationLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#a0a0a0", // Matches profile.tsx subtitle color
  },
  locationInput: {
    backgroundColor: "#0a0a0a", // Matches profile.tsx input background
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
    fontSize: 16,
    color: "#e0e0e0",
  },
  submitButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
  },
  submitButtonText: {
    color: "#b7f740",
    fontWeight: "bold",
  },
  doneButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)", // Matches existing button styles
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)", // Matches existing border styles
  },
  doneButtonText: {
    color: "#b7f740", // Matches existing text color
    fontSize: 16,
    fontWeight: "bold",
  },
  highlightedButton: {
    backgroundColor: "#b7f740",
    borderColor: "#b7f740",
    shadowColor: "#b7f740",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  highlightedButtonText: {
    color: "#181818",
  },
  scoreBarBackground: {
    width: "100%",
    height: 24,
    backgroundColor: "#222",
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 2,
    overflow: "hidden",
    justifyContent: "center",
  },
  scoreBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#8ea82d",
    borderRadius: 12,
  },
  scoreBarText: {
    color: "#fff", // Changed from "#181818" to white
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
    zIndex: 1,
  },
  survivabilityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 2,
  },
  survivabilityHigh: {
    backgroundColor: "#b7f740",
  },
  survivabilityMedium: {
    backgroundColor: "#ffe066",
  },
  survivabilityLow: {
    backgroundColor: "#ff6b6b",
  },
  survivabilityBadgeText: {
    color: "#181818",
    fontWeight: "bold",
  },
});
