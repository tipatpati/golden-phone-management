
import { User, Session } from "@supabase/supabase-js";
import { UserRole } from "@/types/roles";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  userRole: UserRole | null;
  interfaceRole: UserRole | null;
  username: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (targetUserId: string, role: UserRole) => Promise<void>;
  checkAuthStatus: () => void;
}
