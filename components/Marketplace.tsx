import React from 'react';
import { MarketplaceItem } from '../types';
import { ShoppingBag, Star, Download, QrCode } from 'lucide-react';

const Marketplace: React.FC = () => {
  const items: MarketplaceItem[] = [
    { id: '1', title: 'Sovereign Finance Bot', price: '44 BASE', author: 'Manus', tags: ['Finance', 'Agent'], description: 'Automated ledger tracking with Notion sync.' },
    { id: '2', title: 'Obsidian Research Graph', price: 'FREE', author: 'Sora', tags: ['Education', 'Graph'], description: 'Pre-configured vaults for deep research.' },
    { id: '3', title: 'Veo Storyboarder', price: '12 BASE', author: 'Anon', tags: ['Video', 'Creative'], description: 'Generate storyboard frames using Gemini Pro.' },
  ];

  return (
    <div className="p-8 h-full bg-gray-900 overflow-y-auto">
      <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
        <div>
            <h1 className="text-3xl font-mono text-white mb-2">BASE44 MARKET</h1>
            <p className="text-gray-500 font-mono text-sm">DECENTRALIZED ASSET EXCHANGE</p>
        </div>
        <button className="bg-neon text-black px-4 py-2 font-mono font-bold text-sm hover:bg-white rounded">PUBLISH ASSET</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
            <div key={item.id} className="bg-black border border-gray-800 rounded-lg p-6 hover:border-neon transition-colors group">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-900 p-3 rounded text-neon">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-neon font-bold">{item.price}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon">{item.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {item.tags.map(t => <span key={t} className="text-xs bg-gray-900 text-gray-300 px-2 py-1 rounded">{t}</span>)}
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 bg-gray-800 text-white py-2 rounded text-sm font-mono hover:bg-gray-700 flex items-center justify-center gap-2">
                        <Download className="w-4 h-4"/> INSTALL
                    </button>
                    <button className="px-3 bg-gray-800 text-white rounded hover:bg-gray-700">
                        <QrCode className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;