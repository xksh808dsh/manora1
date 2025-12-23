import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, MicOff, Radio, Activity } from 'lucide-react';
import { createBlob, decodeAudioData } from '../services/geminiService';
import { GeminiModel } from '../types';

const LiveSession: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [volume, setVolume] = useState(0);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      setStatus('Connecting...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: GeminiModel.LIVE_AUDIO,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are Manus, a sovereign digital agent. You are helpful, precise, and have a slightly cyberpunk personality.",
        },
        callbacks: {
            onopen: () => {
                setStatus('Live');
                setActive(true);

                // Setup Input Stream
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Visualizer hack
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                    setVolume(Math.min((sum / inputData.length) * 500, 100));

                    const blob = createBlob(inputData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: blob });
                    });
                };
                source.connect(processor);
                processor.connect(inputCtx.destination);
            },
            onmessage: async (msg) => {
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData && audioContextRef.current) {
                    const ctx = audioContextRef.current;
                    const buffer = await decodeAudioData(audioData, ctx);
                    
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    
                    const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    source.start(startTime);
                    nextStartTimeRef.current = startTime + buffer.duration;
                    
                    sourcesRef.current.add(source);
                    source.onended = () => sourcesRef.current.delete(source);
                }

                if (msg.serverContent?.interrupted) {
                    sourcesRef.current.forEach(s => s.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            },
            onclose: () => {
                setStatus('Disconnected');
                setActive(false);
            },
            onerror: (e) => {
                console.error(e);
                setStatus('Error');
                setActive(false);
            }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start live session", error);
      setStatus('Failed');
    }
  };

  const stopSession = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    // We can't explicitly close the session object easily as it's a promise in this SDK version structure
    // but stopping audio context and stream effectively kills the loop.
    setActive(false);
    setStatus('Stopped');
    setVolume(0);
    window.location.reload(); // Hard reset to ensure clean state for demo
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 p-8">
      <div className="relative">
        <div className={`w-64 h-64 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${active ? 'border-neon shadow-[0_0_50px_rgba(0,255,157,0.3)]' : 'border-gray-700'}`}>
           {active ? (
             <div className="flex items-center justify-center gap-1 h-32">
                {[1,2,3,4,5].map(i => (
                    <div 
                        key={i} 
                        className="w-4 bg-neon transition-all duration-75 rounded-full"
                        style={{ height: `${Math.max(10, Math.random() * volume * 2)}px` }}
                    />
                ))}
             </div>
           ) : (
             <Radio className="w-24 h-24 text-gray-600" />
           )}
        </div>
      </div>
      
      <h2 className="mt-8 text-2xl font-mono text-white tracking-widest">{status.toUpperCase()}</h2>
      <p className="text-gray-500 font-mono mt-2">GEMINI NATIVE AUDIO LIVE</p>

      <button
        onClick={active ? stopSession : startSession}
        className={`mt-12 px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-all ${
          active 
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
            : 'bg-neon text-black hover:bg-white'
        }`}
      >
        {active ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        {active ? 'TERMINATE UPLINK' : 'INITIATE VOICE LINK'}
      </button>
    </div>
  );
};

export default LiveSession;