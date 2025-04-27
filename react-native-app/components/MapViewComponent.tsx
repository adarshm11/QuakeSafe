import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Region, Callout } from "react-native-maps";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have expo/vector-icons installed

type ImageLocation = {
  id: string;
  user_id: string;
  image_url: string;
  longitude: number;
  latitude: number;
  location_name: string | null;
};

type SafetyAssessment = {
  id: string;
  image_id: string;
  safety_score: number;
  estimated_magnitude_survivability: string;
  description: string;
  created_at: string;
};

type MapViewComponentProps = {
  region: Region;
  locationPins: ImageLocation[];
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Add this helper function above your component (or inside, before return)
const renderMagnitudeAdvice = (magnitudeStr?: string | null) => {
  if (!magnitudeStr) return null;
  let magnitude_value: number | null = null;
  if (typeof magnitudeStr === "number") {
    magnitude_value = magnitudeStr;
  } else if (typeof magnitudeStr === "string") {
    const match = magnitudeStr.match(/[\d.]+/);
    magnitude_value = match ? parseFloat(match[0]) : null;
  }
  if (magnitude_value === null || isNaN(magnitude_value)) return null;

  if (magnitude_value < 6.0) {
    return (
      <Text style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 4 }}>
        🚨 Leave Immediately
      </Text>
    );
  } else if (magnitude_value < 7.0) {
    return (
      <Text style={{ color: "#f59e0b", fontWeight: "bold", marginBottom: 4 }}>
        ⚠️ Caution: Building Needs Strengthening
      </Text>
    );
  } else {
    return (
      <Text style={{ color: "#22c55e", fontWeight: "bold", marginBottom: 4 }}>
        🏠 Safe
      </Text>
    );
  }
};

const MapViewComponent = ({
  region,
  locationPins: initialPins,
}: MapViewComponentProps) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [locationPins, setLocationPins] =
    useState<ImageLocation[]>(initialPins);
  const [safetyAssessments, setSafetyAssessments] = useState<
    Record<string, SafetyAssessment | null>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>(
    {}
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLocationPins(initialPins);
  }, [initialPins]);

  const fetchSafetyAssessment = async (imageId: string) => {
    // Skip if we already have data or are currently loading
    if (safetyAssessments[imageId] !== undefined || loadingStates[imageId]) {
      return;
    }

    try {
      // Set loading state for this specific location
      setLoadingStates((prev) => ({ ...prev, [imageId]: true }));

      const response = await axios.get(
        `${API_URL}/safety_assessments/${imageId}`
      );

      if (
        response.data &&
        response.data.safety_assessments &&
        response.data.safety_assessments.length > 0
      ) {
        setSafetyAssessments((prev) => ({
          ...prev,
          [imageId]: response.data.safety_assessments[0],
        }));
      } else {
        setSafetyAssessments((prev) => ({ ...prev, [imageId]: null }));
        setErrorStates((prev) => ({
          ...prev,
          [imageId]: "No safety assessment available",
        }));
      }
    } catch (error) {
      console.error("Error fetching safety assessment:", error);
      setErrorStates((prev) => ({
        ...prev,
        [imageId]: "Failed to load safety data",
      }));
      setSafetyAssessments((prev) => ({ ...prev, [imageId]: null }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [imageId]: false }));
    }
  };

  const handleMarkerPress = (location: ImageLocation) => {
    setSelectedLocationId(location.id);
    fetchSafetyAssessment(location.id);
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch fresh location pins data
      const response = await axios.get(`${API_URL}/images`);
      if (response.data && response.data.images) {
        // Filter out any locations without valid coordinates
        const validLocations = response.data.images.filter(
          (image: ImageLocation) =>
            image.latitude != null && image.longitude != null
        );
        setLocationPins(validLocations);

        // Clear cached safety assessment data to force fresh fetches
        setSafetyAssessments({});
        setErrorStates({});
        setLoadingStates({});
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {locationPins.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.location_name || "Photo Location"}
            description="Tap to view details"
            onPress={() => handleMarkerPress(location)}
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.locationName}>
                  {(location.location_name && location.location_name.trim()) ||
                    "Location Photo"}
                </Text>

                <Image
                  source={{ uri: location.image_url }}
                  style={styles.calloutImage}
                />

                {loadingStates[location.id] ? (
                  <Text style={styles.loadingText}>Loading assessment...</Text>
                ) : errorStates[location.id] ? (
                  <Text style={styles.errorText}>
                    {errorStates[location.id]}
                  </Text>
                ) : safetyAssessments[location.id] ? (
                  <ScrollView style={styles.assessmentScrollView}>
                    <Text style={styles.assessmentTitle}>
                      Safety Assessment
                    </Text>
                    <View style={styles.assessmentRow}>
                      <Text style={styles.assessmentLabel}>Safety Score:</Text>
                      <Text
                        style={[
                          styles.assessmentValue,
                          {
                            color: getSafetyScoreColor(
                              safetyAssessments[location.id]?.safety_score || 0
                            ),
                          },
                        ]}
                      >
                        {safetyAssessments[location.id]?.safety_score}/100
                      </Text>
                    </View>
                    <View style={styles.assessmentRow}>
                      <Text style={styles.assessmentLabel}>
                        Max Earthquake:
                      </Text>
                      <Text style={styles.assessmentValue}>
                        {
                          safetyAssessments[location.id]
                            ?.estimated_magnitude_survivability
                        }
                      </Text>
                    </View>
                    {/* Add magnitude advice with emoji */}
                    {renderMagnitudeAdvice(
                      safetyAssessments[location.id]
                        ?.estimated_magnitude_survivability
                    )}
                    <Text style={styles.descriptionLabel}>Issues:</Text>
                    <Text style={styles.description}>
                      {safetyAssessments[location.id]?.description}
                    </Text>
                  </ScrollView>
                ) : (
                  <Text>Tap to load assessment</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Refresh Button */}
      <View style={styles.refreshButtonContainer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshData}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="refresh" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Helper function to determine color based on safety score
const getSafetyScoreColor = (score: number): string => {
  if (score >= 80) return "#22c55e"; // Green for high safety
  if (score >= 50) return "#f59e0b"; // Amber for medium safety
  return "#ef4444"; // Red for low safety
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  calloutContainer: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  calloutImage: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 12,
  },
  assessmentScrollView: {
    maxHeight: 200,
  },
  assessmentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  assessmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  assessmentLabel: {
    fontWeight: "bold",
    fontSize: 13,
  },
  assessmentValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  descriptionLabel: {
    fontWeight: "bold",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: "#333",
    lineHeight: 16,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 12,
    marginVertical: 8,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 12,
    marginVertical: 8,
  },
  refreshButtonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  refreshButton: {
    backgroundColor: "#a5d223",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default MapViewComponent;
