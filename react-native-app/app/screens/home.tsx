import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { imageService, Image as ImageType } from "../../services/imageService";

export default function HomeScreen() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (user) {
      loadImages();
    }
  }, [user]);

  const loadImages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userImages = await imageService.getUserImages(user.id);
      setImages(userImages);
      setError(null);
    } catch (error: any) {
      setError("Failed to load images");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (!user) return;

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Pick an image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!user) return;

    try {
      setUploading(true);
      const uploadedImage = await imageService.uploadImage(user.id, imageUri);
      setImages([uploadedImage, ...images]);
      setError(null);
    } catch (error: any) {
      setError("Failed to upload image");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation to login screen will be handled by the AuthNavigator
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Images</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={pickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={styles.loader} />
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image_url }} style={styles.image} />
              {item.room_name && (
                <Text style={styles.roomName}>Room: {item.room_name}</Text>
              )}
            </View>
          )}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: "#0a7ea4",
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#0a7ea4",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageGrid: {
    paddingBottom: 20,
  },
  imageContainer: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  image: {
    width: "100%",
    height: 150,
  },
  roomName: {
    padding: 8,
    fontSize: 12,
    textAlign: "center",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

