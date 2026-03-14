import { create } from "zustand";

export const useRepoStore = create((set) => ({
  currentRepo: null,
  repos: [],
  selectedFile: null,
  fileContent: null,
  fileLoading: false,
  onlineUsers: [],

  setCurrentRepo: (repo) => set({ currentRepo: repo, selectedFile: null, fileContent: null }),
  setRepos: (repos) => set({ repos }),
  addRepo: (repo) => set((s) => ({ repos: [repo, ...s.repos] })),
  removeRepo: (id) => set((s) => ({ repos: s.repos.filter((r) => r._id !== id) })),

  setSelectedFile: (file) => set({ selectedFile: file }),
  setFileContent: (content) => set({ fileContent: content }),
  setFileLoading: (loading) => set({ fileLoading: loading }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (user) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.find((u) => u.userId === user.userId)
        ? s.onlineUsers
        : [...s.onlineUsers, user],
    })),
  removeOnlineUser: (userId) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.filter((u) => u.userId !== userId),
    })),
}));
