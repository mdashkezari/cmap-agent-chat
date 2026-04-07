import { useMemo, useState } from "react";
import { clearApiKey, loadApiKey, saveApiKey } from "../storage";

export function useApiKey() {
  const [apiKey, setApiKey] = useState(loadApiKey());
  const [saved, setSaved] = useState(apiKey.length > 0);

  const masked = useMemo(() => {
    if (!apiKey) return "";
    if (apiKey.length <= 8) return "********";
    return apiKey.slice(0, 3) + "…" + apiKey.slice(-3);
  }, [apiKey]);

  function persist() {
    saveApiKey(apiKey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 800);
  }

  function clear() {
    clearApiKey();
    setApiKey("");
  }

  return {
    apiKey,
    setApiKey,
    masked,
    saved,
    persist,
    clear
  };
}
