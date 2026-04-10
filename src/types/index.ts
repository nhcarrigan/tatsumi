/**
 * @file Type definitions for the Tatsumi application.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

type Mode = "avatar" | "art" | "replace";

interface Config {
  apiKey: string;
}

interface PendingInput {
  imageBase64?:  string;
  imageMime?:    string;
  imagePreview?: string;
  text?:         string;
}

interface MessagePart {
  imageData?:        string;
  mimeType?:         string;
  text?:             string;
  thoughtSignature?: string;
  type:              "image" | "text" | "thought";
}

interface ThreadMessage {
  cost?: number;
  parts: Array<MessagePart>;
  role:  "user" | "model";
}

interface Thread {
  createdAt: number;
  id:        string;
  messages:  Array<ThreadMessage>;
  mode:      Mode;
  name:      string;
  updatedAt: number;
}

export type { Config, MessagePart, Mode, PendingInput, Thread, ThreadMessage };
