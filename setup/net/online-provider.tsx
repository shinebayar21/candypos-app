import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Configure } from "../../configure";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setOnline } from "../store/sync-slice";
import { pullAll, pushOutbox } from "../store/thunks";

// Сүлжээ хянах + outbox автоматаар илгээх:
// • online болоход бүгдийг татаж + push,
// • тогтмол давтамжаар push,
// • app foreground болоход push.
export const OnlineProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(s => s.sync.isOnline);
  const hasToken = useAppSelector(s => !!s.auth.token);
  const onlineRef = useRef(isOnline);
  const tokenRef = useRef(hasToken);
  onlineRef.current = isOnline;
  tokenRef.current = hasToken;

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const online =
        !!state.isConnected && state.isInternetReachable !== false;
      dispatch(setOnline(online));
    });
    return () => unsub();
  }, [dispatch]);

  // Online болсон агшинд (токентой бол) бүгдийг татаж + push.
  useEffect(() => {
    if (isOnline && hasToken) dispatch(pullAll());
  }, [isOnline, hasToken, dispatch]);

  // Тогтмол давтамжаар outbox илгээх.
  useEffect(() => {
    const id = setInterval(() => {
      if (onlineRef.current && tokenRef.current) dispatch(pushOutbox());
    }, Configure.AutoPushIntervalMs);
    return () => clearInterval(id);
  }, [dispatch]);

  // App foreground болоход push.
  useEffect(() => {
    const sub = AppState.addEventListener("change", state => {
      if (state === "active" && onlineRef.current && tokenRef.current) {
        dispatch(pushOutbox());
      }
    });
    return () => sub.remove();
  }, [dispatch]);

  return <>{children}</>;
};
