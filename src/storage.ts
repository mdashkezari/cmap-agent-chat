const KEY_APIKEY = "cmap_chat_api_key_v1";
const KEY_THREADS = "cmap_chat_threads_v1";
const KEY_EXAMPLES_DISMISSED = "cmap_chat_examples_dismissed_v1";

export type ThreadMeta = {
  thread_id: string;
  title: string;
  updated_at: string; // ISO string
};

export function loadApiKey(): string {
  return localStorage.getItem(KEY_APIKEY) ?? "";
}

export function saveApiKey(key: string): void {
  localStorage.setItem(KEY_APIKEY, key);
}

export function clearApiKey(): void {
  localStorage.removeItem(KEY_APIKEY);
}

export function loadThreads(): ThreadMeta[] {
  const raw = localStorage.getItem(KEY_THREADS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ThreadMeta[];
    return [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ThreadMeta[]): void {
  localStorage.setItem(KEY_THREADS, JSON.stringify(threads));
}

export function upsertThread(meta: ThreadMeta): ThreadMeta[] {
  const threads = loadThreads();
  const idx = threads.findIndex(t => t.thread_id === meta.thread_id);
  if (idx >= 0) {
    threads[idx] = meta;
  } else {
    threads.unshift(meta);
  }
  // sort by updated_at desc
  threads.sort((a, b) => (b.updated_at.localeCompare(a.updated_at)));
  saveThreads(threads);
  return threads;
}

export function loadExamplesDismissed(): boolean {
  return localStorage.getItem(KEY_EXAMPLES_DISMISSED) === "1";
}

export function saveExamplesDismissed(dismissed: boolean): void {
  localStorage.setItem(KEY_EXAMPLES_DISMISSED, dismissed ? "1" : "0");
}
