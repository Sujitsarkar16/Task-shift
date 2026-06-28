import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type UserProfile = {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  displayName?: string;
  image?: string;
  theme?: "light" | "dark";
  defaultView?: string;
  reminderLeadDays?: number;
};

export function useUserProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>("/api/users/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000, // profile changes very rarely
  });

  return {
    profile: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
