import React from 'react';
import { ViewMode } from '../types';
import { 
  Terminal, 
  Layout, 
  ShoppingBag, 
  Github, 
  Video, 
  Mic, 
  Image as ImageIcon,
  Workflow
} from 'lucide-react';

interface SidebarProps {
  currentMode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const items = [
    { mode: ViewMode.OBSIDIAN_CHAT, icon: Terminal, label: 'Obsidian Vault' },
    { mode: ViewMode.NOTION_DASHBOARD, icon: Layout, label: 'Notion Boards' },
    { mode: ViewMode.BASE44_MARKET, icon: ShoppingBag, label: 'Base44 Market' },
    { mode: ViewMode.GITHUB_REMIX, icon: Github, label: 'GitHub Remix' },
    { mode: ViewMode.IMAGE_LAB, icon: ImageIcon, label: 'Image Lab' },
    { mode: ViewMode.VEO_STUDIO, icon: Video, label: 'Veo Studio' },
    { mode: ViewMode.LIVE_WIRE, icon: Mic, label: 'Live Wire' },
  ];

  return (
    <div className="w-64 bg-black border-r border-gray-800 h-screen flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Workflow className="w-6 h-6 text-neon" />
        <span className="font-mono font-bold text-lg tracking-tighter">MANUS+SORA</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        {items.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-mono transition-colors
              ${currentMode === item.mode 
                ? 'bg-gray-800 text-neon border-r-2 border-neon' 
                : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 font-mono">
        <div className="mb-2">STATUS: SOVEREIGN</div>
        <div>NET: CONNECTED</div>
      </div>
    </div>
  );
};

export default Sidebar;