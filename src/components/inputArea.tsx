/**
 * @file Input area component for composing and sending messages.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component requires complex file handling and send logic */
/* eslint-disable max-lines -- Clipboard and file handling requires many handlers */
/* eslint-disable complexity -- Replace mode has conditional branches for initial vs follow-up state */
/* eslint-disable max-statements -- Component requires many state variables and handlers */

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type JSX,
  type KeyboardEvent,
} from "react";
import type {
  AspectRatio,
  ImageSize,
  Mode,
  PendingInput,
} from "../types/index.ts";

const dropZoneBaseClass = [
  "border-2 border-dashed rounded-xl p-8",
  "text-center cursor-pointer transition-all duration-200",
].join(" ");

const dropZoneActiveClass = "border-blue-400 bg-blue-900/20";
const dropZoneInactiveClass = [
  "border-purple-900/40",
  "hover:border-blue-500/60 hover:bg-blue-900/10",
].join(" ");

const replaceButtonClass = [
  "w-full bg-blue-600 hover:bg-blue-500",
  "disabled:bg-gray-700 disabled:cursor-not-allowed",
  "text-white font-semibold py-3 rounded-xl transition-all duration-200",
].join(" ");

const sendButtonClass = [
  "bg-gradient-to-r from-purple-600 to-pink-600",
  "hover:from-purple-500 hover:to-pink-500",
  "disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed",
  "text-white font-semibold py-3 px-5 rounded-xl",
  "transition-all duration-200 min-w-[80px]",
].join(" ");

const textareaClass = [
  "flex-1 bg-[#241836] border border-purple-900/40",
  "focus:border-purple-500/60 rounded-xl px-4 py-3",
  "text-white placeholder-gray-600 resize-none outline-none",
  "transition-colors text-sm",
].join(" ");

const clearButtonClass = [
  "absolute top-1 right-1 bg-black/60 hover:bg-black/80",
  "text-white rounded-full w-6 h-6 flex items-center",
  "justify-center text-xs transition-colors",
].join(" ");

const pasteButtonClass = [
  "w-full border border-purple-900/40 hover:border-purple-500/60",
  "bg-transparent hover:bg-purple-900/10 text-gray-400 hover:text-gray-200",
  "text-sm py-2 rounded-xl transition-all duration-200",
].join(" ");

interface BuildPendingInputOptions {
  readonly imageBase64?:  string;
  readonly imageMime?:    string;
  readonly imagePreview?: string;
  readonly text:          string;
}

const buildPendingInput = ({
  imageBase64,
  imageMime,
  imagePreview,
  text,
}: BuildPendingInputOptions): PendingInput | undefined => {
  const hasText = text.trim().length > 0;
  const hasImage = imageBase64 !== undefined;
  if (!hasText && !hasImage) {
    return undefined;
  }
  return {
    /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
    ...(hasImage && { imageBase64, imageMime, imagePreview }),
    /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
    ...(hasText && { text }),
  };
};

const readClipboardImage = async(
  onFileRead: (file: File)=> void,
): Promise<void> => {
  const clipboardItems = await navigator.clipboard.read();
  const imageItem = clipboardItems.find((item) => {
    return item.types.some((type) => {
      return type.startsWith("image/");
    });
  });
  if (imageItem === undefined) {
    return;
  }
  const imageType = imageItem.types.find((type) => {
    return type.startsWith("image/");
  });
  if (imageType === undefined) {
    return;
  }
  const blob = await imageItem.getType(imageType);
  onFileRead(new File([ blob ], "clipboard.png", { type: imageType }));
};

const modeLabelText = (
  mode:        Mode,
  aspectRatio: AspectRatio | undefined,
  imageSize:   ImageSize,
): string => {
  if (mode === "avatar") {
    return `🟣 Avatar Mode · ${imageSize}`;
  }
  if (mode === "art") {
    const ratio = aspectRatio ?? "16:9";
    return `🩷 Art Mode (${ratio}) · ${imageSize}`;
  }
  return `🔵 Replace Mode · ${imageSize}`;
};

type OnSendCallback = (
  text:        string,
  imageBase64?: string,
  imageMime?:  string,
)=> void;

interface InputAreaProperties {
  readonly aspectRatio?:         AspectRatio;
  readonly hasMessages:          boolean;
  readonly imageSize:            ImageSize;
  readonly initialImageBase64?:  string;
  readonly initialImageMime?:    string;
  readonly initialImagePreview?: string;
  readonly initialText?:         string;
  readonly isLoading:            boolean;
  readonly mode:                 Mode;
  readonly onInputChange?:       (input: PendingInput | undefined)=> void;
  readonly onSend:               OnSendCallback;
}

/**
 * Renders the input area for composing and sending messages.
 * @param props - The component props.
 * @param props.aspectRatio - The thread's aspect ratio setting (Art mode only).
 * @param props.hasMessages - Whether the thread already has messages (affects replace mode UI).
 * @param props.imageSize - The thread's resolution setting.
 * @param props.initialImageBase64 - Initial base64 image data to pre-populate.
 * @param props.initialImageMime - Initial image MIME type to pre-populate.
 * @param props.initialImagePreview - Initial image preview URL to pre-populate.
 * @param props.initialText - Initial draft text to pre-populate.
 * @param props.isLoading - Whether a message is currently being sent.
 * @param props.mode - The current generation mode.
 * @param props.onInputChange - Callback when any pending input (text or image) changes.
 * @param props.onSend - Callback to send a message.
 * @returns The JSX element.
 */
const inputArea = ({
  aspectRatio,
  hasMessages,
  imageSize,
  initialImageBase64,
  initialImageMime,
  initialImagePreview,
  initialText,
  isLoading,
  mode,
  onInputChange,
  onSend,
}: InputAreaProperties): JSX.Element => {
  const [ text, setText ] = useState(initialText ?? "");
  const [ imageBase64, setImageBase64 ] = useState<string | undefined>(
    initialImageBase64,
  );
  const [ imageMime, setImageMime ] = useState<string | undefined>(
    initialImageMime,
  );
  const [ imagePreview, setImagePreview ] = useState<string | undefined>(
    initialImagePreview,
  );
  const [ isDragging, setIsDragging ] = useState(false);
  const fileInputReference = useRef<HTMLInputElement>(null);

  const handleFileRead = useCallback((file: File): void => {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== "string") {
        return;
      }
      const [ , base64Data ] = dataUrl.split(",");
      if (base64Data === undefined) {
        return;
      }
      const mimeType = file.type.length > 0
        ? file.type
        : "image/png";
      setImageBase64(base64Data);
      setImageMime(mimeType);
      setImagePreview(dataUrl);
      onInputChange?.(buildPendingInput({
        imageBase64:  base64Data,
        imageMime:    mimeType,
        imagePreview: dataUrl,
        text:         text,
      }));
    });
    reader.readAsDataURL(file);
  }, [ onInputChange, text ]);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file !== undefined) {
        handleFileRead(file);
      }
    },
    [ handleFileRead ],
  );

  const handleDrop = useCallback(
    (event: DragEvent): void => {
      event.preventDefault();
      setIsDragging(false);
      const [ file ] = event.dataTransfer.files;
      if (file?.type.startsWith("image/") === true) {
        handleFileRead(file);
      }
    },
    [ handleFileRead ],
  );

  const handleDragOver = useCallback((event: DragEvent): void => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const clearImage = useCallback((): void => {
    setImageBase64(undefined);
    setImageMime(undefined);
    setImagePreview(undefined);
    if (fileInputReference.current !== null) {
      fileInputReference.current.value = "";
    }
    onInputChange?.(buildPendingInput({ text }));
  }, [ onInputChange, text ]);

  const isInitialReplace = mode === "replace" && !hasMessages;

  const handleSend = useCallback((): void => {
    if (isLoading) {
      return;
    }
    if (isInitialReplace && imageBase64 === undefined) {
      return;
    }
    const hasContent = text.trim().length > 0 || imageBase64 !== undefined;
    if (!isInitialReplace && !hasContent) {
      return;
    }

    onSend(text, imageBase64, imageMime);
    setText("");
    setImageBase64(undefined);
    setImageMime(undefined);
    setImagePreview(undefined);
    onInputChange?.(undefined);
  }, [
    isLoading,
    isInitialReplace,
    imageBase64,
    text,
    imageMime,
    onSend,
    onInputChange,
  ]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [ handleSend ],
  );

  const handleDropZoneClick = useCallback((): void => {
    fileInputReference.current?.click();
  }, []);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>): void => {
      const imageItem = [ ...event.clipboardData.items ].find((item) => {
        return item.type.startsWith("image/");
      });
      if (imageItem !== undefined) {
        const file = imageItem.getAsFile();
        if (file !== null) {
          handleFileRead(file);
        }
      }
    },
    [ handleFileRead ],
  );

  const handlePasteButtonClick = useCallback((): void => {
    void readClipboardImage(handleFileRead);
  }, [ handleFileRead ]);

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      setText(event.target.value);
      onInputChange?.(buildPendingInput({
        /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
        ...(imageBase64 !== undefined && { imageBase64 }),
        /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
        ...(imageMime !== undefined && { imageMime }),
        /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
        ...(imagePreview !== undefined && { imagePreview }),
        text: event.target.value,
      }));
    },
    [ onInputChange, imageBase64, imageMime, imagePreview ],
  );

  const dropZoneClass = [
    dropZoneBaseClass,
    isDragging
      ? dropZoneActiveClass
      : dropZoneInactiveClass,
  ].join(" ");

  const hasNoContent = text.trim().length === 0 && imageBase64 === undefined;
  const isSendDisabled = isLoading || hasNoContent;

  return (
    <div className="border-t border-purple-900/30 p-4 bg-[#0f0a1a]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {modeLabelText(mode, aspectRatio, imageSize)}
        </span>
      </div>

      {isInitialReplace
        ? <div className="flex flex-col gap-3">
          {imagePreview === undefined
            ? <div className="flex flex-col gap-2">
              <div
                className={dropZoneClass}
                onClick={handleDropZoneClick}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onPaste={handlePaste}
                role="button"
                tabIndex={0}
              >
                <div className="text-3xl mb-2">{"📁"}</div>
                <p className="text-gray-400 text-sm">
                  {"Drop an image here, or "}
                  <span className="text-blue-400 underline">
                    {"click to browse"}
                  </span>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {"PNG, JPG, WEBP supported"}
                </p>
              </div>
              <button
                className={pasteButtonClass}
                onClick={handlePasteButtonClick}
                type="button"
              >
                {"📋 Paste from clipboard"}
              </button>
            </div>

            : <div className="relative inline-block">
              <img
                alt="Upload preview"
                className="max-h-40 rounded-lg border border-purple-700/40"
                src={imagePreview}
              />
              <button
                className={clearButtonClass}
                onClick={clearImage}
                type="button"
              >
                {"×"}
              </button>
            </div>}

          <input
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputReference}
            type="file"
          />

          <textarea
            className={textareaClass}
            disabled={isLoading}
            onChange={handleTextChange}
            placeholder="Add notes to include with the image (optional)..."
            rows={2}
            value={text}
          />

          <button
            className={replaceButtonClass}
            disabled={isLoading || imageBase64 === undefined}
            onClick={handleSend}
            type="button"
          >
            {isLoading
              ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">{"⟳"}</span>
                {" Generating..."}
              </span>

              : "Replace Image ✨"}
          </button>
        </div>

        : <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {imagePreview === undefined
              ? <button
                className={pasteButtonClass}
                onClick={handlePasteButtonClick}
                type="button"
              >
                {mode === "replace"
                  ? "📋 Paste replacement image (optional)"
                  : "📋 Paste image (optional)"}
              </button>

              : <div className="relative inline-block">
                <img
                  alt="Upload preview"
                  className="max-h-32 rounded-lg border border-purple-700/40"
                  src={imagePreview}
                />
                <button
                  className={clearButtonClass}
                  onClick={clearImage}
                  type="button"
                >
                  {"×"}
                </button>
              </div>}
            <input
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputReference}
              type="file"
            />
          </div>

          <div className="flex gap-3 items-end">
            <textarea
              className={textareaClass}
              disabled={isLoading}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={mode === "replace"
                ? "Give correction instructions (e.g. fix the eye colour)..."
                : "Describe the art you want to generate..."}
              rows={3}
              value={text}
            />
            <button
              className={sendButtonClass}
              disabled={isSendDisabled}
              onClick={handleSend}
              type="button"
            >
              {isLoading
                ? <span className="flex items-center gap-1">
                  <span className="animate-spin inline-block">{"⟳"}</span>
                </span>

                : "Send ✨"}
            </button>
          </div>
        </div>}
    </div>
  );
};

export { inputArea as InputArea };
