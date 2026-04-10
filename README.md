# Tatsumi

Tatsumi is a desktop app for generating AI character art powered by Google Gemini's image model. It's built specifically to generate art of Naomi, with her reference sheet pre-loaded so you just describe the scene.

## Features

### Three generation modes

- **Avatar** — Generate a portrait or avatar from a text prompt (1:1 aspect ratio)
- **Art** — Generate a full widescreen piece from a text prompt (16:9 aspect ratio)
- **Replace** — Upload a source image and describe what you want changed or reimagined

### Conversation threads

Each generation session is a thread. You can send follow-up messages to refine the result, retry any response, edit a previous prompt and re-run, or delete messages. Threads are saved locally and persist between sessions.

### Other bits

- Model reasoning is shown as a collapsible "Model reasoning" section on each response
- Cost per response is displayed (input + output tokens)
- Generated images can be downloaded directly from the chat
- App version shown in the sidebar header

## Setup

You'll need a [Google Gemini API key](https://aistudio.google.com/apikey) to use Tatsumi. On first launch, you'll be prompted to enter it. You can update it any time via Settings.

## Running locally

```bash
pnpm install
pnpm tauri dev
```

## Building

```bash
pnpm tauri build
# or for Windows cross-compilation:
pnpm build:windows
```

## Feedback and Bugs

If you have feedback or a bug report, please [log a ticket on our forum](https://support.nhcarrigan.com).

## Contributing

If you would like to contribute to the project, you may create a Pull Request containing your proposed changes and we will review it as soon as we are able! Please review our [contributing guidelines](CONTRIBUTING.md) first.

## Code of Conduct

Before interacting with our community, please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

This software is licensed under our [global software license](https://docs.nhcarrigan.com/#/license).

Copyright held by Naomi Carrigan.

## Contact

We may be contacted through our [Chat Server](https://chat.nhcarrigan.com) or via email at `contact@nhcarrigan.com`.
