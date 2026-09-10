import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundFx } from '../utils/soundSynthesizer';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('pocket_mentor_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('pocket_mentor_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => setSoundEnabled(prev => !prev);

  const playFlip = () => {
    if (soundEnabled) soundFx.playFlip();
  };

  const playCorrect = () => {
    if (soundEnabled) soundFx.playCorrect();
  };

  const playWrong = () => {
    if (soundEnabled) soundFx.playWrong();
  };

  const playFanfare = () => {
    if (soundEnabled) soundFx.playFanfare();
  };

  const playStreakFlame = () => {
    if (soundEnabled) soundFx.playStreakFlame();
  };

  const playAchievement = () => {
    if (soundEnabled) soundFx.playAchievement();
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playFlip,
        playCorrect,
        playWrong,
        playFanfare,
        playStreakFlame,
        playAchievement,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
