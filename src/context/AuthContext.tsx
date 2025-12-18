import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile, Permission } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  permissions: Permission[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (permissionName: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile;
  };

  const fetchPermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_permissions")
      .select("permission:permissions(*)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }

    return (data || []).map((up: any) => up.permission as Permission);
  };

  const refreshProfile = async () => {
    if (!user) return;

    const profileData = await fetchProfile(user.id);
    setProfile(profileData);

    const permissionsData = await fetchPermissions(user.id);
    setPermissions(permissionsData);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        fetchPermissions(session.user.id).then(setPermissions);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        fetchPermissions(session.user.id).then(setPermissions);
      } else {
        setProfile(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const profileData = await fetchProfile(data.user.id);
      setProfile(profileData);
      const permissionsData = await fetchPermissions(data.user.id);
      setPermissions(permissionsData);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setPermissions([]);
  };

  const checkPermission = (permissionName: string): boolean => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    return permissions.some((p) => p.name === permissionName);
  };

  const hasRole = (role: string): boolean => {
    if (!profile) return false;
    return profile.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        permissions,
        loading,
        login,
        logout,
        checkPermission,
        hasRole,
        refreshProfile,
      }}
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

