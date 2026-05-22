import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Mode = 'equipe' | 'admin';

interface ModeContextType {
  mode: Mode;
  isAdmin: boolean;
  switchToAdmin: (pin: string) => boolean;
  switchToEquipe: () => void;
  adminPin: string;
  updateAdminPin: (oldPin: string, newPin: string) => boolean;
}

const ModeContext = createContext<ModeContextType>({
  mode: 'equipe',
  isAdmin: false,
  switchToAdmin: () => false,
  switchToEquipe: () => {},
  adminPin: '1234',
  updateAdminPin: () => false,
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('equipe');
  const [adminPin, setAdminPin] = useState('1234');

  useEffect(() => {
    AsyncStorage.getItem('mkube_admin_pin').then((p) => { if (p) setAdminPin(p); });
  }, []);

  const switchToAdmin = (pin: string): boolean => {
    if (pin === adminPin) { setMode('admin'); return true; }
    return false;
  };

  const switchToEquipe = () => setMode('equipe');

  const updateAdminPin = (oldPin: string, newPin: string): boolean => {
    if (oldPin !== adminPin) return false;
    setAdminPin(newPin);
    AsyncStorage.setItem('mkube_admin_pin', newPin);
    return true;
  };

  return (
    <ModeContext.Provider value={{ mode, isAdmin: mode === 'admin', switchToAdmin, switchToEquipe, adminPin, updateAdminPin }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
