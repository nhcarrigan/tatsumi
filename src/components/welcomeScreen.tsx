/**
 * @file Welcome screen displayed when no thread is selected.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component JSX inherently requires many lines */
import type { JSX } from "react";

const buttonClass = [
  "bg-gradient-to-r from-purple-600 to-pink-600",
  "hover:from-purple-500 hover:to-pink-500",
  "text-white font-semibold py-3 px-8 rounded-xl",
  "transition-all duration-200 text-lg",
  "shadow-lg shadow-purple-900/30",
].join(" ");

const cardClass = "bg-[#241836] rounded-xl p-6 border border-purple-900/30";
const containerClass = [
  "flex flex-col items-center justify-center",
  "h-full gap-8 text-center px-8",
].join(" ");

const headingClass = [
  "text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400",
  "bg-clip-text text-transparent",
].join(" ");

interface WelcomeScreenProperties {
  readonly onNewThread: ()=> void;
}

/**
 * Renders the welcome screen with mode descriptions and a new thread button.
 * @param props - The component props.
 * @param props.onNewThread - Callback to open the new thread modal.
 * @returns The JSX element.
 */
const welcomeScreen = ({
  onNewThread,
}: WelcomeScreenProperties): JSX.Element => {
  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-7xl">{"✨"}</div>
        <h1 className={headingClass}>{"Tatsumi"}</h1>
        <p className="text-gray-300 text-lg max-w-lg leading-relaxed">
          {
            "Hi! I'm Tatsumi — NHCarrigan's Chief Design Officer. "
            + "My siren magic goes into everything I make, and I've poured "
            + "it into this too. Tell me how you want Naomi to look, "
            + "and I'll bring her to life~"
          }
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-2xl w-full">
        <div className={cardClass}>
          <div className="text-3xl mb-3">{"👤"}</div>
          <h3 className="text-purple-400 font-semibold mb-2">
            {"Avatar Mode"}
          </h3>
          <p className="text-gray-400 text-sm">
            {"Generate a square portrait of Naomi"}
          </p>
        </div>
        <div className={cardClass}>
          <div className="text-3xl mb-3">{"🎨"}</div>
          <h3 className="text-pink-400 font-semibold mb-2">{"Art Mode"}</h3>
          <p className="text-gray-400 text-sm">
            {"Generate a widescreen art piece of Naomi"}
          </p>
        </div>
        <div className={cardClass}>
          <div className="text-3xl mb-3">{"🔄"}</div>
          <h3 className="text-blue-400 font-semibold mb-2">
            {"Replace Mode"}
          </h3>
          <p className="text-gray-400 text-sm">
            {"Upload anime girl art and replace her with Naomi"}
          </p>
        </div>
      </div>

      <button
        className={buttonClass}
        onClick={onNewThread}
        type="button"
      >
        {"+ New Thread"}
      </button>
    </div>
  );
};

export { welcomeScreen as WelcomeScreen };
