import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapViewComponent from "../../components/MapViewComponent";
import useCurrentLocation from "../../hooks/useCurrentLocation";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const Maps = () => {
  const { location, error } = useCurrentLocation();
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);

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
        <View>
          <Text>Error fetching location: {error}</Text>
        </View>
      ) : (
        mapRegion && <MapViewComponent region={mapRegion} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Maps;
