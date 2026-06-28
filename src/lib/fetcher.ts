/**
 * Global SWR fetcher — throws on non-OK responses so SWR's error state works correctly.
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error: Error & { status?: number } = new Error("API request failed");
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}
