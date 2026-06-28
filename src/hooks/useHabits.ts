import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Habit = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  history: string[];
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
};

export function useHabits() {
  const { data, error, isLoading, mutate } = useSWR<Habit[]>("/api/habits", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  return {
    habits: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
