import { useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useChatStore } from "../store/chatStore";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const useChat = (repoId) => {
  const {
    messages,
    addMessage,
    setIsStreaming,
    setStreamContent,
    appendStreamContent,
    currentConversation,
    setCurrentConversation,
    chatMode,
  } = useChatStore();

  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (content) => {
      if (!repoId || !content.trim()) return;

      addMessage({ role: "user", content, timestamp: new Date() });
      setIsStreaming(true);
      setStreamContent("");

      try {
        const endpoint =
          chatMode === "bug" ? "/chat/bug" : "/chat/ask";

        const body =
          chatMode === "bug"
            ? {
                repoId,
                errorTrace: content,
                conversationId: currentConversation?._id,
              }
            : {
                repoId,
                question: content,
                conversationId: currentConversation?._id,
              };

        const token = JSON.parse(
          localStorage.getItem("devpulse-auth") || "{}"
        )?.state?.accessToken;

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          let errMsg = "Failed to get response";
          try {
            const errData = await response.json();
            if (errData.error) errMsg = errData.error;
          } catch (e) {
            // fallback
            const errText = await response.text();
            if (errText) errMsg = errText;
          }
          throw new Error(errMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));

                if (parsed.done) {
                  if (parsed.conversationId) {
                    setCurrentConversation({
                      ...currentConversation,
                      _id: parsed.conversationId,
                    });
                  }
                } else if (parsed.content) {
                  fullContent += parsed.content;
                  appendStreamContent(parsed.content);
                }
              } catch {
                // Ignore parse errors from partial chunks
              }
            }
          }
        }

        addMessage({
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
        });
      } catch (error) {
        toast.error("Failed to get AI response");
        console.error(error);
      } finally {
        setIsStreaming(false);
        setStreamContent("");
      }
    },
    [
      repoId,
      chatMode,
      currentConversation,
      addMessage,
      setIsStreaming,
      setStreamContent,
      appendStreamContent,
      setCurrentConversation,
    ]
  );

  return { messages, sendMessage, abortRef };
};

export const useConversations = (repoId) => {
  return useQuery({
    queryKey: ["conversations", repoId],
    queryFn: async () => {
      const { data } = await api.get("/chat/conversations", {
        params: { repoId },
      });
      return data.conversations;
    },
    enabled: !!repoId,
  });
};

export const useConversation = (id) => {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data } = await api.get(`/chat/conversations/${id}`);
      return data.conversation;
    },
    enabled: !!id,
  });
};
