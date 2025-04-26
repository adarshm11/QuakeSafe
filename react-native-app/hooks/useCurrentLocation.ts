import { useEffect, useState } from "react";
import * as Location from "expo-location";

type Location = {
  latitude: number;
  longitude: number;
};

type UseCurrentLocationReturn = {
  location: Location;
  error: string | null;
};

const useCurrentLocation = (): UseCurrentLocationReturn => {
  const [location, setLocation] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Permission to access location was denied");
        return;
      }

      try {
        // Get the current position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        setError("Error getting location");
        console.error(err);
      }
    })();
  }, []);

  return { location, error };
};

export default useCurrentLocation;
