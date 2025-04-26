import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, StyleSheet } from "react-native";
import UserDashboard from "./userDashboard"; 
import Profile from "./profile";
import Settings from "./settings"; 
import Chat from "./chat";

const Tab = createBottomTabNavigator();

export default function DashboardLayout() {
  const BackButton = () => {
    const navigation = useNavigation();
    return (
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = "home";
          } else if (route.name === "Profile") {
            iconName = "person";
          } else if (route.name === "Settings") {
            iconName = "settings";
          }

          return <Ionicons/>;
        },
        tabBarActiveTintColor: "#0a7ea4",
        tabBarInactiveTintColor: "gray",
        headerLeft: () => <BackButton />, // Add back button to the header
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={UserDashboard}
        options={{ title: "Dashboard", headerShown: true }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Profile", headerShown: true }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{ title: "Settings", headerShown: true }}
      />
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{ title: "Chat", headerShown: true }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  backText: {
    marginLeft: 5,
    color: "#0a7ea4",
    fontSize: 16,
  },
});
