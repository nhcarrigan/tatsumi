/**
 * @file Root application component managing threads and navigation.
 * @copyright Naomi Carrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Component requires state and handlers */
/* eslint-disable max-statements -- Component requires many state variables and handlers */
/* eslint-disable max-lines -- Root component requires many handlers and modals */

import { invoke } from "@tauri-apps/api/core";
import { type JSX, useCallback, useEffect, useState } from "react";
import { AboutModal } from "./components/aboutModal.tsx";
import { NewThreadModal } from "./components/newThreadModal.tsx";
import { SettingsModal } from "./components/settingsModal.tsx";
import { Sidebar } from "./components/sidebar.tsx";
import { ThreadView } from "./components/threadView.tsx";
import { WelcomeScreen } from "./components/welcomeScreen.tsx";
import type {
  AspectRatio,
  Config,
  ImageSize,
  Mode,
  PendingInput,
  Thread,
} from "./types/index.ts";

const adjectives = [
  "Amber",
  "Ancient",
  "Arctic",
  "Azure",
  "Blazing",
  "Celestial",
  "Cobalt",
  "Crimson",
  "Crystal",
  "Dark",
  "Distant",
  "Ember",
  "Emerald",
  "Eternal",
  "Ethereal",
  "Fleeting",
  "Frosted",
  "Gilded",
  "Golden",
  "Hidden",
  "Hollow",
  "Indigo",
  "Ivory",
  "Jade",
  "Lunar",
  "Midnight",
  "Mystic",
  "Neon",
  "Obsidian",
  "Onyx",
  "Opal",
  "Pale",
  "Pearl",
  "Radiant",
  "Rusted",
  "Sapphire",
  "Scarlet",
  "Shattered",
  "Silent",
  "Silver",
  "Spectral",
  "Twilight",
  "Velvet",
  "Verdant",
  "Veiled",
  "Violet",
  "Wandering",
  "Wild",
  "Woven",
  "Arcane",
];

const nouns = [
  "Abyss",
  "Archive",
  "Aria",
  "Bloom",
  "Cascade",
  "Chronicle",
  "Cipher",
  "Compass",
  "Crown",
  "Dawn",
  "Dream",
  "Echo",
  "Elegy",
  "Ember",
  "Equinox",
  "Flame",
  "Fragment",
  "Garden",
  "Horizon",
  "Labyrinth",
  "Lantern",
  "Mirage",
  "Mist",
  "Murmur",
  "Nexus",
  "Nocturne",
  "Oracle",
  "Phantom",
  "Prism",
  "Requiem",
  "Reverie",
  "Ruin",
  "Shadow",
  "Shard",
  "Silence",
  "Solstice",
  "Sonata",
  "Specter",
  "Storm",
  "Tempest",
  "Throne",
  "Tide",
  "Veil",
  "Vortex",
  "Whisper",
  "Zenith",
  "Sigil",
  "Glyph",
  "Dusk",
  "Omen",
];

const generateThreadName = (): string => {
  const adjectiveIndex = Math.floor(Math.random() * adjectives.length);
  const nounIndex = Math.floor(Math.random() * nouns.length);
  const adjective = adjectives[adjectiveIndex] ?? "Arcane";
  const noun = nouns[nounIndex] ?? "Reverie";
  return `${adjective} ${noun}`;
};

const generateId = (): string => {
  const random = Math.random().
    toString(36).
    slice(2, 9);
  return `${String(Date.now())}-${random}`;
};

const filterThreadsById = (
  previous: Array<Thread>,
  threadId: string,
): Array<Thread> => {
  return previous.filter((thread) => {
    return thread.id !== threadId;
  });
};

const replaceThreadById = (
  previous: Array<Thread>,
  finalThread: Thread,
): Array<Thread> => {
  return previous.map((thread) => {
    return thread.id === finalThread.id
      ? finalThread
      : thread;
  });
};

const resolveUpdatedThread = (updatedThread: Thread): Thread => {
  const [ firstMessage ] = updatedThread.messages;

  if (
    updatedThread.messages.length !== 1
    || firstMessage === undefined
    || firstMessage.role !== "user"
  ) {
    return updatedThread;
  }

  const name = generateThreadName();
  return { ...updatedThread, name };
};

/**
 * Renders the root application component with thread management.
 * @returns The JSX element.
 */
const app = (): JSX.Element => {
  const [ threads, setThreads ] = useState<Array<Thread>>([]);
  const [ selectedThreadId, setSelectedThreadId ] = useState<
    string | undefined
  >(undefined);
  const [ showNewThreadModal, setShowNewThreadModal ] = useState(false);
  const [ config, setConfig ] = useState<Config>({ apiKey: "" });
  const [ showSettings, setShowSettings ] = useState(false);
  const [ showAbout, setShowAbout ] = useState(false);
  const [ pendingInputs, setPendingInputs ] = useState<
    Record<string, PendingInput>
  >({});
  const [ loadingStartTimes, setLoadingStartTimes ] = useState<
    Record<string, number>
  >({});
  const [ errorMessages, setErrorMessages ] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const loadThreads = async(): Promise<void> => {
      try {
        const loaded = await invoke<Array<Thread>>("load_threads");
        setThreads(loaded);
        const loadedConfig = await invoke<Config>("load_config");
        setConfig(loadedConfig);
      } catch (error) {
        /* eslint-disable-next-line no-console -- No logger available */
        console.error("Failed to load threads:", error);
      }
    };
    void loadThreads();
  }, []);

  const selectedThread = threads.find((thread) => {
    return thread.id === selectedThreadId;
  });

  const handleNewThread = useCallback(
    (
      mode:        Mode,
      aspectRatio: AspectRatio | undefined,
      imageSize:   ImageSize,
    ): void => {
      const now = Date.now();
      const createdThread: Thread = {
        /* eslint-disable-next-line stylistic/no-extra-parens -- Required for conditional spread with exactOptionalPropertyTypes */
        ...(aspectRatio !== undefined && { aspectRatio }),
        createdAt: now,
        id:        generateId(),
        imageSize: imageSize,
        messages:  [],
        mode:      mode,
        name:      `New ${mode} thread`,
        updatedAt: now,
      };
      setThreads((previous) => {
        return [ createdThread, ...previous ];
      });
      setSelectedThreadId(createdThread.id);
      setShowNewThreadModal(false);
    },
    [],
  );

  const handleThreadUpdate = useCallback(
    (updatedThread: Thread): void => {
      const finalThread = resolveUpdatedThread(updatedThread);
      setThreads((previous) => {
        return replaceThreadById(previous, finalThread);
      });
    },
    [],
  );

  const handlePendingInputChange = useCallback(
    (threadId: string, input: PendingInput | undefined): void => {
      setPendingInputs((previous) => {
        if (input === undefined) {
          const next = { ...previous };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Required to remove a specific key from a Record
          delete next[threadId];
          return next;
        }
        return { ...previous, [threadId]: input };
      });
    },
    [],
  );

  const handleLoadingChange = useCallback(
    (threadId: string, loading: boolean): void => {
      setLoadingStartTimes((previous) => {
        if (!loading) {
          const next = { ...previous };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Required to remove a specific key from a Record
          delete next[threadId];
          return next;
        }
        return { ...previous, [threadId]: Date.now() };
      });
    },
    [],
  );

  const handleErrorChange = useCallback(
    (threadId: string, error: string | undefined): void => {
      setErrorMessages((previous) => {
        if (error === undefined) {
          const next = { ...previous };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Required to remove a specific key from a Record
          delete next[threadId];
          return next;
        }
        return { ...previous, [threadId]: error };
      });
    },
    [],
  );

  const handleDeleteThread = useCallback(
    (threadId: string): void => {
      setThreads((previous) => {
        return filterThreadsById(previous, threadId);
      });
      if (selectedThreadId === threadId) {
        setSelectedThreadId(undefined);
      }
      setLoadingStartTimes((previous) => {
        const next = { ...previous };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Required to remove a specific key from a Record
        delete next[threadId];
        return next;
      });
      setErrorMessages((previous) => {
        const next = { ...previous };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Required to remove a specific key from a Record
        delete next[threadId];
        return next;
      });
    },
    [ selectedThreadId ],
  );

  const handleSelectThread = useCallback(
    (thread: Thread): void => {
      setSelectedThreadId(thread.id);
    },
    [],
  );

  const handleOpenNewThreadModal = useCallback((): void => {
    setShowNewThreadModal(true);
  }, []);

  const handleCloseNewThreadModal = useCallback((): void => {
    setShowNewThreadModal(false);
  }, []);

  const handleOpenSettings = useCallback((): void => {
    setShowSettings(true);
  }, []);

  const handleOpenAbout = useCallback((): void => {
    setShowAbout(true);
  }, []);

  const handleCloseAbout = useCallback((): void => {
    setShowAbout(false);
  }, []);

  const handleCloseSettings = useCallback((): void => {
    if (config.apiKey.length > 0) {
      setShowSettings(false);
    }
  }, [ config.apiKey ]);

  const handleSaveConfig = useCallback(
    async(apiKey: string): Promise<void> => {
      const updatedConfig: Config = { apiKey };
      await invoke("save_config", { config: updatedConfig });
      setConfig(updatedConfig);
      setShowSettings(false);
    },
    [],
  );

  const handleSaveConfigVoid = useCallback(
    (apiKey: string): void => {
      void handleSaveConfig(apiKey);
    },
    [ handleSaveConfig ],
  );

  const selectedThreadId2 = selectedThread?.id;
  const handleSelectedThreadPendingInputChange = useCallback(
    (input: PendingInput | undefined): void => {
      if (selectedThreadId2 !== undefined) {
        handlePendingInputChange(selectedThreadId2, input);
      }
    },
    [ selectedThreadId2, handlePendingInputChange ],
  );

  const handleSelectedThreadLoadingChange = useCallback(
    (loading: boolean): void => {
      if (selectedThreadId2 !== undefined) {
        handleLoadingChange(selectedThreadId2, loading);
      }
    },
    [ selectedThreadId2, handleLoadingChange ],
  );

  const handleSelectedThreadErrorChange = useCallback(
    (error: string | undefined): void => {
      if (selectedThreadId2 !== undefined) {
        handleErrorChange(selectedThreadId2, error);
      }
    },
    [ selectedThreadId2, handleErrorChange ],
  );

  const shouldShowSettings = showSettings || config.apiKey.length === 0;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#0f0a1a] text-white"
    >
      <Sidebar
        onAbout={handleOpenAbout}
        onDeleteThread={handleDeleteThread}
        onNewThread={handleOpenNewThreadModal}
        onSelectThread={handleSelectThread}
        onSettings={handleOpenSettings}
        selectedThreadId={selectedThreadId}
        threads={threads}
      />

      <main className="flex-1 overflow-hidden">
        {selectedThread === undefined
          ? <WelcomeScreen onNewThread={handleOpenNewThreadModal} />
          : <ThreadView
            apiKey={config.apiKey}
            isLoading={loadingStartTimes[selectedThread.id] !== undefined}
            key={selectedThread.id}
            onErrorChange={handleSelectedThreadErrorChange}
            onLoadingChange={handleSelectedThreadLoadingChange}
            onPendingInputChange={handleSelectedThreadPendingInputChange}
            onUpdate={handleThreadUpdate}
            {...(errorMessages[selectedThread.id] !== undefined && {
              errorMessage: errorMessages[selectedThread.id],
            })}
            {...(loadingStartTimes[selectedThread.id] !== undefined && {
              loadingStartTime: loadingStartTimes[selectedThread.id],
            })}
            {...(pendingInputs[selectedThread.id] !== undefined && {
              pendingInput: pendingInputs[selectedThread.id],
            })}
            thread={selectedThread}
          />
        }
      </main>

      {showNewThreadModal
        ? <NewThreadModal
          onClose={handleCloseNewThreadModal}
          onSelect={handleNewThread}
        />

        : null}

      {shouldShowSettings
        ? <SettingsModal
          currentApiKey={config.apiKey}
          onClose={handleCloseSettings}
          onSave={handleSaveConfigVoid}
        />

        : null}

      {showAbout
        ? <AboutModal onClose={handleCloseAbout} />

        : null}
    </div>
  );
};

export { app as App };
