import React from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VoiceCommandIndicator = ({
  isListening,
  onToggleListening,
  lastCommand,
  availableCommands = ["Next", "Repeat", "Show Answer", "Easy", "Hard"]
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-3 px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleListening}
          className={`relative p-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            isListening
              ? 'bg-red-500 text-white shadow-duo-red animate-pulse'
              : 'bg-mentor-purple text-white shadow-duo-purple hover:brightness-105'
          }`}
          title={isListening ? "Stop Voice Commands" : "Enable Hands-Free Voice Commands"}
        >
          {isListening ? (
            <>
              <Mic className="w-5 h-5 animate-bounce" />
              <span className="text-xs uppercase tracking-wider font-extrabold">Listening...</span>
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5" />
              <span className="text-xs font-bold">Voice Commands</span>
            </>
          )}
        </button>

        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Say: </span>
          {availableCommands.map((cmd, idx) => (
            <span key={cmd} className="inline-block bg-white/80 border border-purple-100 rounded-md px-1.5 py-0.5 mx-0.5 font-mono text-[11px] text-purple-700">
              "{cmd}"
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lastCommand && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 bg-mentor-green text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-duo-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Command: {lastCommand.toUpperCase()}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCommandIndicator;
