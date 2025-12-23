import React, { useState } from 'react';
import { generateVideo, generateImage, editImage } from '../services/geminiService';
import { Video, Image as ImageIcon, Wand2, RefreshCcw } from 'lucide-react';

const VeoStudio: React.FC = () => {
  const [tab, setTab] = useState<'video' | 'image' | 'edit'>('video');
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [baseImage, setBaseImage] = useState<{data: string, mimeType: string} | null>(null);
  
  // Image Edit / Video Gen specific state
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K'>('1K');

  const handleAction = async () => {
    if (!prompt) return;
    setLoading(true);
    setResultUrl(null);
    setStatus('Initializing quantum generation...');

    try {
      if (tab === 'video') {
        setStatus('Veo 3.1: Rendering dreamscape (this takes time)...');
        const url = await generateVideo(prompt, baseImage || undefined, aspectRatio);
        setResultUrl(url);
      } else if (tab === 'image') {
        setStatus('Nano Banana Pro: Painting pixels...');
        const res = await generateImage(prompt, imgSize);
        // Extracting image from generateContent response (Gemini 3 Pro Image)
        // Note: The response handling for inlineData vs text is handled here.
        // Actually, Pro Image Preview usually returns inlineData base64.
        const parts = res.candidates?.[0]?.content?.parts;
        const imgPart = parts?.find((p: any) => p.inlineData);
        if (imgPart) {
            setResultUrl(`data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`);
        } else {
            setStatus('Error: No image returned');
        }
      } else if (tab === 'edit') {
        if (!baseImage) {
            alert("Upload an image to edit first.");
            setLoading(false);
            return;
        }
        setStatus('Nano Banana Flash: Editing reality...');
        const res = await editImage(prompt, baseImage.data, baseImage.mimeType);
        const parts = res.candidates?.[0]?.content?.parts;
        const imgPart = parts?.find((p: any) => p.inlineData);
        if (imgPart) {
            setResultUrl(`data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`);
        }
      }
    } catch (e: any) {
      setStatus(`System Failure: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage({
            data: (reader.result as string).split(',')[1],
            mimeType: f.type
        });
      };
      reader.readAsDataURL(f);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-900">
      <h1 className="text-2xl font-mono text-neon mb-6">REALITY STUDIO</h1>
      
      <div className="flex gap-4 mb-8">
        <button onClick={() => setTab('video')} className={`flex items-center gap-2 px-4 py-2 rounded ${tab === 'video' ? 'bg-neon text-black' : 'bg-gray-800 text-gray-400'}`}>
            <Video className="w-4 h-4"/> Veo Video
        </button>
        <button onClick={() => setTab('image')} className={`flex items-center gap-2 px-4 py-2 rounded ${tab === 'image' ? 'bg-plasma text-white' : 'bg-gray-800 text-gray-400'}`}>
            <ImageIcon className="w-4 h-4"/> Gen Image
        </button>
        <button onClick={() => setTab('edit')} className={`flex items-center gap-2 px-4 py-2 rounded ${tab === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
            <Wand2 className="w-4 h-4"/> Edit Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-mono text-gray-500 mb-2">PROMPT</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-4 text-white font-mono h-32 focus:border-neon outline-none"
                    placeholder={tab === 'edit' ? "e.g. 'Add a retro glitch filter'" : "Describe your vision..."}
                />
            </div>

            {(tab === 'video' || tab === 'edit') && (
                <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2">{tab === 'video' ? 'REFERENCE IMAGE (OPTIONAL)' : 'SOURCE IMAGE (REQUIRED)'}</label>
                    <input type="file" onChange={handleFile} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-neon hover:file:bg-gray-700"/>
                </div>
            )}

            {tab === 'video' && (
                <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2">ASPECT RATIO</label>
                    <select value={aspectRatio} onChange={(e: any) => setAspectRatio(e.target.value)} className="bg-black border border-gray-700 text-white p-2 rounded">
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                    </select>
                </div>
            )}

            {tab === 'image' && (
                 <div>
                    <label className="block text-xs font-mono text-gray-500 mb-2">RESOLUTION</label>
                    <select value={imgSize} onChange={(e: any) => setImgSize(e.target.value)} className="bg-black border border-gray-700 text-white p-2 rounded">
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                        <option value="4K">4K</option>
                    </select>
                </div>
            )}

            <button 
                onClick={handleAction}
                disabled={loading}
                className="w-full bg-gray-100 hover:bg-white text-black font-bold py-3 rounded flex items-center justify-center gap-2"
            >
                {loading ? <RefreshCcw className="animate-spin w-5 h-5"/> : "GENERATE ASSET"}
            </button>
            
            {loading && <div className="text-center font-mono text-xs text-neon animate-pulse">{status}</div>}
        </div>

        <div className="bg-black rounded-lg border border-gray-800 flex items-center justify-center min-h-[400px]">
            {resultUrl ? (
                tab === 'video' ? (
                    <video src={resultUrl} controls className="max-w-full max-h-[500px]" autoPlay loop />
                ) : (
                    <img src={resultUrl} alt="Generated" className="max-w-full max-h-[500px] object-contain" />
                )
            ) : (
                <div className="text-gray-700 font-mono text-sm">OUTPUT PREVIEW</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VeoStudio;