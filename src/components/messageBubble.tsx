/**
 * @file Message bubble component for displaying chat messages.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component JSX inherently requires many lines */
/* eslint-disable max-statements -- Component requires many callbacks and state variables */
/* eslint-disable complexity -- UI component has inherently complex conditional rendering */
import { invoke } from "@tauri-apps/api/core";
import {
  useCallback,
  useState,
  type ChangeEvent,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { MessagePart, ThreadMessage } from "../types/index.ts";

const modelBubbleClass = [
  "bg-[#241836] text-gray-100",
  "rounded-tl-sm border border-purple-900/20",
].join(" ");

const thoughtContentClass = [
  "mt-1 text-xs text-gray-400 italic",
  "border-l-2 border-purple-800/40 pl-2",
  "leading-relaxed whitespace-pre-wrap",
].join(" ");

const downloadButtonClass = [
  "text-gray-400 hover:text-white text-xs mt-1 transition-colors",
].join(" ");

const footerActionClass = [
  "text-gray-500 hover:text-purple-300 text-xs transition-colors",
].join(" ");

const deleteActionClass = [
  "text-gray-500 hover:text-red-400 text-xs transition-colors",
].join(" ");

const thoughtButtonClass = [
  "text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1",
].join(" ");

const editTextareaClass = [
  "w-full bg-[#0f0a1a] border border-purple-700/40 rounded-lg",
  "px-3 py-2 text-sm text-white resize-none focus:outline-none",
  "focus:border-purple-500/60 min-h-[80px]",
].join(" ");

const editSaveButtonClass = [
  "text-xs bg-purple-700 hover:bg-purple-600",
  "text-white px-3 py-1 rounded-lg transition-colors",
].join(" ");

const editCancelButtonClass = [
  "text-xs text-gray-400 hover:text-gray-200 transition-colors",
].join(" ");

interface MessageBubbleProperties {
  readonly message:   ThreadMessage;
  readonly onDelete?: ()=> void;
  readonly onEdit?:   (editedText: string)=> void;
  readonly onRetry?:  ()=> void;
}

/**
 * Renders a single message bubble in the thread view.
 * @param props - The component props.
 * @param props.message - The message to display.
 * @param props.onDelete - Optional callback to delete this message and all following.
 * @param props.onEdit - Optional callback to update the user message text and re-run.
 * @param props.onRetry - Optional callback to retry generating this response.
 * @returns The JSX element.
 */
const messageBubble = ({
  message,
  onDelete,
  onEdit,
  onRetry,
}: MessageBubbleProperties): JSX.Element => {
  const isUser = message.role === "user";
  const bubbleClass = isUser
    ? "bg-purple-700/60 text-white rounded-tr-sm"
    : modelBubbleClass;

  const [ thoughtExpanded, setThoughtExpanded ] = useState(false);
  const [ isHovered, setIsHovered ] = useState(false);
  const [ isEditing, setIsEditing ] = useState(false);
  const [ editingText, setEditingText ] = useState("");

  const originalTextPart = message.parts.find((part) => {
    return part.type === "text";
  });

  const toggleThought = useCallback((): void => {
    setThoughtExpanded((previous) => {
      return !previous;
    });
  }, []);

  const handleMouseEnter = useCallback((): void => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsHovered(false);
  }, []);

  const handleEditStart = useCallback((): void => {
    setEditingText(originalTextPart?.text ?? "");
    setIsEditing(true);
  }, [ originalTextPart ]);

  const handleEditCancel = useCallback((): void => {
    setIsEditing(false);
  }, []);

  const handleEditSave = useCallback((): void => {
    setIsEditing(false);
    onEdit?.(editingText);
  }, [ editingText, onEdit ]);

  const handleEditChange = useCallback(
    (changeEvent: ChangeEvent<HTMLTextAreaElement>): void => {
      setEditingText(changeEvent.target.value);
    },
    [],
  );

  const handleEditKeyDown = useCallback(
    (keyEvent: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (keyEvent.key === "Enter" && (keyEvent.ctrlKey || keyEvent.metaKey)) {
        handleEditSave();
      }
      if (keyEvent.key === "Escape") {
        handleEditCancel();
      }
    },
    [ handleEditSave, handleEditCancel ],
  );

  const handleDownloadClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const { imageData, mimeType } = event.currentTarget.dataset;
      if (imageData !== undefined && mimeType !== undefined) {
        const extension = mimeType.includes("jpeg") || mimeType.includes("jpg")
          ? "jpg"
          : "png";
        const fileName = `Generated_Image_${String(Date.now())}.${extension}`;
        void invoke("save_image", {
          base64Data: imageData,
          fileName:   fileName,
          mimeType:   mimeType,
        });
      }
    },
    [],
  );

  const renderThoughtPart = (key: string, text: string): JSX.Element => {
    return (
      <div className="mb-2" key={key}>
        <button
          className={thoughtButtonClass}
          onClick={toggleThought}
          type="button"
        >
          <span>{thoughtExpanded
            ? "▼"
            : "▶"}</span>
          <span>{"Model reasoning"}</span>
        </button>
        {thoughtExpanded
          ? <div className={thoughtContentClass}>
            {text}
          </div>

          : null}
      </div>
    );
  };

  const renderImagePart = (key: string, part: MessagePart): JSX.Element => {
    const { imageData = "" } = part;
    const mimeType = part.mimeType ?? "image/png";
    const source = `data:${mimeType};base64,${imageData}`;
    return (
      <div className="mt-2" key={key}>
        <img
          alt="Generated artwork"
          className="max-w-[50%] rounded-lg"
          src={source}
        />
        {isUser
          ? null
          : <button
            className={downloadButtonClass}
            data-image-data={imageData}
            data-mime-type={mimeType}
            onClick={handleDownloadClick}
            type="button"
          >
            {"⬇ Download"}
          </button>}
      </div>
    );
  };

  const renderPart = (
    part: MessagePart,
    partIndex: number,
  ): JSX.Element | null => {
    const key = `part-${String(partIndex)}`;
    if (part.type === "thought" && part.text !== undefined && !isUser) {
      return renderThoughtPart(key, part.text);
    }
    if (part.type === "text" && part.text !== undefined && !isEditing) {
      return (
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          key={key}
        >
          {part.text}
        </p>
      );
    }
    if (part.type === "image" && part.imageData !== undefined) {
      return renderImagePart(key, part);
    }
    return null;
  };

  const editArea = isEditing
    ? <div className="mt-2 space-y-2">
      <textarea
        autoFocus={true}
        className={editTextareaClass}
        onChange={handleEditChange}
        onKeyDown={handleEditKeyDown}
        value={editingText}
      />
      <div className="flex gap-2">
        <button
          className={editSaveButtonClass}
          onClick={handleEditSave}
          type="button"
        >
          {"✓ Save & Re-run"}
        </button>
        <button
          className={editCancelButtonClass}
          onClick={handleEditCancel}
          type="button"
        >
          {"✗ Cancel"}
        </button>
      </div>
    </div>

    : null;

  const showUserActions = isUser && (isHovered || isEditing) && !isEditing;
  const userFooter = showUserActions
    ? <div className="border-t border-purple-700/20 mt-2 pt-1 flex gap-3">
      {originalTextPart !== undefined && onEdit !== undefined
        ? <button
          className={footerActionClass}
          onClick={handleEditStart}
          type="button"
        >
          {"✏️ Edit"}
        </button>

        : null}
      {onDelete === undefined
        ? null
        : <button
          className={deleteActionClass}
          onClick={onDelete}
          type="button"
        >
          {"🗑 Delete"}
        </button>}
    </div>

    : null;

  return (
    <div
      className={`flex w-full mb-4 ${isUser
        ? "justify-end"
        : "justify-start"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${bubbleClass}`}>
        {message.parts.map((part: MessagePart, partIndex: number) => {
          return renderPart(part, partIndex);
        })}
        {editArea}
        {userFooter}
        {isUser
          ? null
          : <>
            {message.cost === undefined
              ? null
              : <p className="text-xs text-gray-500 mt-2 text-right">
                {`Cost: $${message.cost.toFixed(4)}`}
              </p>}
            <div className="border-t border-purple-900/20 mt-2 pt-1 flex gap-3">
              {onRetry === undefined
                ? null
                : <button
                  className={footerActionClass}
                  onClick={onRetry}
                  type="button"
                >
                  {"🔄 Retry"}
                </button>}
              {onDelete === undefined
                ? null
                : <button
                  className={deleteActionClass}
                  onClick={onDelete}
                  type="button"
                >
                  {"🗑 Delete"}
                </button>}
            </div>
          </>}
      </div>
    </div>
  );
};

export { messageBubble as MessageBubble };
