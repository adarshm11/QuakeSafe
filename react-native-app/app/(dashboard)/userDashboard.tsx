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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import supabase from "../../services/supabaseClient";
import axios from "axios";


const API_URL = process.env.EXPO_PUBLIC_API_URL;

const UserDashboard = () => {
  const [image, setImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string>("");
  const [showLocationInput, setShowLocationInput] = useState<boolean>(false);

  // Get user ID and location on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      // Get user ID from Supabase session
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Get profile ID from user_profiles table
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

      // Get location permission
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

  // Get current location
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
    // Request permission to access media library
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

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);

      // Ask user if they want to use current location or specify manually
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
    // Request camera permission
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

    // Open camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // When taking a photo, always use current location
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
      if (!currentLocation) return;

      formData.append("longitude", currentLocation.longitude.toString());
      formData.append("latitude", currentLocation.latitude.toString());
    } else {
      // Use manual location string
      formData.append("location_name", locationName);
    }

    setUploading(true);
    setAnalysisResult(null);

    try {
      // Upload to your backend
      const response = await axios.post(
        `${API_URL}/analyze`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle successful response
      if (response.data && response.data.analysis) {
        setAnalysisResult(response.data.analysis);
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", "There was an error uploading your image.");
    } finally {
      setUploading(false);
      setShowLocationInput(false);
    }
  };

  // Function to handle manual location submission
  const submitManualLocation = () => {
    if (!locationName.trim()) {
      Alert.alert(
        "Location Required",
        "Please enter a specific location (e.g., 'San Jose City Hall')"
      );
      return;
    }

    if (image) {
      uploadImageWithData(image, false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earthquake Safety Dashboard</Text>
      <Text style={styles.subtitle}>
        Upload an image of your city to help us analyze safety measures.
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Upload Image" onPress={pickImage} />
        <View style={styles.buttonSpacer} />
        <Button title="Take Photo" onPress={takePhoto} />
      </View>

      {showLocationInput && (
        <View style={styles.locationInputContainer}>
          <Text style={styles.locationLabel}>
            Please specify location (be specific, e.g., San Jose City Hall"):
          </Text>
          <TextInput
            style={styles.locationInput}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Enter specific location..."
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
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Analyzing image...</Text>
        </View>
      )}

      {image && !uploading && !showLocationInput && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <Text style={styles.imageText}>Image Uploaded Successfully!</Text>
        </View>
      )}

      {analysisResult && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>Safety Analysis:</Text>
          <Text style={styles.analysisText}>{analysisResult}</Text>
        </View>
      )}
    </View>
  );
};

export default UserDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#b7f740",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#e0e0e0",
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
    color: "green",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
  analysisContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    width: "100%",
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  locationInputContainer: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#eaeaea",
    borderRadius: 8,
  },
  locationLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
  },
  locationInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
