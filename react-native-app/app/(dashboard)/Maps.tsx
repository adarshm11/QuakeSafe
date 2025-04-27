import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import MapViewComponent from "../../components/MapViewComponent";
import useCurrentLocation from "../../hooks/useCurrentLocation";
import axios from "axios";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type ImageLocation = {
  id: string;
  user_id: string;
  image_url: string;
  longitude: number;
  latitude: number;
  location_name: string | null;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const Maps = () => {
  const { location, error } = useCurrentLocation();
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [locationPins, setLocationPins] = useState<ImageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch image locations from the API
  useEffect(() => {
    const fetchImageLocations = async () => {
      try {
        console.log("API_URL:", API_URL);
        setIsLoading(true);
        setFetchError(null);

        // Fetch image locations from API
        const response = await axios.get(`${API_URL}/images`);

        if (response.data && response.data.images) {
          // Filter out any locations without valid coordinates
          const validLocations = response.data.images.filter(
            (image: ImageLocation) =>
              image.latitude != null && image.longitude != null
          );
          setLocationPins(validLocations);
        } else {
          console.log("No images data in response");
          setLocationPins([]);
        }
      } catch (error) {
        console.error("Error fetching image locations:", error);
        setFetchError("Failed to load location data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImageLocations();
  }, []);

  // Set map region based on user's current location
  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [location]);

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.center}>
          <Text>Error fetching location: {error}</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Text>{fetchError}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      ) : (
        mapRegion && (
          <MapViewComponent region={mapRegion} locationPins={locationPins} />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
});

export default Maps;
