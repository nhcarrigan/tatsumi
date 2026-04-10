/**
 * @file Settings modal component for configuring the application API key.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component JSX inherently requires many lines */
import { type ChangeEvent, useCallback, useState, type JSX } from "react";

const overlayClass = [
  "fixed inset-0 bg-black/70 backdrop-blur-sm",
  "flex items-center justify-center z-50",
].join(" ");

const panelClass = [
  "bg-[#1a1028] border border-purple-900/40",
  "rounded-2xl p-8 max-w-lg w-full mx-4",
  "shadow-2xl shadow-purple-900/30",
].join(" ");

const saveButtonClass = [
  "bg-gradient-to-r from-purple-600 to-pink-600",
  "hover:from-purple-500 hover:to-pink-500",
  "text-white font-semibold py-2 px-6 rounded-xl",
  "transition-all duration-200 text-sm",
].join(" ");

const cancelButtonClass = [
  "bg-transparent border border-purple-900/40",
  "hover:border-purple-500/60 text-gray-400 hover:text-white",
  "font-semibold py-2 px-6 rounded-xl",
  "transition-all duration-200 text-sm",
].join(" ");

const inputClass = [
  "flex-1 bg-[#0f0a1a] border border-purple-900/40",
  "rounded-xl px-4 py-2.5 text-white text-sm",
  "focus:outline-none focus:border-purple-500/60",
  "placeholder-gray-600 font-mono",
].join(" ");

interface SettingsModalProperties {
  readonly currentApiKey: string;
  readonly onClose:       ()=> void;
  readonly onSave:        (apiKey: string)=> void;
}

/**
 * Renders the settings modal for configuring the Gemini API key.
 * @param props - The component props.
 * @param props.currentApiKey - The currently configured API key.
 * @param props.onClose - Callback to close the modal.
 * @param props.onSave - Callback when the API key is saved.
 * @returns The JSX element.
 */
const settingsModal = ({
  currentApiKey,
  onClose,
  onSave,
}: SettingsModalProperties): JSX.Element => {
  const [ apiKey, setApiKey ] = useState(currentApiKey);
  const [ showKey, setShowKey ] = useState(false);

  const handleApiKeyChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setApiKey(event.target.value);
    },
    [],
  );

  const handleToggleShow = useCallback((): void => {
    setShowKey((previous) => {
      return !previous;
    });
  }, []);

  const handleSave = useCallback((): void => {
    onSave(apiKey);
  }, [ apiKey, onSave ]);

  return (
    <div className={overlayClass}>
      <div className={panelClass}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{"Settings"}</h2>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            type="button"
          >
            {"×"}
          </button>
        </div>

        <div className="mb-6">
          <label
            className="block text-sm font-medium text-gray-300 mb-2"
            htmlFor="api-key-input"
          >
            {"Gemini API Key"}
          </label>

          <div className="flex gap-2">
            <input
              className={inputClass}
              id="api-key-input"
              onChange={handleApiKeyChange}
              placeholder="Enter your Gemini API key..."
              type={showKey
                ? "text"
                : "password"}
              value={apiKey}
            />

            <button
              className="text-gray-400 hover:text-white transition-colors px-3"
              onClick={handleToggleShow}
              title={showKey
                ? "Hide API key"
                : "Show API key"}
              type="button"
            >
              {"👁"}
            </button>
          </div>

          <p className="text-xs text-gray-600 mt-2">
            {"Your API key is stored locally on this device."}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className={cancelButtonClass}
            onClick={onClose}
            type="button"
          >
            {"Cancel"}
          </button>

          <button
            className={saveButtonClass}
            onClick={handleSave}
            type="button"
          >
            {"Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { settingsModal as SettingsModal };
