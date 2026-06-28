import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  renewalDate: string;
  expiryDate?: string;
  status: "active" | "trial" | "paused" | "cancelled";
  category: "streaming" | "software" | "utilities" | "gaming" | "other";
  paymentMethod?: string;
  manageUrl?: string;
  notes?: string;
  reminderDaysBefore?: number;
  createdAt: string;
  updatedAt: string;
};

export function useSubscriptions() {
  const { data, error, isLoading, mutate } = useSWR<Subscription[]>(
    "/api/subscriptions",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000, // subscriptions change rarely
    }
  );

  return {
    subscriptions: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
