import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGetMe, useLogin, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { AuthUser, LoginInput } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const [isLoading, setIsLoading] = useState(isUserLoading);

  useEffect(() => {
    setIsLoading(isUserLoading);
  }, [isUserLoading]);

  const login = async (data: LoginInput) => {
    await loginMutation.mutateAsync({ data });
    window.location.href = "/dashboard";
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login,
        logout,
        isSuperAdmin: user?.role === "super_admin",
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
