import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export const useCommits = (repoId, page = 1) => {
  return useQuery({
    queryKey: ["commits", repoId, page],
    queryFn: async () => {
      const { data } = await api.get(`/commits/${repoId}`, {
        params: { page, limit: 20 },
      });
      return data;
    },
    enabled: !!repoId,
  });
};
