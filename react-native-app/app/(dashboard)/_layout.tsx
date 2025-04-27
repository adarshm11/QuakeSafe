import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, StyleSheet } from "react-native";
import UserDashboard from "./userDashboard";
import Profile from "./profile";
import Settings from "./settings";
import Maps from "./Maps";
import Chat from "./chat";

const Tab = createBottomTabNavigator();

export default function DashboardLayout() {
  const BackButton = () => {
    const navigation = useNavigation();
    return (
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#b7f740" />
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
          } else if (route.name === "Maps") {
            iconName = "map";
          } else if (route.name === "Chat") {
            iconName = "chatbubbles";
          }

          // Return the icon with the correct name
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        // Tab bar styling
        tabBarActiveTintColor: "#b7f740",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#333",
          paddingBottom: 5,
          paddingTop: 5,
        },
        // Header styling
        headerStyle: {
          backgroundColor: "#0a0a0a",
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
          color: "#b7f740",
        },
        headerTintColor: "#b7f740",
        headerLeft: () => <BackButton />,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={UserDashboard}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen name="Maps" component={Maps} options={{ title: "Maps" }} />
      <Tab.Screen name="Chat" component={Chat} options={{ title: "Chat" }} />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{ title: "Settings" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  backText: {
    marginLeft: 5,
    color: "#b7f740",
    fontSize: 16,
    fontWeight: "500",
  },
});
