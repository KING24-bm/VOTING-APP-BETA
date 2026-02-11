import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  teacherId: string | null;
  login: (staffCode: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTeacherId = localStorage.getItem('teacherId');
    if (storedTeacherId) {
      setTeacherId(storedTeacherId);
    }
    setIsLoading(false);
  }, []);

  const login = async (staffCode: string): Promise<boolean> => {
    try {
      const code = staffCode.trim();
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('id')
        .eq('staff_code', code)
        .maybeSingle();

      if (error) throw error;

      // Only allow login if the staff code already exists.
      // Do NOT auto-create new teacher rows here.
      if (teacher) {
        setTeacherId(teacher.id);
        localStorage.setItem('teacherId', teacher.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setTeacherId(null);
    localStorage.removeItem('teacherId');
  };

  return (
    <AuthContext.Provider value={{ teacherId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
