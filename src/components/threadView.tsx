/**
 * @file Thread view component for displaying and sending messages.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component requires complex async logic */
/* eslint-disable complexity -- Component renders conditionally based on many state values */
/* eslint-disable max-lines -- Retry and send logic requires many lines */
/* eslint-disable react/jsx-no-bind -- Per-message index closures require inline handlers in map */

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { InputArea } from "./inputArea.tsx";
import { MessageBubble } from "./messageBubble.tsx";
import type {
  MessagePart,
  Mode,
  PendingInput,
  Thread,
  ThreadMessage,
} from "../types/index.ts";

const headerClass = [
  "flex items-center gap-3 px-6 py-4",
  "border-b border-purple-900/30 bg-[#1a1028]/50",
].join(" ");

const loadingBubbleClass = [
  "bg-[#241836] border border-purple-900/20",
  "rounded-2xl rounded-tl-sm px-4 py-3",
].join(" ");

const errorBubbleClass = [
  "bg-red-900/20 border border-red-700/40",
  "rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]",
].join(" ");

const errorRetryButtonClass = [
  "text-red-400 hover:text-red-200 text-xs mt-2 transition-colors block",
].join(" ");

const dotOneDelay = { animationDelay: "0ms" };
const dotTwoDelay = { animationDelay: "150ms" };
const dotThreeDelay = { animationDelay: "300ms" };
const dotClass = "w-2 h-2 bg-purple-400 rounded-full animate-bounce";

const modeBadgeColour = (mode: Mode): string => {
  if (mode === "avatar") {
    return "bg-purple-900/40 text-purple-300";
  }
  if (mode === "art") {
    return "bg-pink-900/40 text-pink-300";
  }
  return "bg-blue-900/40 text-blue-300";
};

const modeLabel = (mode: Mode): string => {
  if (mode === "avatar") {
    return "Avatar";
  }
  if (mode === "art") {
    return "Art";
  }
  return "Replace";
};

interface BuildUserPartsOptions {
  readonly imageBase64?: string;
  readonly imageMime?:   string;
  readonly text:         string;
}

const buildUserParts = ({
  imageBase64,
  imageMime,
  text,
}: BuildUserPartsOptions): Array<MessagePart> => {
  const userParts: Array<MessagePart> = [];

  if (imageBase64 === undefined) {
    userParts.push({ text: text, type: "text" });
  } else {
    userParts.push({
      imageData: imageBase64,
      mimeType:  imageMime ?? "image/png",
      type:      "image",
    });
    if (text.length > 0) {
      userParts.push({ text: text, type: "text" });
    }
  }

  return userParts;
};

interface ThreadViewProperties {
  readonly apiKey:               string;
  readonly errorMessage?:        string;
  readonly isLoading:            boolean;
  readonly loadingStartTime?:    number;
  readonly onErrorChange:        (error: string | undefined)=> void;
  readonly onLoadingChange:      (loading: boolean)=> void;
  readonly onPendingInputChange: (input: PendingInput | undefined)=> void;
  readonly onUpdate:             (thread: Thread)=> void;
  readonly pendingInput?:        PendingInput;
  readonly thread:               Thread;
}

/**
 * Renders the thread view with messages and input area.
 * @param props - The component props.
 * @param props.apiKey - The Gemini API key to use for requests.
 * @param props.errorMessage - The persisted error message for this thread, if any.
 * @param props.isLoading - Whether a generation is currently in progress.
 * @param props.loadingStartTime - Timestamp when loading started, for the elapsed timer.
 * @param props.onErrorChange - Callback to update the error message in the parent.
 * @param props.onLoadingChange - Callback to update the loading state in the parent.
 * @param props.onPendingInputChange - Callback when the pending input changes.
 * @param props.onUpdate - Callback when thread is updated.
 * @param props.pendingInput - The persisted pending input for this thread.
 * @param props.thread - The thread to display.
 * @returns The JSX element.
 */
const threadView = ({
  apiKey,
  errorMessage,
  isLoading,
  loadingStartTime,
  onErrorChange,
  onLoadingChange,
  onPendingInputChange,
  onUpdate,
  pendingInput,
  thread,
}: ThreadViewProperties): JSX.Element => {
  const [ elapsedSeconds, setElapsedSeconds ] = useState(() => {
    return loadingStartTime === undefined
      ? 0
      : Math.floor((Date.now() - loadingStartTime) / 1000);
  });
  const messagesEndReference = useRef<HTMLDivElement>(null);

  useEffect((): VoidFunction | undefined => {
    if (isLoading) {
      const startTime = loadingStartTime ?? Date.now();
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return (): void => {
        clearInterval(interval);
      };
    }
    setElapsedSeconds(0);
    return undefined;
  }, [ isLoading, loadingStartTime ]);

  const scrollToBottom = useCallback((): void => {
    messagesEndReference.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [ thread.messages, isLoading, scrollToBottom ]);

  const handleSend = useCallback(
    (
      text: string,
      imageBase64?: string,
      imageMime?: string,
    ): void => {
      onLoadingChange(true);
      onErrorChange(undefined);

      const {
        aspectRatio,
        imageSize: rawImageSize,
        messages,
        mode,
      } = thread;
      const imageSize = rawImageSize ?? "4K";
      const userParts = buildUserParts({
        /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
        ...(imageBase64 !== undefined && { imageBase64 }),
        /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
        ...(imageMime !== undefined && { imageMime }),
        text,
      });

      const userMessage: ThreadMessage = {
        parts: userParts,
        role:  "user",
      };

      const historyForApi = messages;

      const updatedThread: Thread = {
        ...thread,
        messages:  [ ...messages, userMessage ],
        updatedAt: Date.now(),
      };
      onUpdate(updatedThread);

      const performSend = async(): Promise<void> => {
        try {
          const history = historyForApi;
          const userImageBase64 = imageBase64 ?? undefined;
          const userImageMime = imageMime ?? undefined;
          const userText = text.length > 0
            ? text
            : undefined;

          await invoke("save_thread", { thread: updatedThread });

          interface SendResult {
            costUsd: number;
            parts:   Array<MessagePart>;
          }
          const response = await invoke<SendResult>(
            "send_message",
            {
              apiKey,
              aspectRatio,
              history,
              imageSize,
              mode,
              userImageBase64,
              userImageMime,
              userText,
            },
          );

          const modelMessage: ThreadMessage = {
            cost:  response.costUsd,
            parts: response.parts,
            role:  "model",
          };

          const finalThread: Thread = {
            ...updatedThread,
            messages:  [ ...updatedThread.messages, modelMessage ],
            updatedAt: Date.now(),
          };

          await invoke("save_thread", { thread: finalThread });
          onUpdate(finalThread);
        } catch (error) {
          onErrorChange(String(error));
        } finally {
          onLoadingChange(false);
        }
      };

      void performSend();
    },
    [ thread, onUpdate, onLoadingChange, onErrorChange ],
  );

  const handleRetry = useCallback(
    (modelMessageIndex: number): void => {
      const {
        aspectRatio,
        imageSize: rawImageSize,
        messages,
        mode,
      } = thread;
      const imageSize = rawImageSize ?? "4K";
      const userMessageIndex = modelMessageIndex - 1;
      const userMessage = messages[userMessageIndex];

      if (userMessage === undefined || userMessage.role !== "user") {
        return;
      }

      const textPart = userMessage.parts.find((p) => {
        return p.type === "text";
      });
      const imagePart = userMessage.parts.find((p) => {
        return p.type === "image";
      });

      // Use key names matching the invoke parameters for shorthand compatibility
      const rawText = textPart?.text ?? "";
      const userText = rawText.length > 0
        ? rawText
        : undefined;
      const userImageBase64 = imagePart?.imageData;
      const userImageMime = imagePart?.mimeType;

      // Keep the user message, drop the model response (and anything after)
      const keptMessages = messages.slice(0, modelMessageIndex);
      const history = messages.slice(0, userMessageIndex);

      onLoadingChange(true);
      onErrorChange(undefined);

      const keptThread: Thread = {
        ...thread,
        messages:  keptMessages,
        updatedAt: Date.now(),
      };
      onUpdate(keptThread);

      const performRetry = async(): Promise<void> => {
        try {
          await invoke("save_thread", { thread: keptThread });

          interface SendResult {
            costUsd: number;
            parts:   Array<MessagePart>;
          }
          const response = await invoke<SendResult>("send_message", {
            apiKey,
            aspectRatio,
            history,
            imageSize,
            mode,
            userImageBase64,
            userImageMime,
            userText,
          });

          const modelMessage: ThreadMessage = {
            cost:  response.costUsd,
            parts: response.parts,
            role:  "model",
          };

          const finalThread: Thread = {
            ...keptThread,
            messages:  [ ...keptMessages, modelMessage ],
            updatedAt: Date.now(),
          };

          await invoke("save_thread", { thread: finalThread });
          onUpdate(finalThread);
        } catch (error) {
          onErrorChange(String(error));
        } finally {
          onLoadingChange(false);
        }
      };

      void performRetry();
    },
    [ thread, apiKey, onUpdate, onLoadingChange, onErrorChange ],
  );

  const handleErrorRetry = useCallback((): void => {
    handleRetry(thread.messages.length);
  }, [ handleRetry, thread ]);

  const handleDelete = useCallback(
    (messageIndex: number): void => {
      const trimmedMessages = thread.messages.slice(0, messageIndex);
      const updatedThread: Thread = {
        ...thread,
        messages:  trimmedMessages,
        updatedAt: Date.now(),
      };
      onUpdate(updatedThread);
      void invoke("save_thread", { thread: updatedThread });
    },
    [ thread, onUpdate ],
  );

  const handleEditCommit = useCallback(
    (messageIndex: number, editedText: string): void => {
      const {
        aspectRatio,
        imageSize: rawImageSize,
        messages,
        mode,
      } = thread;
      const imageSize = rawImageSize ?? "4K";
      const originalMessage = messages[messageIndex];
      if (originalMessage === undefined) {
        return;
      }

      const updatedParts = originalMessage.parts.map((part) => {
        return part.type === "text"
          ? { ...part, text: editedText }
          : part;
      });

      const updatedUserMessage: ThreadMessage = {
        ...originalMessage,
        parts: updatedParts,
      };

      const history = messages.slice(0, messageIndex);
      const imagePart = updatedParts.find((part) => {
        return part.type === "image";
      });
      const userImageBase64 = imagePart?.imageData;
      const userImageMime = imagePart?.mimeType;
      const userText = editedText.length > 0
        ? editedText
        : undefined;

      const keptMessages = [
        ...messages.slice(0, messageIndex),
        updatedUserMessage,
      ];
      const keptThread: Thread = {
        ...thread,
        messages:  keptMessages,
        updatedAt: Date.now(),
      };

      onLoadingChange(true);
      onErrorChange(undefined);
      onUpdate(keptThread);

      const performEdit = async(): Promise<void> => {
        try {
          await invoke("save_thread", { thread: keptThread });

          interface SendResult {
            costUsd: number;
            parts:   Array<MessagePart>;
          }
          const response = await invoke<SendResult>("send_message", {
            apiKey,
            aspectRatio,
            history,
            imageSize,
            mode,
            userImageBase64,
            userImageMime,
            userText,
          });

          const modelMessage: ThreadMessage = {
            cost:  response.costUsd,
            parts: response.parts,
            role:  "model",
          };

          const finalThread: Thread = {
            ...keptThread,
            messages:  [ ...keptMessages, modelMessage ],
            updatedAt: Date.now(),
          };

          await invoke("save_thread", { thread: finalThread });
          onUpdate(finalThread);
        } catch (error) {
          onErrorChange(String(error));
        } finally {
          onLoadingChange(false);
        }
      };

      void performEdit();
    },
    [ thread, apiKey, onUpdate, onLoadingChange, onErrorChange ],
  );

  return (
    <div className="flex flex-col h-full">
      <div className={headerClass}>
        <h2 className="text-white font-semibold flex-1 truncate">
          {thread.name}
        </h2>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${modeBadgeColour(thread.mode)}`}
        >
          {modeLabel(thread.mode)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {thread.messages.length === 0
          ? <div
            className={[
              "flex items-center justify-center",
              "h-full text-gray-500 text-sm",
            ].join(" ")}
          >
            {"Start by sending your first prompt!"}
          </div>

          : null}

        {thread.messages.map((message, messageIndex) => {
          return (
            <MessageBubble
              key={`message-${String(messageIndex)}`}
              message={message}
              onDelete={(): void => {
                handleDelete(messageIndex);
              }}
              {...(message.role === "user" && {
                onEdit: (editedText: string): void => {
                  handleEditCommit(messageIndex, editedText);
                },
              })}
              {...(message.role === "model" && {
                onRetry: (): void => {
                  handleRetry(messageIndex);
                },
              })}
            />
          );
        })}

        {isLoading
          ? <div className="flex justify-start mb-4">
            <div className={loadingBubbleClass}>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <span className={dotClass} style={dotOneDelay} />
                  <span className={dotClass} style={dotTwoDelay} />
                  <span className={dotClass} style={dotThreeDelay} />
                </div>
                <span className="text-sm">{`Generating... (${String(elapsedSeconds)}s)`}</span>
              </div>
            </div>
          </div>

          : null}

        {errorMessage === undefined
          ? null

          : <div className="flex justify-start mb-4">
            <div className={errorBubbleClass}>
              <p className="text-red-300 text-sm">
                {`⚠️ Error: ${errorMessage}`}
              </p>
              <button
                className={errorRetryButtonClass}
                disabled={isLoading}
                onClick={handleErrorRetry}
                type="button"
              >
                {"🔄 Retry"}
              </button>
            </div>
          </div>}

        <div ref={messagesEndReference} />
      </div>

      <InputArea
        {...(pendingInput?.imageBase64 !== undefined && {
          initialImageBase64: pendingInput.imageBase64,
        })}
        {...(pendingInput?.imageMime !== undefined && {
          initialImageMime: pendingInput.imageMime,
        })}
        {...(pendingInput?.imagePreview !== undefined && {
          initialImagePreview: pendingInput.imagePreview,
        })}
        {...(pendingInput?.text !== undefined && {
          initialText: pendingInput.text,
        })}
        {...(thread.aspectRatio !== undefined && {
          aspectRatio: thread.aspectRatio,
        })}
        hasMessages={thread.messages.length > 0}
        imageSize={thread.imageSize ?? "4K"}
        isLoading={isLoading}
        mode={thread.mode}
        onInputChange={onPendingInputChange}
        onSend={handleSend}
      />
    </div>
  );
};

export { threadView as ThreadView };
