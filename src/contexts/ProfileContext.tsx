import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Profile {
  id: string;
  user_id: string;
  profile_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (profileName: string) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  updateProfile: (profileId: string, profileName: string, avatarUrl?: string) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfiles();
    } else {
      setProfiles([]);
      setActiveProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setProfiles(data);
        const active = data.find(p => p.is_active) || data[0];
        setActiveProfile(active);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = async (profileId: string) => {
    if (!user) return;

    try {
      // Deactivate all profiles
      await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected profile
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', profileId);

      if (error) throw error;

      await loadProfiles();
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  };

  const createProfile = async (profileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          profile_name: profileName,
          is_active: false,
        });

      if (error) throw error;

      await loadProfiles();
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user || profiles.length <= 1) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      await loadProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  const updateProfile = async (profileId: string, profileName: string, avatarUrl?: string) => {
    if (!user) return;

    try {
      const updates: any = { profile_name: profileName };
      if (avatarUrl !== undefined) {
        updates.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      await loadProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    profiles,
    activeProfile,
    switchProfile,
    createProfile,
    deleteProfile,
    updateProfile,
    loading,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
