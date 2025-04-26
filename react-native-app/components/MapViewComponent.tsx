import React from "react";
import { StyleSheet, Platform } from "react-native";
import { Region } from "react-native-maps";

// Define the props interface
type MapViewComponentProps = {
  region: Region;
};

// Create a platform-specific component
const MapViewComponent: React.FC<MapViewComponentProps> = ({ region }) => {
  // For web platform
  if (Platform.OS === 'web') {
    // Dynamic import for web
    const WebMapView = require('react-native-web-maps').default;
    return (
      <WebMapView
        style={styles.map}
        center={{ lat: region.latitude, lng: region.longitude }}
        zoom={12}
      />
    );
  } 
  // For native platforms (iOS, Android)
  else {
    const MapView = require('react-native-maps').default;
    return <MapView style={styles.map} region={region} />;
  }
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapViewComponent;
