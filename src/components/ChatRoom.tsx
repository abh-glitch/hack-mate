/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useHackMate } from "../context/HackMateContext";
import { Message, Chat } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getAvatarUrl } from "../utils/avatar";
import { 
  Send, Code, Image as ImageIcon, File, Paperclip, MoreVertical, 
  Search, ShieldCheck, CheckCheck, Circle, Phone, Video, HelpCircle, 
  Trash2, Terminal, Copy, Check 
} from "lucide-react";

export const ChatRoom: React.FC = () => {
  const {
    currentUser,
    chats,
    messages,
    people,
    teams,
    sendMessage
  } = useHackMate();

  // Filter chats to only show the ones where currentUser is a participant
  const myChats = currentUser 
    ? chats.filter(chat => chat.participantIds && chat.participantIds.includes(currentUser.id))
    : [];

  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set first active chat as default on boot
  useEffect(() => {
    const myChatsList = chats.filter(chat => 
      chat.participantIds && chat.participantIds.includes(currentUser.id)
    );
    if (myChatsList.length > 0 && !activeChat) {
      setActiveChat(myChatsList[0]);
    }
  }, [chats, activeChat, currentUser.id]);

  // Scroll to bottom on new message or chat channel switch
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };
    scrollToBottom();
    // Quick fallback timeout to ensure dynamic assets are fully rendered
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, activeChat, isTyping]);

  // Handle bot typing indicator simulator
  useEffect(() => {
    // Simulated typing removed to allow only real replies
    setIsTyping(false);
  }, [messages, activeChat, currentUser]);

  if (!currentUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !activeChat) return;

    sendMessage(activeChat.id, textInput, "text");
    setTextInput("");
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    const fileSizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      if (typeof base64Data === "string") {
        try {
          // Upload to disk storage on the server first
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data
            })
          });

          if (response.ok) {
            const { url } = await response.json();
            const isImage = file.type.startsWith("image/");
            const isText = file.type.startsWith("text/") || 
                          file.name.endsWith(".json") || 
                          file.name.endsWith(".js") || 
                          file.name.endsWith(".ts") || 
                          file.name.endsWith(".tsx") || 
                          file.name.endsWith(".py") || 
                          file.name.endsWith(".html") || 
                          file.name.endsWith(".css");

            if (isImage) {
              sendMessage(activeChat.id, url, "image");
            } else if (isText) {
              // Read as text to send as code message
              const textReader = new FileReader();
              textReader.onloadend = () => {
                if (typeof textReader.result === "string") {
                  sendMessage(activeChat.id, textReader.result, "code", file.name, fileSizeStr);
                }
              };
              textReader.readAsText(file);
            } else {
              sendMessage(activeChat.id, url, "file", file.name, fileSizeStr);
            }
          } else {
            console.error("Upload endpoint failed");
          }
        } catch (uploadErr) {
          console.error("File upload failed:", uploadErr);
        }
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter messages for active chat
  const activeMessages = activeChat 
    ? messages.filter(m => m.chatId === activeChat.id)
    : [];

  // Recipient details
  const activeRecipient = (activeChat && !activeChat.isTeamChat)
    ? people.find(p => activeChat.participantIds.includes(p.id) && p.id !== currentUser.id)
    : null;

  const activeTeam = (activeChat && activeChat.isTeamChat)
    ? teams.find(t => t.id === activeChat.teamId)
    : null;

  return (
    <div id="chat_room_wrapper" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#09090B] text-white">
      <div className="glass rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[75vh] shadow-2xl">
        
        {/* Chats Sidebar (Left Panel) */}
        <div className="border-r border-white/5 flex flex-col h-full bg-white/[0.01]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Conversations</h2>
            <span className="text-[10px] bg-[#6C63FF]/15 text-[#C0B9FF] px-2 py-0.5 rounded-full font-semibold font-mono border border-[#6C63FF]/25">
              SOCKET ACTIVE
            </span>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-white/5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {myChats.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-xs">
                No active conversations. Accept an invitation or invite candidates to start chatting!
              </div>
            ) : (
              myChats.map((chat) => {
                const isActive = activeChat?.id === chat.id;
                let chatName = "";
                let chatAvatar = "";
                let isOnline = false;

                if (chat.isTeamChat) {
                  const team = teams.find(t => t.id === chat.teamId);
                  if (!team) return null;
                  chatName = `[Team] ${team.name}`;
                  chatAvatar = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120";
                  isOnline = true;
                } else {
                  const recipientId = chat.participantIds.find(id => id !== currentUser.id);
                  const recipient = people.find(p => p.id === recipientId);
                  if (!recipient) return null;
                  chatName = recipient.fullName;
                  chatAvatar = getAvatarUrl(recipient.avatarUrl, recipient.fullName);
                  isOnline = recipient.availability === "Available Now";
                }

                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 focus:outline-none cursor-pointer ${
                      isActive ? "bg-[#6C63FF]/15 border-l-2 border-[#6C63FF]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={chatAvatar}
                        alt={chatName}
                        className="h-10 w-10 rounded-lg object-cover ring-2 ring-white/10"
                      />
                      {isOnline && (
                        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#09090B]" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-xs font-bold text-white truncate">{chatName}</h4>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {new Date(chat.lastMessageAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate font-mono">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window panel (Right 2 Panels) */}
        <div className="md:col-span-2 flex flex-col h-full bg-[#09090B] relative">
          
          {activeChat && (activeRecipient || activeTeam) ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <img
                    src={activeChat.isTeamChat ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120" : getAvatarUrl(activeRecipient?.avatarUrl, activeRecipient?.fullName || "")}
                    alt={activeChat.isTeamChat ? activeTeam?.name : activeRecipient?.fullName}
                    className="h-10 w-10 rounded-lg object-cover ring-2 ring-[#6C63FF]/20"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-semibold text-white">
                        {activeChat.isTeamChat ? `[Group] ${activeTeam?.name}` : activeRecipient?.fullName}
                      </h3>
                      {!activeChat.isTeamChat && activeRecipient?.isVerified && (
                        <ShieldCheck className="h-4 w-4 text-[#6C63FF]" />
                      )}
                    </div>
                    <span className="block text-[10px] text-zinc-500 font-mono truncate max-w-sm">
                      {activeChat.isTeamChat 
                        ? `${activeTeam?.hackathonName} • ${activeTeam?.members.length} member(s)` 
                        : `${activeRecipient?.college} (Year ${activeRecipient?.year})`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Audio Sync Link">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Video Sync Link">
                    <Video className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message list */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-850">
                {activeMessages.map((msg) => {
                  const isOwn = msg.senderId === currentUser.id;
                  const senderProfile = people.find(p => p.id === msg.senderId) || (msg.senderId === currentUser.id ? currentUser : null);
                  const senderName = senderProfile ? senderProfile.fullName : "Teammate";
                  const senderAvatar = senderProfile ? getAvatarUrl(senderProfile.avatarUrl, senderProfile.fullName) : getAvatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80", senderName);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {!isOwn && (
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="h-6 w-6 rounded-md object-cover mb-1 flex-shrink-0"
                          title={senderName}
                        />
                      )}

                      <div className="max-w-lg space-y-1">
                        
                        {/* Sender Name for Team Chats */}
                        {!isOwn && activeChat.isTeamChat && (
                          <span className="block text-[9px] text-[#C0B9FF] font-mono mb-0.5 font-bold">
                            {senderName}
                          </span>
                        )}
                        
                        {/* Message content rendering */}
                        <div
                          className={`rounded-2xl p-3 text-xs leading-relaxed ${
                            isOwn
                              ? "bg-[#6C63FF] text-white rounded-br-none shadow-md shadow-[#6C63FF]/10"
                              : "bg-white/5 text-zinc-200 rounded-bl-none border border-white/5"
                          }`}
                        >
                          {msg.type === "text" && (
                            <p>{msg.content}</p>
                          )}

                          {msg.type === "code" && (
                            <div className="font-mono bg-black/40 border border-white/5 rounded-xl p-3 overflow-x-auto relative group mt-1">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2 text-[10px] text-zinc-500">
                                <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> Source Code Snippet</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(msg.content, msg.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <pre className="text-[#D9D3FF] leading-snug">{msg.content}</pre>
                            </div>
                          )}

                          {msg.type === "image" && (
                            <div className="rounded-lg overflow-hidden border border-white/5 mt-1">
                              <img src={msg.content} alt="Shared UI" className="max-w-xs object-cover" />
                              <span className="block text-[9px] bg-black/40 text-zinc-400 p-1.5 font-mono">Shared Interface Assets</span>
                            </div>
                          )}

                          {msg.type === "file" && (
                            <a 
                              href={msg.content} 
                              download={msg.fileName} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 bg-black/30 hover:bg-black/50 border border-white/5 rounded-xl mt-1 transition-all group/file cursor-pointer"
                              title="Click to download file"
                            >
                              <div className="p-2 bg-[#6C63FF]/10 text-[#C0B9FF] group-hover/file:bg-[#6C63FF]/20 rounded-lg transition-colors">
                                <File className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-white truncate max-w-[150px] group-hover/file:text-[#C0B9FF] transition-colors">{msg.fileName}</span>
                                <span className="block text-[9px] text-zinc-500 font-mono">{msg.fileSize}</span>
                              </div>
                            </a>
                          )}

                        </div>

                        {/* Timestamp & seen tags */}
                        <div className={`flex items-center gap-1 text-[9px] text-zinc-500 font-mono ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isOwn && <CheckCheck className="h-3 w-3 text-[#6C63FF]" />}
                        </div>

                      </div>
                    </div>
                  );
                })}

                {/* Pulsing Typing indicator */}
                {isTyping && activeRecipient && (
                  <div className="flex justify-start items-end gap-2">
                    <img
                      src={getAvatarUrl(activeRecipient.avatarUrl, activeRecipient.fullName)}
                      alt={activeRecipient.fullName}
                      className="h-6 w-6 rounded-md object-cover mb-1 flex-shrink-0"
                    />
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-none p-3 text-xs flex items-center gap-1 shadow-sm">
                      <span className="h-1.5 w-1.5 bg-[#6C63FF] rounded-full animate-bounce" />
                      <span className="h-1.5 w-1.5 bg-[#6C63FF] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 bg-[#6C63FF] rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-zinc-500 font-mono ml-2">{activeRecipient.fullName.split(" ")[0]} typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSend} className="p-3 bg-white/[0.03] border-t border-white/5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Attach and share file (Image, Code or ZIP)"
                >
                  <Paperclip className="h-4.5 w-4.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttachment}
                  className="hidden"
                />
                
                <input
                  type="text"
                  placeholder={activeChat.isTeamChat ? "Write message to team workspace..." : `Write secure message to ${activeRecipient ? activeRecipient.fullName.split(" ")[0] : "connection"}...`}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20 transition-colors"
                />
                <button
                  type="submit"
                  className="p-2 bg-[#6C63FF] hover:bg-[#8B5CF6] text-white rounded-xl transition-all shadow-md cursor-pointer flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-zinc-500">
                <Terminal className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300">No Chat Channel Selected</h3>
              <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
                Accept a pending hackathon invitation or launch connection threads inside Find Teammates to open instant socket chatrooms.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
