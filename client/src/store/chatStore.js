import { create } from "zustand";

export const useChatStore = create((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isStreaming: false,
  streamContent: "",
  chatMode: "qa", // "qa" | "bug" | "pr"

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) =>
    set({
      currentConversation: conversation,
      messages: conversation?.messages || [],
    }),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamContent: (streamContent) => set({ streamContent }),
  appendStreamContent: (content) =>
    set((s) => ({ streamContent: s.streamContent + content })),
  setChatMode: (chatMode) => set({ chatMode }),
  clearChat: () =>
    set({
      currentConversation: null,
      messages: [],
      streamContent: "",
      isStreaming: false,
    }),
}));
