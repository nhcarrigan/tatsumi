/**
 * @file Modal for selecting a new thread generation mode.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component JSX inherently requires many lines */
import { useCallback, type JSX, type MouseEvent } from "react";
import type { Mode } from "../types/index.ts";

interface ModeOption {
  colour:      string;
  description: string;
  icon:        string;
  label:       string;
  mode:        Mode;
}

const avatarDescription = [
  "Generate a square 1:1 portrait.",
  "Perfect for profile pictures and avatars.",
].join(" ");

const artDescription = [
  "Generate wide 16:9 landscape artwork.",
  "Great for wallpapers and banners.",
].join(" ");

const replaceDescription = [
  "Upload an image and have Naomi redrawn in",
  "anime style with the same pose and outfit.",
].join(" ");

const modeOptionList: Array<ModeOption> = [
  {
    colour:      "purple",
    description: avatarDescription,
    icon:        "👤",
    label:       "Avatar Mode",
    mode:        "avatar",
  },
  {
    colour:      "pink",
    description: artDescription,
    icon:        "🎨",
    label:       "Art Mode",
    mode:        "art",
  },
  {
    colour:      "blue",
    description: replaceDescription,
    icon:        "🔄",
    label:       "Replace Mode",
    mode:        "replace",
  },
];

const colourMap: Record<
  string,
  { badge: string; button: string; hover: string }
> = {
  blue: {
    badge:  "bg-blue-900/40 text-blue-300",
    button: "bg-blue-600 hover:bg-blue-500",
    hover:  "hover:border-blue-400 hover:bg-blue-900/20",
  },
  pink: {
    badge:  "bg-pink-900/40 text-pink-300",
    button: "bg-pink-600 hover:bg-pink-500",
    hover:  "hover:border-pink-400 hover:bg-pink-900/20",
  },
  purple: {
    badge:  "bg-purple-900/40 text-purple-300",
    button: "bg-purple-600 hover:bg-purple-500",
    hover:  "hover:border-purple-400 hover:bg-purple-900/20",
  },
};

const validModesSet = new Set<string>([ "avatar", "art", "replace" ]);

const isMode = (value: string): value is Mode => {
  return validModesSet.has(value);
};

const overlayClass = [
  "fixed inset-0 bg-black/70 backdrop-blur-sm",
  "flex items-center justify-center z-50",
].join(" ");

const panelClass = [
  "bg-[#1a1028] border border-purple-900/40",
  "rounded-2xl p-8 max-w-2xl w-full mx-4",
  "shadow-2xl shadow-purple-900/30",
].join(" ");

interface NewThreadModalProperties {
  readonly onClose:  ()=> void;
  readonly onSelect: (mode: Mode)=> void;
}

/**
 * Renders the new thread modal for selecting a generation mode.
 * @param props - The component props.
 * @param props.onClose - Callback to close the modal.
 * @param props.onSelect - Callback when a mode is selected.
 * @returns The JSX element.
 */
const threadModal = ({
  onClose,
  onSelect,
}: NewThreadModalProperties): JSX.Element => {
  const handleModeSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const rawMode = event.currentTarget.dataset.mode;
      if (rawMode !== undefined && isMode(rawMode)) {
        onSelect(rawMode);
      }
    },
    [ onSelect ],
  );

  return (
    <div className={overlayClass}>
      <div className={panelClass}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {"New Thread"}
          </h2>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            type="button"
          >
            {"×"}
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          {"Choose a generation mode to begin:"}
        </p>

        <div className="flex flex-col gap-4">
          {modeOptionList.map((option) => {
            const colours = colourMap[option.colour];
            const buttonClass = [
              "flex items-center gap-4 p-5 rounded-xl",
              "border border-purple-900/30 bg-[#241836]",
              "text-left transition-all duration-200",
              colours?.hover ?? "",
            ].join(" ");
            return (
              <button
                className={buttonClass}
                data-mode={option.mode}
                key={option.mode}
                onClick={handleModeSelect}
                type="button"
              >
                <span className="text-4xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-lg">
                      {option.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${colours?.badge ?? ""}`}
                    >
                      {option.mode}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
                <span className="text-gray-500 text-xl">{"→"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { threadModal as NewThreadModal };
