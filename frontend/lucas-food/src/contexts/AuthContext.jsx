import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async function signUp({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "",
        },
      },
    });

    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
