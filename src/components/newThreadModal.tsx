/**
 * @file Modal for selecting a new thread generation mode and options.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component JSX inherently requires many lines */
/* eslint-disable max-lines -- Two-step modal requires many option definitions */
import {
  useCallback,
  useState,
  type JSX,
  type MouseEvent,
} from "react";
import type { AspectRatio, ImageSize, Mode } from "../types/index.ts";

interface ModeOption {
  colour:      string;
  description: string;
  icon:        string;
  label:       string;
  mode:        Mode;
}

interface AspectRatioOption {
  label: string;
  value: AspectRatio;
}

interface ImageSizeOption {
  description: string;
  label:       string;
  value:       ImageSize;
}

const avatarDescription = [
  "Generate a square 1:1 portrait.",
  "Perfect for profile pictures and avatars.",
].join(" ");

const artDescription = [
  "Generate landscape or portrait artwork.",
  "Choose your aspect ratio and resolution.",
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

const aspectRatioOptions: Array<AspectRatioOption> = [
  { label: "1:1 Square", value: "1:1" },
  { label: "4:3 Standard", value: "4:3" },
  { label: "3:4 Portrait", value: "3:4" },
  { label: "16:9 Widescreen", value: "16:9" },
  { label: "9:16 Wallpaper", value: "9:16" },
  { label: "21:9 Ultrawide", value: "21:9" },
];

const imageSizeOptions: Array<ImageSizeOption> = [
  { description: "Faster, cheaper", label: "1K", value: "1K" },
  { description: "Balanced", label: "2K", value: "2K" },
  { description: "Best quality", label: "4K", value: "4K" },
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

const validAspectRatios = new Set<string>([
  "1:1", "3:4", "4:3", "9:16", "16:9", "21:9",
]);

const isAspectRatio = (value: string): value is AspectRatio => {
  return validAspectRatios.has(value);
};

const validImageSizes = new Set<string>([ "1K", "2K", "4K" ]);

const isImageSize = (value: string): value is ImageSize => {
  return validImageSizes.has(value);
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

const pillBaseClass = [
  "px-4 py-2 rounded-xl border text-sm font-medium",
  "transition-all duration-200 cursor-pointer",
].join(" ");

const pillActiveClass = "border-purple-500 bg-purple-600/30 text-white";

const pillInactiveClass = [
  "border-purple-900/40 bg-transparent text-gray-400",
  "hover:border-purple-500/60 hover:text-gray-200",
].join(" ");

const startButtonClass = [
  "w-full bg-gradient-to-r from-purple-600 to-pink-600",
  "hover:from-purple-500 hover:to-pink-500",
  "text-white font-semibold py-3 rounded-xl",
  "transition-all duration-200 mt-2",
].join(" ");

const sizeButtonActiveClass = "border-purple-500 bg-purple-600/30 text-white";

const sizeButtonInactiveClass = [
  "border-purple-900/40 bg-transparent text-gray-400",
  "hover:border-purple-500/60 hover:text-gray-200",
].join(" ");

const backButtonClass = [
  "text-gray-400 hover:text-white",
  "transition-colors text-xl",
].join(" ");

const sectionLabelClass = [
  "text-sm text-gray-400",
  "uppercase tracking-wider mb-3",
].join(" ");

interface NewThreadModalProperties {
  readonly onClose:  ()=> void;
  readonly onSelect: (
    mode:        Mode,
    aspectRatio: AspectRatio | undefined,
    imageSize:   ImageSize,
  )=> void;
}

/**
 * Renders the new thread modal for selecting a generation mode and options.
 * @param props - The component props.
 * @param props.onClose - Callback to close the modal.
 * @param props.onSelect - Callback when a mode and options are confirmed.
 * @returns The JSX element.
 */
const threadModal = ({
  onClose,
  onSelect,
}: NewThreadModalProperties): JSX.Element => {
  const [ step, setStep ] = useState<"mode" | "options">("mode");
  const [ selectedMode, setSelectedMode ] = useState<Mode | undefined>(
    undefined,
  );
  const [ aspectRatio, setAspectRatio ] = useState<AspectRatio>("16:9");
  const [ imageSize, setImageSize ] = useState<ImageSize>("4K");

  const handleModeSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const rawMode = event.currentTarget.dataset.mode;
      if (rawMode !== undefined && isMode(rawMode)) {
        setSelectedMode(rawMode);
        setStep("options");
      }
    },
    [],
  );

  const handleBack = useCallback((): void => {
    setStep("mode");
  }, []);

  const handleStart = useCallback((): void => {
    if (selectedMode === undefined) {
      return;
    }
    const ratio = selectedMode === "art"
      ? aspectRatio
      : undefined;
    onSelect(selectedMode, ratio, imageSize);
  }, [ selectedMode, aspectRatio, imageSize, onSelect ]);

  const handleAspectRatioSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const rawRatio = event.currentTarget.dataset.ratio;
      if (rawRatio !== undefined && isAspectRatio(rawRatio)) {
        setAspectRatio(rawRatio);
      }
    },
    [],
  );

  const handleImageSizeSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const rawSize = event.currentTarget.dataset.size;
      if (rawSize !== undefined && isImageSize(rawSize)) {
        setImageSize(rawSize);
      }
    },
    [],
  );

  const selectedModeOption = modeOptionList.find((o) => {
    return o.mode === selectedMode;
  });
  const selectedColours = selectedModeOption === undefined
    ? colourMap.purple
    : colourMap[selectedModeOption.colour];

  if (step === "options" && selectedModeOption !== undefined) {
    return (
      <div className={overlayClass}>
        <div className={panelClass}>
          <div className="flex items-center gap-3 mb-6">
            <button
              className={backButtonClass}
              onClick={handleBack}
              type="button"
            >
              {"←"}
            </button>
            <h2 className="text-2xl font-bold text-white flex-1">
              {"Configure Thread"}
            </h2>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
              type="button"
            >
              {"×"}
            </button>
          </div>

          <div
            className={[
              "flex items-center gap-3 mb-6 p-4",
              "rounded-xl bg-[#241836] border border-purple-900/30",
            ].join(" ")}
          >
            <span className="text-3xl">{selectedModeOption.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">
                  {selectedModeOption.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${selectedColours?.badge ?? ""}`}
                >
                  {selectedModeOption.mode}
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">
                {selectedModeOption.description}
              </p>
            </div>
          </div>

          {selectedMode === "art"
            ? <div className="mb-6">
              <p className={sectionLabelClass}>
                {"Aspect Ratio"}
              </p>
              <div className="flex flex-wrap gap-2">
                {aspectRatioOptions.map((option) => {
                  const pillClass = [
                    pillBaseClass,
                    aspectRatio === option.value
                      ? pillActiveClass
                      : pillInactiveClass,
                  ].join(" ");
                  return (
                    <button
                      className={pillClass}
                      data-ratio={option.value}
                      key={option.value}
                      onClick={handleAspectRatioSelect}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            : null}

          <div className="mb-6">
            <p className={sectionLabelClass}>
              {"Resolution"}
            </p>
            <div className="flex gap-3">
              {imageSizeOptions.map((option) => {
                const sizeClass = [
                  "flex-1 flex flex-col items-center py-3 px-2",
                  "rounded-xl border text-sm font-medium",
                  "transition-all duration-200 cursor-pointer",
                  imageSize === option.value
                    ? sizeButtonActiveClass
                    : sizeButtonInactiveClass,
                ].join(" ");
                return (
                  <button
                    className={sizeClass}
                    data-size={option.value}
                    key={option.value}
                    onClick={handleImageSizeSelect}
                    type="button"
                  >
                    <span className="text-base font-bold">{option.label}</span>
                    <span className="text-xs mt-0.5 opacity-70">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className={startButtonClass}
            onClick={handleStart}
            type="button"
          >
            {"Start Thread →"}
          </button>
        </div>
      </div>
    );
  }

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
