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
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('id')
        .eq('staff_code', staffCode)
        .maybeSingle();

      if (error) throw error;

      if (teacher) {
        setTeacherId(teacher.id);
        localStorage.setItem('teacherId', teacher.id);
        return true;
      } else {
        const { data: newTeacher, error: insertError } = await supabase
          .from('teachers')
          .insert({ staff_code: staffCode })
          .select('id')
          .single();

        if (insertError) throw insertError;

        setTeacherId(newTeacher.id);
        localStorage.setItem('teacherId', newTeacher.id);
        return true;
      }
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
