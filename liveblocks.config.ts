// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveMap, LiveObject } from "@liveblocks/client";
import type { LiveblocksNode, LiveblocksEdge } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      flow: LiveObject<{
        nodes: LiveMap<string, LiveblocksNode<CanvasNode>>;
        edges: LiveMap<string, LiveblocksEdge<CanvasEdge>>;
      }>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events broadcast across the room
    RoomEvent:
      | { type: "ai-status"; message: string; status: "start" | "thinking" | "complete" | "error" };

    // Custom metadata set on threads
    ThreadMetadata: {};

    // Custom room info
    RoomInfo: {};

    // Feed message data for useFeedMessages / useCreateFeedMessage
    FeedMessageData: {
      // ai-status-feed fields
      text?: string;
      status?: "start" | "thinking" | "complete" | "error";
      // ai-chat feed fields
      sender?: string;
      role?: "user" | "assistant";
      content?: string;
      timestamp?: string;
    };
  }
}

export {};
