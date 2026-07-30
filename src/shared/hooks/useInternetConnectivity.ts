import { useEffect, useState } from "react";

export type InternetConnectivityStatus = "checking" | "online" | "offline";

export function getInternetConnectivityStatus(isOnline: boolean): InternetConnectivityStatus {
  return isOnline ? "online" : "offline";
}

export function useInternetConnectivity(): InternetConnectivityStatus {
  const [status, setStatus] = useState<InternetConnectivityStatus>("checking");

  useEffect(() => {
    function updateStatus() {
      setStatus(getInternetConnectivityStatus(window.navigator.onLine));
    }

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return status;
}
