import React from "react";
import { View, StyleSheet } from "react-native";

interface SpacerProps {
  height?: number;
}

const Spacer: React.FC<SpacerProps> = ({ height = 20 }) => {
  return <View style={[styles.spacer, { height }]} />;
};

const styles = StyleSheet.create({
  spacer: {
    width: "100%",
  },
});

export default Spacer;
