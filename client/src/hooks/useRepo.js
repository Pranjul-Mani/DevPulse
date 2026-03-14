import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useRepoStore } from "../store/repoStore";
import toast from "react-hot-toast";

export const useRepos = () => {
  return useQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      const { data } = await api.get("/repos");
      return data.repos;
    },
  });
};

export const useRepo = (id) => {
  return useQuery({
    queryKey: ["repo", id],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${id}`);
      return data.repo;
    },
    enabled: !!id,
  });
};

export const useConnectRepo = () => {
  const queryClient = useQueryClient();
  const addRepo = useRepoStore((s) => s.addRepo);

  return useMutation({
    mutationFn: async ({ githubUrl, githubToken }) => {
      const { data } = await api.post("/repos/connect", {
        githubUrl,
        githubToken,
      });
      return data.repo;
    },
    onSuccess: (repo) => {
      addRepo(repo);
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success("Repository connected!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to connect repo");
    },
  });
};

export const useIndexRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repoId) => {
      const { data } = await api.post(`/repos/${repoId}/index`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success(
        `Indexed ${data.filesProcessed} files (${data.chunksCreated} chunks)`
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to index repository");
    },
  });
};

export const useFileContent = (repoId, filePath) => {
  const setFileContent = useRepoStore((s) => s.setFileContent);
  const setFileLoading = useRepoStore((s) => s.setFileLoading);

  return useQuery({
    queryKey: ["file", repoId, filePath],
    queryFn: async () => {
      setFileLoading(true);
      try {
        const { data } = await api.get(`/repos/${repoId}/file`, {
          params: { path: filePath },
        });
        setFileContent(data.content);
        return data.content;
      } finally {
        setFileLoading(false);
      }
    },
    enabled: !!repoId && !!filePath,
  });
};

export const useDeleteRepo = () => {
  const queryClient = useQueryClient();
  const removeRepo = useRepoStore((s) => s.removeRepo);

  return useMutation({
    mutationFn: async (repoId) => {
      await api.delete(`/repos/${repoId}`);
      return repoId;
    },
    onSuccess: (repoId) => {
      removeRepo(repoId);
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success("Repository deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete repo");
    },
  });
};
