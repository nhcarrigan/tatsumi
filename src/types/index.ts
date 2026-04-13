/**
 * @file Type definitions for the Tatsumi application.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
type ImageSize = "1K" | "2K" | "4K";
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
  aspectRatio?: AspectRatio;
  createdAt:    number;
  id:           string;
  imageSize?:   ImageSize;
  messages:     Array<ThreadMessage>;
  mode:         Mode;
  name:         string;
  updatedAt:    number;
}

export type {
  AspectRatio,
  Config,
  ImageSize,
  MessagePart,
  Mode,
  PendingInput,
  Thread,
  ThreadMessage,
};
