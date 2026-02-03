// hooks/useChessSounds.ts
import { useCallback, useRef } from "react";

export const useChessSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundBuffersRef = useRef<{ [key: string]: AudioBuffer }>({});

  const initSounds = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      console.log("🎵 Initializing chess sounds...");
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Load only 2 sound files
      const soundFiles = {
        move: "/chess/sound/move.mp3",
        capture: "/chess/sound/capture.mp3",
        // Removed check and checkmate sounds
      };

      for (const [key, url] of Object.entries(soundFiles)) {
        try {
          console.log(`🎵 Loading sound: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`❌ Failed to fetch ${url}: ${response.statusText}`);
            continue;
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer =
            await audioContextRef.current.decodeAudioData(arrayBuffer);
          soundBuffersRef.current[key] = audioBuffer;
          console.log(`✅ Sound loaded: ${key}`);
        } catch (error) {
          console.error(`❌ Error loading sound ${key}:`, error);
        }
      }
      console.log("🎵 All sounds initialized");
    } catch (error) {
      console.error("❌ Failed to initialize sounds:", error);
    }
  }, []);

  const playSound = useCallback(async (soundName: string) => {
    if (!audioContextRef.current) {
      console.warn("❌ Audio context not initialized");
      return;
    }

    // If the context is suspended, resume it.
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (!soundBuffersRef.current[soundName]) {
      console.warn(`❌ Sound ${soundName} not loaded.`);
      return;
    }

    try {
      console.log(`🎵 Playing sound: ${soundName}`);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = soundBuffersRef.current[soundName];
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (error) {
      console.error(`❌ Error playing sound ${soundName}:`, error);
    }
  }, []);

  const playMoveSound = useCallback(() => {
    console.log("🎵 Attempting to play move sound");
    playSound("move");
  }, [playSound]);

  const playCaptureSound = useCallback(() => {
    console.log("🎵 Attempting to play capture sound");
    playSound("capture");
  }, [playSound]);

  // Removed playCheckSound and playCheckmateSound functions

  return {
    initSounds,
    playMoveSound,
    playCaptureSound,
    // Removed playCheckSound and playCheckmateSound from return
  };
};