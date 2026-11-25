import { queryOptions } from "@tanstack/react-query";
import { getAdminContent, getSiteContent } from "@/data/site.functions";

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 30_000,
});

export const adminContentQuery = queryOptions({
  queryKey: ["admin-content"],
  queryFn: () => getAdminContent(),
  staleTime: 5_000,
});
