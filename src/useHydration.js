import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { INITIAL_STATE, restoreHydration, STORAGE_KEY } from "./hydration";

export function useHydration() {
  const [state, setState] = useState(INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [canSave, setCanSave] = useState(false);
  const [now, setNow] = useState(new Date());
  const writes = useRef(Promise.resolve());
  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setState(restoreHydration(raw));
      setCanSave(true);
      setStorageError("");
    } catch {
      setStorageError("暂时无法读取记录。请重试，原有数据不会被覆盖。");
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!ready || !canSave) return;
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)))
      .then(() => setStorageError(""))
      .catch(() =>
        setStorageError("记录尚未保存，请保持 App 打开并点击重试。"),
      );
  }, [state, ready, canSave]);
  const retry = () => {
    if (!canSave) return load();
    setState((s) => ({ ...s }));
  };
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return {
    state,
    setState,
    ready,
    storageError,
    retry,
    canSave,
    now,
    refreshTime: () => setNow(new Date()),
  };
}
