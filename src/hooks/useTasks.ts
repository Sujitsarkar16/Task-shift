import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  deadline: string;
  isCompleted: boolean;
  category?: string;
  reminderDays?: number;
  reminderSent?: boolean;
  emailNotification?: boolean;
  completionNotes?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
};

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>("/api/todos", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000, // 30s — don't re-fetch if navigating back within 30s
  });

  return {
    tasks: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
