import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MapPin, Search, Brain, Image as ImageIcon, Video, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMessage, generateSpeech, transcribeAudio, decodeAudioData } from '../services/geminiService';
import { ChatMessage, GeminiModel } from '../types';

const ObsidianChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: '## Welcome to the Vault.\nI am Manus. System is ready. \n\n*Available Modules:*\n- Thinking (Pro)\n- Grounding (Maps/Search)\n- Analysis', timestamp: Date.now() }
  ]);
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [toolMode, setToolMode] = useState<'search' | 'maps' | null>(null);
  const [file, setFile] = useState<{data: string, mimeType: string, type: 'image' | 'audio'} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !file) || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      attachments: file ? [{ type: file.type, url: `data:${file.mimeType};base64,${file.data}`, mimeType: file.mimeType }] : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let model = GeminiModel.FLASH;
      if (thinkingMode) model = GeminiModel.PRO;
      
      // Check for audio input (transcription flow)
      if (file && file.mimeType.startsWith('audio/')) {
        const text = await transcribeAudio(file.data, file.mimeType);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: `**Transcription:**\n${text}`,
            timestamp: Date.now()
        }]);
        setFile(null);
        setLoading(false);
        return;
      }

      const imgParts = file && file.mimeType.startsWith('image/') ? [file] : [];
      
      const result = await sendMessage(
        model, 
        userMsg.text, 
        imgParts, 
        "You are Manus, a sovereign agent. Use Markdown. Be concise but deep.", 
        thinkingMode,
        toolMode
      );

      const text = result.text || "No response generated.";
      
      // Extract grounding info
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingLinks: {url: string, title: string}[] = [];
      
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) groundingLinks.push({ url: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
            if (chunk.maps?.placeAnswerSources) {
                 chunk.maps.placeAnswerSources.forEach((src: any) => {
                    if (src.reviewSnippets?.[0]?.uri) groundingLinks.push({ url: src.reviewSnippets[0].uri, title: "Google Maps Review" });
                 });
            }
        });
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        timestamp: Date.now(),
        grounding: groundingLinks,
        isThinking: thinkingMode
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: 'Error: Connection interrupted or refused by host.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFile({
            data: base64,
            mimeType: f.type,
            type: f.type.startsWith('image') ? 'image' : 'audio'
        });
      };
      reader.readAsDataURL(f);
    }
  };

  const playTTS = async (text: string) => {
    try {
        const audioData = await generateSpeech(text);
        if (audioData) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            const buffer = await decodeAudioData(audioData, ctx); 
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        }
    } catch (e) {
        console.error("TTS Failed", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-obsidian text-gray-300">
      {/* Header / Config Bar */}
      <div className="h-12 border-b border-gray-800 flex items-center px-4 gap-4 bg-black/50">
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setThinkingMode(!thinkingMode)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${thinkingMode ? 'border-plasma text-plasma bg-plasma/10' : 'border-gray-700 text-gray-500'}`}
            >
                <Brain className="w-3 h-3" /> THINKING {thinkingMode ? 'ON' : 'OFF'}
            </button>
            <button 
                onClick={() => setToolMode(toolMode === 'search' ? null : 'search')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${toolMode === 'search' ? 'border-blue-500 text-blue-500 bg-blue-500/10' : 'border-gray-700 text-gray-500'}`}
            >
                <Search className="w-3 h-3" /> WEB
            </button>
            <button 
                onClick={() => setToolMode(toolMode === 'maps' ? null : 'maps')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${toolMode === 'maps' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-gray-700 text-gray-500'}`}
            >
                <MapPin className="w-3 h-3" /> MAPS
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user' ? 'bg-gray-800' : 'bg-transparent border border-gray-800'}`}>
                {msg.attachments && msg.attachments.map((att, i) => (
                    <div key={i} className="mb-2">
                        {att.type === 'image' && <img src={att.url} className="max-h-48 rounded border border-gray-700" alt="attachment" />}
                        {att.type === 'audio' && <div className="flex items-center gap-2 text-xs bg-gray-900 p-2 rounded"><Mic className="w-3 h-3"/> Audio Input</div>}
                    </div>
                ))}
                
                <div className="prose prose-invert prose-sm font-sans">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {msg.grounding && msg.grounding.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-xs font-mono text-gray-500 mb-1">SOURCES:</p>
                        <div className="flex flex-wrap gap-2">
                            {msg.grounding.map((g, idx) => (
                                <a key={idx} href={g.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate max-w-xs block">
                                    [{idx+1}] {g.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {msg.role === 'model' && (
                    <button onClick={() => playTTS(msg.text)} className="mt-2 text-gray-600 hover:text-gray-300">
                        <Video className="w-3 h-3" /> {/* reusing icon as speaker substitute */}
                    </button>
                )}
             </div>
          </div>
        ))}
        {loading && <div className="text-neon font-mono text-xs animate-pulse ml-4">...PROCESSING...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2 items-center bg-black rounded-lg border border-gray-800 px-3 py-2">
            <label className="cursor-pointer text-gray-500 hover:text-white">
                <Paperclip className="w-5 h-5" />
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,audio/*" />
            </label>
            {file && <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">{file.type.toUpperCase()} LOADED</span>}
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query the vault..."
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
            />
            <button onClick={handleSend} disabled={loading} className="text-neon hover:text-white">
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ObsidianChat;