import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_STATE, restoreState, STORAGE_KEY } from './market';

export function useMarket() {
  const [state, setState] = useState(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (active) setState(restoreState(raw));
    }).catch(() => {
      if (active) setStorageError('无法读取本地记录，本次从空购物车开始。');
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Serialize writes so a slower previous save cannot overwrite newer state.
    writes.current = writes.current.then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)))
      .then(() => setStorageError(''))
      .catch(() => setStorageError('本地保存失败，关闭 App 后本次修改可能丢失。'));
  }, [state, ready]);

  return { state, setState, ready, storageError };
}
