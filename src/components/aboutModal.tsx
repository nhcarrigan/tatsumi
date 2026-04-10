/**
 * @file About modal explaining what Tatsumi is and how to use it.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Modal JSX inherently requires many lines */
import { invoke } from "@tauri-apps/api/core";
import { type JSX, type MouseEvent, useCallback } from "react";

const overlayClass = [
  "fixed inset-0 bg-black/70 backdrop-blur-sm",
  "flex items-center justify-center z-50",
].join(" ");

const modalClass = [
  "bg-[#1a1028] border border-purple-900/40 rounded-2xl",
  "p-8 max-w-lg w-full mx-4 shadow-2xl",
].join(" ");

const linkClass = [
  "text-purple-400 hover:text-purple-300 underline",
  "transition-colors cursor-pointer",
].join(" ");

interface AboutModalProperties {
  readonly onClose: ()=> void;
}

/**
 * Renders the About modal explaining Tatsumi and how to use it.
 * @param props - The component props.
 * @param props.onClose - Callback to close the modal.
 * @returns The JSX element.
 */
const aboutModal = ({ onClose }: AboutModalProperties): JSX.Element => {
  const handleOpenDiscord = useCallback((): void => {
    void invoke("open_url", { url: "https://chat.nhcarrigan.com" });
  }, []);

  const handleContentClick = useCallback(
    (clickEvent: MouseEvent): void => {
      clickEvent.stopPropagation();
    },
    [],
  );

  return (
    <div
      className={overlayClass}
      onClick={onClose}
    >
      <div
        className={modalClass}
        onClick={handleContentClick}
      >
        <div className="flex items-center gap-3 mb-6">
          <img
            alt="Tatsumi"
            className="w-10 h-10 rounded-full object-cover"
            src="/tatsumi.png"
          />
          <h2 className="text-xl font-bold text-white">
            {"About Tatsumi"}
          </h2>
        </div>

        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            {
              "Tatsumi is an AI art generation app powered by Google Gemini's "
              + "image model. It's built specifically to generate character "
              + "art of Naomi."
            }
          </p>

          <div>
            <h3 className="text-white font-semibold mb-2">
              {"Three modes"}
            </h3>
            <ul className="space-y-1.5 list-none">
              <li>
                <span className="text-purple-300 font-medium">
                  {"Avatar"}
                </span>
                {
                  " — Generate a square portrait of Naomi from a text prompt."
                }
              </li>
              <li>
                <span className="text-pink-300 font-medium">
                  {"Art"}
                </span>
                {
                  " — Generate a full widescreen art piece of Naomi "
                  + "from a text prompt."
                }
              </li>
              <li>
                <span className="text-blue-300 font-medium">
                  {"Replace"}
                </span>
                {
                  " — Upload an anime girl art and get the character "
                  + "replaced with Naomi."
                }
              </li>
            </ul>
          </div>

          <div
            className={
              "bg-purple-900/20 border border-purple-900/40 rounded-xl p-4"
            }
          >
            <p className="text-purple-200 font-medium mb-1">
              {"✨ Naomi's reference sheet is pre-loaded"}
            </p>
            <p className="text-gray-400 text-xs">
              {
                "All three modes automatically include Naomi's character "
                + "reference sheet and a full character description on the "
                + "first message, so the model knows exactly how she looks. "
                + "You just describe the scene, pose, or what to change!"
              }
            </p>
          </div>

          <p>
            {
              "This app is designed specifically to generate art of Naomi. "
              + "If you use it to make something you're proud of, come share "
              + "it with us — we'd love to see what you create!"
            }
          </p>

          <p>
            {"Join the community on "}
            <button
              className={linkClass}
              onClick={handleOpenDiscord}
              type="button"
            >
              {"our Discord server"}
            </button>
            {" and share your art in the community channels."}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className={
              "bg-purple-700 hover:bg-purple-600 text-white font-semibold "
              + "py-2 px-6 rounded-xl transition-colors"
            }
            onClick={onClose}
            type="button"
          >
            {"Got it!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { aboutModal as AboutModal };
