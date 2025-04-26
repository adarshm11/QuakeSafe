import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const UserDashboard = () => {
  const [image, setImage] = useState<string | null>(null);

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
      setImage(result.assets[0].uri); // Set the selected image URI
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
      setImage(result.assets[0].uri); // Set the captured image URI
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

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <Text style={styles.imageText}>Image Uploaded Successfully!</Text>
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
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
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
});
