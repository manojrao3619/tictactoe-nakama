import { Client } from "@heroiclabs/nakama-js";

const nakamaHost = import.meta.env.VITE_NAKAMA_HOST || window.location.hostname;

export const client = new Client(
  "defaultkey",       // server key — must match socket.server_key in local.yml
  nakamaHost,           // host
  "443",             // port
  true               // ssl — false for local dev, true in production
);

// store the session and socket here after login
export let session: any = null;
export let socket: any = null;

export function setSession(s: any) { session = s; }
export function setSocket(s: any)  { socket = s; }
