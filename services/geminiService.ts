import { GoogleGenAI, Schema, Type, LiveServerMessage, Modality } from "@google/genai";
import { GeminiModel } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & Multimodal Chat ---
export const sendMessage = async (
  model: string,
  prompt: string,
  imageParts: { data: string; mimeType: string }[] = [],
  systemInstruction?: string,
  useThinking: boolean = false,
  tools: 'search' | 'maps' | null = null
) => {
  const ai = getAI();
  
  const parts: any[] = [];
  imageParts.forEach(img => {
    parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
  });
  parts.push({ text: prompt });

  const config: any = {
    systemInstruction,
  };

  if (useThinking && model === GeminiModel.PRO) {
    config.thinkingConfig = { thinkingBudget: 32768 };
    // maxOutputTokens must NOT be set when using thinking budget in this specific constraint context,
    // or strictly managed. The prompt says "Do not set maxOutputTokens".
  }

  if (tools === 'search') {
    config.tools = [{ googleSearch: {} }];
  } else if (tools === 'maps') {
    config.tools = [{ googleMaps: {} }];
    // Try to get location for better maps grounding
    try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }
            }
        };
    } catch (e) {
        console.warn("Location access denied for Maps grounding");
    }
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config
  });

  return response;
};

// --- Image Generation ---
export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
  const ai = getAI();
  // Using generateContent for nano banana series (gemini-3-pro-image-preview)
  const response = await ai.models.generateContent({
    model: GeminiModel.PRO_IMAGE,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: "1:1" 
      }
    }
  });
  return response;
};

// --- Image Editing ---
export const editImage = async (prompt: string, base64Image: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH_IMAGE, // Nano banana powered app
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    }
  });
  return response;
};

// --- Video Generation (Veo) ---
export const generateVideo = async (prompt: string, inputImage?: { data: string, mimeType: string }, aspectRatio: '16:9' | '9:16' = '16:9') => {
  const ai = getAI();
  
  let payload: any = {
    model: GeminiModel.VEO_FAST,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p', // standard for preview
      aspectRatio: aspectRatio
    }
  };

  if (inputImage) {
    payload.image = {
        imageBytes: inputImage.data,
        mimeType: inputImage.mimeType
    };
  }

  let operation = await ai.models.generateVideos(payload);

  // Polling mechanism
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (operation.response?.generatedVideos?.[0]?.video?.uri) {
    const uri = operation.response.generatedVideos[0].video.uri;
    return `${uri}&key=${process.env.API_KEY}`;
  }
  throw new Error("Video generation failed or returned no URI");
};

// --- Audio Transcription ---
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: GeminiModel.FLASH,
        contents: {
            parts: [
                { inlineData: { data: base64Audio, mimeType } },
                { text: "Transcribe this audio file accurately." }
            ]
        }
    });
    return response.text;
};

// --- TTS ---
export const generateSpeech = async (text: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: GeminiModel.TTS,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// --- Live API Helpers ---
export const createBlob = (data: Float32Array): any => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    const uint8 = new Uint8Array(int16.buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    const b64 = btoa(binary);
    
    return {
        data: b64,
        mimeType: 'audio/pcm;rate=16000',
    };
}

export const decodeAudioData = async (
    base64: string,
    ctx: AudioContext,
): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
