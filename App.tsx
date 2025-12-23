import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import Sidebar from './components/Sidebar';
import ObsidianChat from './components/ObsidianChat';
import VeoStudio from './components/VeoStudio';
import LiveSession from './components/LiveSession';
import Marketplace from './components/Marketplace';

const App: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>(ViewMode.OBSIDIAN_CHAT);
  const [keyReady, setKeyReady] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // Check for aistudio presence using casting to avoid window interface conflicts
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (hasKey) {
          setKeyReady(true);
        }
      } else {
        // Fallback for environments without injected aistudio
        setKeyReady(true);
      }
    };
    checkKey();
  }, []);

  const handleKeySelect = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // Assume success per instructions
      setKeyReady(true);
    }
  };

  if (!keyReady && (window as any).aistudio) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-8 text-center">
        <h1 className="text-4xl font-mono text-neon mb-4">MANUS + SORA</h1>
        <p className="max-w-md mb-8 text-gray-400">
          Access to Sovereign Intelligence requires a secure billing uplik for Veo Generation.
        </p>
        <button 
          onClick={handleKeySelect}
          className="bg-neon text-black px-8 py-3 rounded font-bold font-mono hover:bg-white transition"
        >
          SELECT API KEY
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="mt-4 text-xs text-gray-600 hover:text-gray-400">
          Billing Documentation
        </a>
      </div>
    );
  }

  const renderContent = () => {
    switch (mode) {
      case ViewMode.OBSIDIAN_CHAT:
        return <ObsidianChat />;
      case ViewMode.VEO_STUDIO:
      case ViewMode.IMAGE_LAB:
        return <VeoStudio />;
      case ViewMode.LIVE_WIRE:
        return <LiveSession />;
      case ViewMode.BASE44_MARKET:
        return <Marketplace />;
      case ViewMode.NOTION_DASHBOARD:
        return <div className="flex items-center justify-center h-full text-gray-500 font-mono">DASHBOARD MODULE OFFLINE</div>;
      case ViewMode.GITHUB_REMIX:
        return <div className="flex items-center justify-center h-full text-gray-500 font-mono">GIT REMIX MODULE OFFLINE</div>;
      default:
        return <ObsidianChat />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      <Sidebar currentMode={mode} setMode={setMode} />
      <main className="flex-1 h-full relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;