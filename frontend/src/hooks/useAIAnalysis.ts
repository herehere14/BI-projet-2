import { useQuery } from "@tanstack/react-query";
import { askAI } from "./api";

export const useAIAnalysis = (companyId: string | undefined, query: string) => {
    return useQuery({
      queryKey: ["ai-analysis", companyId, query],
      enabled: !!companyId,
      queryFn: () => askAI({ query, company_id: companyId }),
    staleTime: 5 * 60 * 1000,
  });
};