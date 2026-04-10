/**
 * @file Sidebar component showing thread list and navigation.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component JSX inherently requires many lines */
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import {
  useState,
  useCallback,
  useEffect,
  type JSX,
  type MouseEvent,
} from "react";
import type { Mode, Thread } from "../types/index.ts";

const deleteButtonClass = [
  "shrink-0 text-gray-600 hover:text-red-400",
  "transition-colors text-sm",
].join(" ");

const addThreadButtonClass = [
  "w-full bg-gradient-to-r from-purple-600 to-pink-600",
  "hover:from-purple-500 hover:to-pink-500",
  "text-white font-semibold py-2.5 rounded-xl",
  "transition-all duration-200 text-sm",
  "shadow-lg shadow-purple-900/20",
].join(" ");

const settingsButtonClass = [
  "w-full text-left text-gray-500 hover:text-gray-300",
  "transition-colors text-sm py-1.5 px-2 rounded-lg hover:bg-purple-900/15",
].join(" ");

const iconButtonClass = [
  "flex-1 text-gray-500 hover:text-gray-300",
  "transition-colors text-sm py-1.5 px-2 rounded-lg",
  "hover:bg-purple-900/15 text-center",
].join(" ");

const sidebarClass = [
  "w-[280px] min-w-[280px] bg-[#1a1028]",
  "border-r border-purple-900/30 flex flex-col h-full",
].join(" ");

const modeBadge = (mode: Mode): string => {
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

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], {
      hour:   "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${String(diffDays)}d ago`;
  }
  return date.toLocaleDateString([], {
    day:   "numeric",
    month: "short",
  });
};

interface SidebarProperties {
  readonly onAbout:          ()=> void;
  readonly onDeleteThread:   (threadId: string)=> void;
  readonly onNewThread:      ()=> void;
  readonly onSelectThread:   (thread: Thread)=> void;
  readonly onSettings:       ()=> void;
  readonly selectedThreadId: string | undefined;
  readonly threads:          Array<Thread>;
}

/**
 * Renders the sidebar with thread list and navigation controls.
 * @param props - The component props.
 * @param props.onAbout - Callback to open the about modal.
 * @param props.onDeleteThread - Callback to delete a thread.
 * @param props.onNewThread - Callback to open new thread modal.
 * @param props.onSelectThread - Callback to select a thread.
 * @param props.onSettings - Callback to open the settings modal.
 * @param props.selectedThreadId - Currently selected thread ID.
 * @param props.threads - List of threads to display.
 * @returns The JSX element.
 */
const sidebar = ({
  onAbout,
  onDeleteThread,
  onNewThread,
  onSelectThread,
  onSettings,
  selectedThreadId,
  threads,
}: SidebarProperties): JSX.Element => {
  const [ hoveredId, setHoveredId ] = useState<string | undefined>(undefined);
  const [ appVersion, setAppVersion ] = useState<string>("");

  useEffect((): void => {
    void getVersion().then((version) => {
      setAppVersion(version);
    });
  }, []);

  const handleOpenDonate = useCallback((): void => {
    void invoke("open_url", { url: "https://donate.nhcarrigan.com" });
  }, []);

  const handleOpenChat = useCallback((): void => {
    void invoke("open_url", { url: "https://chat.nhcarrigan.com" });
  }, []);

  const sortedThreads = [ ...threads ].sort((threadA, threadB) => {
    return threadB.updatedAt - threadA.updatedAt;
  });

  const handleThreadClick = useCallback(
    (event: MouseEvent<HTMLDivElement>): void => {
      const { threadId } = event.currentTarget.dataset;
      if (threadId === undefined) {
        return;
      }
      const thread = threads.find((t) => {
        return t.id === threadId;
      });
      if (thread !== undefined) {
        onSelectThread(thread);
      }
    },
    [ threads, onSelectThread ],
  );

  const handleMouseEnter = useCallback(
    (event: MouseEvent<HTMLDivElement>): void => {
      const { threadId } = event.currentTarget.dataset;
      if (threadId !== undefined) {
        setHoveredId(threadId);
      }
    },
    [],
  );

  const handleMouseLeave = useCallback((): void => {
    setHoveredId(undefined);
  }, []);

  const executeDelete = useCallback(
    async(threadId: string): Promise<void> => {
      await invoke("delete_thread", { threadId });
      onDeleteThread(threadId);
    },
    [ onDeleteThread ],
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      const { threadId } = event.currentTarget.dataset;
      if (threadId !== undefined) {
        void executeDelete(threadId);
      }
    },
    [ executeDelete ],
  );

  return (
    <div className={sidebarClass}>
      <div className="px-4 py-5 border-b border-purple-900/30">
        <div className="flex items-center gap-3 mb-1">
          <img
            alt="Tatsumi"
            className="w-10 h-10 rounded-full object-cover"
            src="/tatsumi.png"
          />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              {"Tatsumi"}
            </h1>
            <p className="text-gray-600 text-xs">
              {appVersion.length > 0
                ? `v${appVersion}`
                : ""}
            </p>
          </div>
        </div>
        <button
          className={addThreadButtonClass}
          onClick={onNewThread}
          type="button"
        >
          {"+ New Thread"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sortedThreads.length === 0
          ? <div className="px-4 py-8 text-center text-gray-600 text-sm">
            {"No threads yet. Create one to get started!"}
          </div>

          : null}

        {sortedThreads.map((thread) => {
          const isSelected = selectedThreadId === thread.id;
          const isHovered = hoveredId === thread.id;
          const threadItemClass = [
            "flex items-start gap-3 px-4 py-3",
            "cursor-pointer transition-all duration-150 relative group",
            isSelected
              ? "bg-purple-900/30 border-r-2 border-purple-500"
              : "hover:bg-purple-900/15",
          ].join(" ");
          const badgeClass = [
            "text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0",
            modeBadge(thread.mode),
          ].join(" ");

          return (
            <div
              className={threadItemClass}
              data-thread-id={thread.id}
              key={thread.id}
              onClick={handleThreadClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={badgeClass}>
                    {modeLabel(thread.mode)}
                  </span>
                </div>
                <p className="text-sm text-gray-200 truncate leading-tight">
                  {thread.name}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {formatDate(thread.updatedAt)}
                </p>
              </div>

              {isHovered || isSelected
                ? <button
                  className={deleteButtonClass}
                  data-thread-id={thread.id}
                  onClick={handleDeleteClick}
                  title="Delete thread"
                  type="button"
                >
                  {"🗑"}
                </button>

                : null}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-purple-900/30 space-y-1">
        <div className="flex gap-1">
          <button
            className={iconButtonClass}
            onClick={handleOpenDonate}
            title="Donate"
            type="button"
          >
            {"💜 Donate"}
          </button>
          <button
            className={iconButtonClass}
            onClick={handleOpenChat}
            title="Chat"
            type="button"
          >
            {"💬 Chat"}
          </button>
          <button
            className={iconButtonClass}
            onClick={onAbout}
            title="About"
            type="button"
          >
            {"ℹ️ About"}
          </button>
        </div>
        <button
          className={settingsButtonClass}
          onClick={onSettings}
          type="button"
        >
          {"⚙️ Settings"}
        </button>
      </div>
    </div>
  );
};

export { sidebar as Sidebar };
