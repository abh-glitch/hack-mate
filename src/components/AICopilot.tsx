/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  Brain, 
  Zap, 
  MapPin, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Compass, 
  Lightbulb, 
  Code, 
  Flame,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHackMate } from "../context/HackMateContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "fast" | "general" | "thinking" | "maps" | "vision";
  modelUsed?: string;
  imageUrl?: string;
  timestamp: string;
}

interface AICopilotProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export const AICopilot: React.FC<AICopilotProps> = ({ onClose }) => {
  const { currentUser } = useHackMate();

  const [mode, setMode] = useState<"fast" | "general" | "thinking" | "maps" | "vision">("general");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string>("image/png");
  const [locationQuery, setLocationQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome_1",
      role: "assistant",
      content: `Hello ${currentUser?.fullName || "Hacker"}! I am your **HackMate AI Advisor** powered by Google Gemini. 

I can help you:
• 🧠 **Architect Complex Systems** using High Thinking mode (\`gemini-3.1-pro-preview\` with HIGH thinking)
• 🗺️ **Find Hackathon Venues & Campuses** grounded with Google Maps
• 📷 **Analyze Architecture Sketches & Diagrams** with multimodal image understanding
• ⚡ **Speed-draft Pitches & Tech Stack Decisions** with flash-lite

How can I boost your hackathon project today?`,
      mode: "general",
      modelUsed: "gemini-3.5-flash",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageMime(file.type || "image/png");
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setMode("vision");
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textPrompt = inputMessage.trim();
    if (!textPrompt && !selectedImage && !locationQuery) return;

    const userMessageId = "msg_" + Date.now();
    const newMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: textPrompt || (selectedImage ? "[Uploaded Image for Analysis]" : `[Search Location: ${locationQuery}]`),
      mode: mode,
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage("");
    setLoading(true);

    const imagePayload = selectedImage;
    const imageMimePayload = selectedImageMime;
    const locPayload = locationQuery;

    // Reset attachments & location inputs after capturing
    setSelectedImage(null);
    setLocationQuery("");

    try {
      // Build past history for API payload
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: m.content
      }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textPrompt,
          history: historyPayload,
          mode: mode,
          imageBase64: imagePayload,
          imageMimeType: imageMimePayload,
          locationQuery: locPayload
        })
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMsg: ChatMessage = {
          id: "msg_reply_" + Date.now(),
          role: "assistant",
          content: data.reply || "No answer returned.",
          mode: mode,
          modelUsed: data.modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: "msg_err_" + Date.now(),
          role: "assistant",
          content: `⚠️ Request failed: ${data.error || "Unable to reach Gemini API"}`,
          mode: mode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "msg_err_" + Date.now(),
        role: "assistant",
        content: `⚠️ Network error: ${err.message || "Failed to connect to backend AI server"}`,
        mode: mode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const setPromptPreset = (prompt: string, presetMode: "fast" | "general" | "thinking" | "maps" | "vision") => {
    setMode(presetMode);
    setInputMessage(prompt);
  };

  return (
    <div id="ai_copilot_container" className="flex flex-col h-[650px] max-h-[85vh] w-full bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-indigo-400 flex items-center justify-center text-white primary-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">HackMate AI Advisor</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#6C63FF]/20 text-[#A5A0FF] border border-[#6C63FF]/30">
                Gemini Powered
              </span>
            </div>
            <p className="text-xs text-zinc-400">Multi-turn chat, High Thinking architecture, Maps grounding & Vision</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Selector Toolbar */}
      <div className="flex items-center gap-1.5 p-2 bg-black/40 border-b border-white/5 overflow-x-auto text-xs scrollbar-none">
        <button
          onClick={() => setMode("general")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
            mode === "general" 
              ? "bg-[#6C63FF] text-white font-bold shadow-md" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          General (3.5 Flash)
        </button>

        <button
          onClick={() => setMode("thinking")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
            mode === "thinking" 
              ? "bg-purple-600 text-white font-bold shadow-md" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          High Thinking (3.1 Pro)
        </button>

        <button
          onClick={() => setMode("maps")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
            mode === "maps" 
              ? "bg-emerald-600 text-white font-bold shadow-md" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-300" />
          Maps Grounding
        </button>

        <button
          onClick={() => {
            setMode("vision");
            fileInputRef.current?.click();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
            mode === "vision" 
              ? "bg-blue-600 text-white font-bold shadow-md" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
          Vision / Image
        </button>

        <button
          onClick={() => setMode("fast")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${
            mode === "fast" 
              ? "bg-amber-600 text-white font-bold shadow-md" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-300" />
          Fast (3.1 Lite)
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.01] border-b border-white/5 overflow-x-auto text-[11px] scrollbar-none">
        <span className="text-zinc-500 font-mono text-[10px] shrink-0 uppercase tracking-wider">Quick Prompts:</span>
        <button
          onClick={() => setPromptPreset("Draft a 24-hour sprint project roadmap and system architecture for a Smart India Hackathon AI project.", "thinking")}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 transition-all border border-white/5 shrink-0 flex items-center gap-1"
        >
          <Brain className="w-3 h-3 text-purple-400" />
          24h High-Thinking Architecture
        </button>

        <button
          onClick={() => setPromptPreset("Find nearby hackathon venues, co-working spaces, and college hubs in Bengaluru or Delhi with fast Wi-Fi.", "maps")}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 transition-all border border-white/5 shrink-0 flex items-center gap-1"
        >
          <MapPin className="w-3 h-3 text-emerald-400" />
          Find Hackathon Venues
        </button>

        <button
          onClick={() => setPromptPreset("Give me 3 killer elevator pitches for our hackathon project targeting non-technical judges.", "fast")}
          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 transition-all border border-white/5 shrink-0 flex items-center gap-1"
        >
          <Lightbulb className="w-3 h-3 text-amber-400" />
          Pitch Coach
        </button>
      </div>

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#A5A0FF] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4.5 h-4.5" />
              </div>
            )}

            <div className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#6C63FF] text-white rounded-tr-xs shadow-lg"
                : "bg-white/[0.04] text-zinc-200 border border-white/10 rounded-tl-xs"
            }`}>
              {/* Image attachment preview if any */}
              {msg.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10 max-h-48 bg-black">
                  <img src={msg.imageUrl} alt="Uploaded for analysis" className="w-full object-contain max-h-48" />
                </div>
              )}

              {/* Message Content rendered cleanly */}
              <div className="whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              {/* Footer metadata */}
              <div className={`mt-2 flex items-center gap-2 text-[10px] font-mono ${
                msg.role === "user" ? "text-indigo-200 justify-end" : "text-zinc-500 justify-between border-t border-white/5 pt-2"
              }`}>
                {msg.role === "assistant" && msg.modelUsed && (
                  <span className="text-purple-400 font-bold uppercase tracking-wider">
                    Model: {msg.modelUsed}
                  </span>
                )}
                <span>{msg.timestamp}</span>
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-4.5 h-4.5" />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#A5A0FF] flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-xs p-3.5 flex items-center gap-2.5 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#6C63FF]" />
              <span>
                {mode === "thinking" && "Executing High Thinking reasoning loop with gemini-3.1-pro-preview..."}
                {mode === "maps" && "Querying Google Maps Grounding database for real location coordinates..."}
                {mode === "vision" && "Analyzing uploaded image structures with gemini-3.1-pro-preview..."}
                {mode === "fast" && "Fast generating with gemini-3.1-flash-lite..."}
                {mode === "general" && "Consulting Gemini AI Advisor..."}
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview attachment banner */}
      {selectedImage && (
        <div className="px-4 py-2 bg-indigo-950/40 border-t border-indigo-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-[11px] truncate max-w-xs">Attached photo for Gemini 3.1 Pro analysis</span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload architecture sketch or flyer photo"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5 cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {mode === "maps" && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <input
              type="text"
              placeholder="Location e.g. Bengaluru / IIT Bombay"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="bg-transparent text-emerald-200 outline-none text-xs w-36 placeholder:text-emerald-600"
            />
          </div>
        )}

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            mode === "thinking" 
              ? "Ask a complex architectural question for High Thinking mode..." 
              : mode === "maps" 
              ? "Ask for venues, campus locations, or co-working spots..."
              : mode === "vision"
              ? "Ask a question about your attached photo/diagram..."
              : "Ask HackMate AI Advisor anything..."
          }
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#6C63FF]/60 focus:ring-1 focus:ring-[#6C63FF]/40 transition-all"
        />

        <button
          type="submit"
          disabled={loading || (!inputMessage.trim() && !selectedImage && !locationQuery)}
          className="p-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white transition-all disabled:opacity-40 disabled:pointer-events-none primary-glow cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
