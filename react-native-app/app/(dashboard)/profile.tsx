import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../context/AuthContext"; // Import useAuth

const Profile = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("(123) 456-7890");
  const [isEditing, setIsEditing] = useState(false);
  const today = new Date().toLocaleDateString();

  const saveChanges = () => {
    setIsEditing(false);
    Alert.alert("Profile Updated", "Your profile details have been updated.");
    // Add logic to save changes to your backend or state management system
  };

  const safeText = (text?: unknown, fallback = "Unavailable") =>
    typeof text === "string" ? text : fallback;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient Glow */}
        <View style={styles.ambientGlow} />

        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://via.placeholder.com/150" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>
            {safeText(user?.name, "No name available")}
          </Text>
          <Text style={styles.email}>
            {safeText(user?.email, "No email available")}
          </Text>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Profile Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>San Jose, CA</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            {isEditing ? (
              <TextInput
                style={styles.detailInput}
                value={phone}
                onChangeText={setPhone}
                underlineColorAndroid="transparent"
                placeholder="Enter your phone"
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.detailValue}>{phone}</Text>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Created:</Text>
            <Text style={styles.detailValue}>{today}</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? saveChanges() : setIsEditing(true))}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0a", // Match the app background color
  },
  scrollView: {
    backgroundColor: "#0a0a0a", // Match the app background color
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: "30%",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(183, 247, 64, 0.03)",
    transform: [{ scaleX: 1.5 }],
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#b7f740",
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
    color: "#a0a0a0",
  },
  detailsCard: {
    backgroundColor: "rgba(20, 20, 20, 0.8)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#b7f740",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#a0a0a0",
  },
  detailValue: {
    fontSize: 14,
    color: "#e0e0e0",
  },
  detailInput: {
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#b7f740",
    flex: 1,
    textAlign: "right",
    backgroundColor: "transparent",
    color: "#e0e0e0",
  },
  editButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
  },
  editButtonText: {
    color: "#b7f740",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)",
  },
  logoutButtonText: {
    color: "#b7f740",
    fontSize: 16,
    fontWeight: "bold",
  },
});
