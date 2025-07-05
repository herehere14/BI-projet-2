import { useQuery } from "@tanstack/react-query";
import { askAI } from "./api";

export const useAIAnalysis = (query: string) => {
  return useQuery({
    queryKey: ["ai-analysis", query],
    queryFn: () => askAI({ query }),
    staleTime: 5 * 60 * 1000,
  });
};