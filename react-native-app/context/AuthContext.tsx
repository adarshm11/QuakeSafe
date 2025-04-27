import React, { createContext, useState, useEffect, useContext } from "react";
import supabase from "../services/supabaseClient";
import { Session, User, AuthResponse } from "@supabase/supabase-js";

interface ExtendedUser extends User {
  name?: string; // Add name as an optional property
}
interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name:string) => Promise<AuthResponse>; // Changed return type
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up listener for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("name")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
        } else {
          setUser({ ...session.user, name: profile?.name }); // Merge name into user object
        }
      }
    };

    fetchUserProfile();
  }, [session]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> => {
    try {
      // Register the user with Supabase Auth
      const response = await supabase.auth.signUp({ email, password });
      if (response.error) throw response.error;
  
      // Get the user ID from the registration response
      const userId = response.data.user?.id;
      if (!userId) throw new Error("Failed to get user ID after registration");
  
      // Insert the user's name into the user_profiles table
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: userId,
            email: email,
            name: name, // Store the name
          },
        ]);
  
      if (profileError) throw profileError;
  
      return response; // Return the full response
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
