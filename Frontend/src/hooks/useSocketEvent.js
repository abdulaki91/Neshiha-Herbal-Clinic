import { useEffect, useRef } from "react";
import { getSocket } from "../lib/socket";

/**
 * Subscribe to a Socket.IO event for the lifetime of the component.
 *
 * Registers the listener exactly once per mount and cleans it up on
 * unmount — it does NOT re-attach on every "connect". socket.io-client
 * event listeners are bound to the Socket instance itself and survive
 * disconnect/reconnect on their own, so re-attaching on each "connect" only
 * stacks duplicate listeners (each reconnect adds another copy, so one
 * event fires the handler N times after N reconnects). Only server-side
 * room membership (e.g. "queue:updates") is per-connection and needs
 * re-joining on reconnect — see useSocketOnConnect for that case.
 *
 * `handler` can be a fresh inline function on every render; it's read via
 * a ref so the socket subscription itself doesn't churn.
 */
export const useSocketEvent = (event, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !event) return;
    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
};

/**
 * Run `handler` on every socket connect — including the very first one (if
 * already connected by mount time) and every reconnect after. Use this for
 * anything that needs to re-establish server-side state that doesn't
 * survive a reconnect, such as re-joining a room via a "subscribe:*" emit.
 * For ordinary event listening, use useSocketEvent instead.
 */
export const useSocketOnConnect = (handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const listener = () => handlerRef.current?.();
    if (socket.connected) listener();
    socket.on("connect", listener);
    return () => socket.off("connect", listener);
  }, []);
};
