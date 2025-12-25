import { useEffect, useRef } from "react";

let globalSse: EventSource | null = null;
let listenerCount = 0;

export function useSse(
  url: string,
  token: string,
  eventName: string,
  onMessage: (data: any) => void,
  enabled: boolean,
  isPgNotify: boolean = true,
  onError?: (err: any) => void,
) {
  const callbackRef = useRef(onMessage);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    if (!url || !eventName || !enabled) return;

    const finalUrl = token
      ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
      : url;

    if (!globalSse) {
      globalSse = new EventSource(finalUrl, { withCredentials: false });
      console.log("SSE Connection Opened");
    }

    listenerCount++;

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const processedData = isPgNotify 
          ? (data.operation === "DELETE" ? data.data.old : data.data.new)
          : data.data;

        callbackRef.current(processedData);
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    globalSse.addEventListener(eventName, handler);

    if (onError) {
      globalSse.onerror = onError;
    }

    return () => {
      if (globalSse) {
        globalSse.removeEventListener(eventName, handler);
        listenerCount--;

        if (listenerCount <= 0) {
          globalSse.close();
          globalSse = null;
          console.log("SSE Connection Closed (No listeners left)");
        }
      }
    };
  }, [url, token, eventName, enabled, isPgNotify]);
}