import { browserUuid, setBrowserUuid } from "@/lib/identity";

const API_BASE_URL = "localhost:3030";
const SOCKET_URL = `ws://${API_BASE_URL}/ws`;

let _currentSocketUuid: string | null = null;
let _currentSocket: WebSocket | null = null;
let _lastListenerId = -1;
const _listeners: Record<number, {
  eventName: keyof WebSocketEventMap;
  callback: EventListenerOrEventListenerObject;
}> = {};

export function disconnect(keepListeners = true): void {
  if (_currentSocket) {
    _currentSocket.close();
    removeAllListeners(!keepListeners);
  }

  _currentSocket = null;
  _currentSocketUuid = null;
}

export function connect(uuid?: string, reapplyListeners = true): WebSocket {
  uuid ??= browserUuid();

  if (_currentSocket) {
    if (_currentSocketUuid === uuid) return _currentSocket;

    disconnect();
    _currentSocketUuid = uuid;
  }
  
  setBrowserUuid(uuid);
  _currentSocket = new WebSocket(`${SOCKET_URL}?uuid=${uuid}`);
  if (reapplyListeners) reapplyAllListeners();

  return _currentSocket;
}

export function withCurrentSocket(callback: (socket: WebSocket) => void, createIfNotConnected = false): void {
  if (createIfNotConnected) connect();
  if (_currentSocket) callback(_currentSocket);
}

type DataForMessageTypes = {
  "text": {
    text: string;
  };
  "set:username": {
    username: string;
  };
}

type MessageType = keyof DataForMessageTypes;

interface SocketMessage<M extends MessageType = MessageType> {
  message_type: M;
  data: DataForMessageTypes[M];
}

type Received<S extends SocketMessage> = S & {
  from_username: string;
};

export function sendMessage<M extends MessageType>(messageType: M, data: DataForMessageTypes[M]): void {
  const socket = connect();
  const socketMessage: SocketMessage<M> = { message_type: messageType, data };
  const serializedSocketMessage = JSON.stringify(socketMessage);
  socket.send(serializedSocketMessage);
}

function newListenerId(): number {
  _lastListenerId += 1;
  return _lastListenerId;
}

export function listenFor<M extends MessageType>(messageType: M, callback: (this: WebSocket, message: Received<SocketMessage<M>>) => void): number {
  const socket = connect();
  const listenerId = newListenerId();

  const listener = function (this: WebSocket, event: MessageEvent<string>): void {
    const message: Received<SocketMessage> = JSON.parse(event.data);
    if (message.message_type === messageType) callback.call(this, message as Received<SocketMessage<M>>)
  } as EventListener;

  const eventName = "message";
  socket.addEventListener(eventName, listener, false);
  _listeners[listenerId] = { eventName, callback: listener };

  return listenerId;
}

export function onOpen(callback: (this: WebSocket, event: Event) => void): number {
  const socket = connect();
  const listenerId = newListenerId();

  const eventName = "open";
  socket.addEventListener(eventName, callback, false);
  _listeners[listenerId] = { eventName, callback };

  return listenerId;
}

export function removeListener(listenerId: number, clean = true): void {
  const listener = _listeners[listenerId];
  if (!listener) return;

  if (clean) delete _listeners[listenerId];

  withCurrentSocket((socket) => {
    socket.removeEventListener(listener.eventName, listener.callback, false);
  });
}

export function removeAllListeners(clean = true): void {
  Object.keys(_listeners).forEach(id => removeListener(parseInt(id, 10), clean));
}

export function reapplyAllListeners(): void {
  withCurrentSocket((socket) => {
    Object.keys(_listeners).forEach((id) => {
      const listenerId = parseInt(id, 10);
      const listener = _listeners[listenerId];
      socket.addEventListener(listener.eventName, listener.callback, false);
    });
  })
}
