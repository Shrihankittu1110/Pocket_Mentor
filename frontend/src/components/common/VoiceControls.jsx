import React from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Square } from 'lucide-react';

export const VoiceControls = ({
  isSpeaking,
  isPaused,
  onSpeak,
  onPause,
  onResume,
  onStop,
  onRepeat,
  label = "Read Aloud",
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-full px-2 py-1 shadow-sm">
        {!isSpeaking ? (
          <button
            onClick={onSpeak}
            className="flex items-center gap-1 text-xs font-bold text-mentor-blue hover:text-blue-700 transition"
            title="Read aloud"
          >
            <Volume2 className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            {isPaused ? (
              <button
                onClick={onResume}
                className="p-1 text-xs text-mentor-green hover:text-green-700"
                title="Resume"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-1 text-xs text-amber-500 hover:text-amber-600"
                title="Pause"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onRepeat}
              className="p-1 text-xs text-slate-500 hover:text-slate-700"
              title="Repeat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStop}
              className="p-1 text-xs text-red-500 hover:text-red-600"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            {/* Animated sound wave bars */}
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-3 bg-mentor-blue rounded-full animate-pulse"></span>
              <span className="w-1 h-4 bg-mentor-blue rounded-full animate-pulse delay-75"></span>
              <span className="w-1 h-2 bg-mentor-blue rounded-full animate-pulse delay-150"></span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2 text-slate-700">
      <Volume2 className="w-5 h-5 text-mentor-blue" />
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-1.5 ml-2 border-l border-blue-200 pl-3">
        {!isSpeaking ? (
          <button
            onClick={onSpeak}
            className="flex items-center gap-1 px-3 py-1 bg-mentor-blue text-white text-xs font-bold rounded-xl shadow-duo-sm hover:brightness-105 active:translate-y-0.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onResume}
                className="px-2.5 py-1 bg-mentor-green text-white text-xs font-bold rounded-xl shadow-duo-sm hover:brightness-105"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-duo-sm hover:brightness-105"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            <button
              onClick={onRepeat}
              className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300"
              title="Repeat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStop}
              className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-xl hover:bg-red-200"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceControls;
