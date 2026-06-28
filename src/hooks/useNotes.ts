import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Note = {
  id: string;
  title: string;
  content: string;
  type: "text" | "whiteboard";
  whiteboardData?: string;
  createdAt: string;
  updatedAt: string;
};

export function useNotes() {
  const { data, error, isLoading, mutate } = useSWR<Note[]>("/api/notes", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  return {
    notes: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
