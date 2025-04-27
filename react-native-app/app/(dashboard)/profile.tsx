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
} from "react-native";
import { useAuth } from "../../context/AuthContext"; // Import useAuth

const Profile = () => {
  const { user } = useAuth(); // Access the authenticated user
  const [phone, setPhone] = useState("(123) 456-7890");
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const today = new Date().toLocaleDateString(); // Get today's date

  // Save changes (replace with your backend logic)
  const saveChanges = () => {
    setIsEditing(false);
    Alert.alert("Profile Updated", "Your profile details have been updated.");
    // Add logic to save changes to your backend or state management system
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Profile Header */}
      <View style={styles.header}>
       
        
        <Text style={styles.name}>{user?.name }</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Profile Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Profile Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>San Jose, CA</Text> {/* Hardcoded */}
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          {isEditing ? (
            <TextInput
              style={styles.detailInput}
              value={phone}
              onChangeText={setPhone}
              underlineColorAndroid="transparent" // Removes blue underline
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
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#0a0a0a", // Matches chat.tsx background color
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: "30%",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(183, 247, 64, 0.03)", // Subtle glow effect
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
    color: "#b7f740", // Matches chat.tsx title color
  },
  nameInput: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#b7f740", // Matches chat.tsx title color
    marginBottom: 5,
    textAlign: "center",
    backgroundColor: "transparent", // Ensures no background color
    color: "#b7f740", // Matches chat.tsx title color
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
    color: "#a0a0a0", // Matches chat.tsx subtitle color
  },
  detailsCard: {
    backgroundColor: "rgba(20, 20, 20, 0.8)", // Matches chat.tsx input background
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)", // Matches chat.tsx border color
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#b7f740", // Matches chat.tsx title color
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#a0a0a0", // Matches chat.tsx subtitle color
  },
  detailValue: {
    fontSize: 14,
    color: "#e0e0e0", // Matches chat.tsx general text color
  },
  detailInput: {
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#b7f740", // Matches chat.tsx title color
    flex: 1,
    textAlign: "right",
    backgroundColor: "transparent", // Ensures no background color
    color: "#e0e0e0", // Matches chat.tsx general text color
  },
  editButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)", // Matches chat.tsx button background
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)", // Matches chat.tsx border color
  },
  editButtonText: {
    color: "#b7f740", // Matches chat.tsx title color
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "rgba(183, 247, 64, 0.1)", // Matches chat.tsx button background
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(183, 247, 64, 0.3)", // Matches chat.tsx border color
  },
  logoutButtonText: {
    color: "#b7f740", // Matches chat.tsx title color
    fontSize: 16,
    fontWeight: "bold",
  },
});