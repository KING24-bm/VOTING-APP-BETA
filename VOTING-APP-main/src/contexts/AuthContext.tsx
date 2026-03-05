import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  teacherId: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string, schoolName: string) => Promise<boolean>;
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const user = username.trim();
      // In a production system the password should be hashed and verified
      // with a secure hashing algorithm. Here we're just doing a simple
      // equality check for demonstration purposes.
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('id')
        .eq('username', user)
        .eq('password', password)
        .maybeSingle();

      if (error) throw error;

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

  const signup = async (username: string, email: string, password: string, schoolName: string): Promise<boolean> => {
    try {
      const user = username.trim();
      
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('teachers')
        .select('id')
        .eq('username', user)
        .maybeSingle();

      if (existingUser) {
        console.error('Username already exists');
        return false;
      }

      // Insert new teacher
      const { data: newTeacher, error } = await supabase
        .from('teachers')
        .insert([
          {
            username: user,
            email: email.trim(),
            password: password, // In production, this should be hashed
            school_name: schoolName.trim(),
          }
        ])
        .select('id')
        .single();

      if (error) throw error;

      if (newTeacher) {
        setTeacherId(newTeacher.id);
        localStorage.setItem('teacherId', newTeacher.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    setTeacherId(null);
    localStorage.removeItem('teacherId');
  };

  return (
    <AuthContext.Provider value={{ teacherId, login, signup, logout, isLoading }}>
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
