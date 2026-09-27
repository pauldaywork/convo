# Pi coding harness with spoken replies

This project uses [Pi](https://pi.dev/) for coding, a project skill to shape replies for listening, and [privateer-speak](https://pi.dev/packages/privateer-speak?name=glance) to send reply text to a local [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) text-to-speech server. Kokoro runs in Docker on an NVIDIA GPU.

The coding model and the voice are separate: Pi can use a ChatGPT Codex sign-in for coding, while Kokoro generates speech locally. The voice setup does not use the OpenAI audio API.

## What is already configured here

- `.pi/extensions/spoken-toggle.ts` adds `/spoken on`, `/spoken off`, and `/spoken status` to control formatting for the current Pi session.
- `.pi/skills/spoken-coding/SKILL.md` asks for short, natural spoken explanations and keeps copyable commands or code in fenced blocks. The extension applies it to every reply while spoken formatting is on.
- `privateer-speak` is installed as a user-level Pi package.
- `~/.pi/speak.json` selects the `openai-compatible` speech provider at `http://127.0.0.1:8880/v1`. It uses the Kokoro model and `af_bella` voice, streams sentences, and sets `maxChars` to `0` so the whole prose answer can be spoken.
- A Kokoro GPU container is running on port `8880`. The current host is Ubuntu 26.04 with an NVIDIA RTX PRO 4000 Blackwell GPU. Docker GPU passthrough and a Kokoro speech request have both been verified.

Pi loads this project's extension and skill when it runs from this directory. Spoken formatting starts off in each new Pi session; the toggle is saved in that session and restored when you resume it. The Pi package and `~/.pi/speak.json` are user-level settings and apply across projects. To use the same formatting toggle in another project, copy the `.pi/extensions/spoken-toggle.ts` file and `.pi/skills/spoken-coding` directory there.

## Install on a fresh Ubuntu or Debian machine

Skip components that are already installed. The host needs an NVIDIA driver, Docker Engine, and the NVIDIA Container Toolkit. Follow the official [Docker installation guide](https://docs.docker.com/engine/install/ubuntu/) and [NVIDIA Container Toolkit guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html). Confirm the host driver works with `nvidia-smi` and that Docker accepts `--gpus all`. You do not need a separate host CUDA Toolkit or host Python installation for Kokoro: the GPU image contains its runtime and Python dependencies.

Pi needs Node.js 22.19 or newer. Install Pi with its [quickstart](https://pi.dev/docs/latest/quickstart):

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi --version
```

For Python projects you develop with Pi, install [uv](https://docs.astral.sh/uv/getting-started/installation/) and let it manage Python and each project's environment. Python is optional for the Pi and Kokoro speech integration itself.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv python install 3.12
```

Use the Python version required by your project; 3.12 is an example with broad package support. For a new Python project:

```bash
uv init --python 3.12 /path/to/your-project
cd /path/to/your-project
uv add <package-name>
uv run python
```

## Start Kokoro on the NVIDIA GPU

Check `docker ps` first. If Kokoro is already running on port `8880`, skip the `docker run` command.

For an RTX 50-series or other Blackwell GPU, use Kokoro's CUDA 12.8 image:

```bash
docker run -d --name kokoro-tts --restart unless-stopped \
  --gpus all -p 127.0.0.1:8880:8880 \
  ghcr.io/remsky/kokoro-fastapi-gpu:latest-cu128
```

For older supported NVIDIA GPUs, Kokoro documents `ghcr.io/remsky/kokoro-fastapi-gpu:latest` instead. Check the [Kokoro image instructions](https://github.com/remsky/Kokoro-FastAPI) for your GPU. The `127.0.0.1` port binding makes the speech API available only on this computer.

Confirm Kokoro is ready:

```bash
curl --fail --silent --show-error http://127.0.0.1:8880/health
```

The expected response includes `"status":"healthy"`.

## Connect Pi to ChatGPT and the local voice

From the coding project directory, start Pi:

```bash
pi
```

In Pi, run `/login openai-codex` and sign in with the ChatGPT account you want to use. Then use `/model` to choose a coding model. GPT-6 Sol at medium reasoning is a practical everyday choice when available. Pi's login is separate from the ChatGPT or Codex desktop app login. An OpenAI API key is a different, separately billed option. See [Pi authentication](https://pi.dev/docs/latest/providers) and [OpenAI authentication](https://learn.chatgpt.com/docs/auth).

Install the speech extension in a normal terminal:

```bash
pi install npm:privateer-speak
```

Create `~/.pi/speak.json` with this configuration. If that file already exists, edit it instead of replacing other preferences you want to keep.

```json
{
  "enabled": true,
  "provider": "openai-compatible",
  "maxChars": 0,
  "stream": true,
  "announce": false,
  "providers": {
    "openai-compatible": {
      "baseUrl": "http://127.0.0.1:8880/v1",
      "apiKey": "not-needed",
      "model": "kokoro",
      "voice": "af_bella",
      "rate": 1.0
    }
  }
}
```

The extension requires a nonempty `apiKey` field for its OpenAI-compatible provider. `not-needed` is a placeholder sent only to your local Kokoro server; it is not a ChatGPT credential. Kokoro's speech endpoint is `http://127.0.0.1:8880/v1/audio/speech`.

After changing the extension, skill, or Pi configuration during an open session, run `/reload` in Pi. To enable spoken formatting and test speech, run:

```text
/spoken on
/speak provider
/speak on
/speak test
```

`/spoken on` applies the skill to subsequent replies in this session. `/spoken off` restores normal response formatting, and `/spoken status` shows the current setting. These commands do not change audio playback. `/speak provider` should mark `openai-compatible` as active, and `/speak test` should play a sample. Then send a normal coding prompt and listen for the reply. The skill affects how Pi writes the answer; `privateer-speak` performs the actual text-to-speech playback. The speech extension skips code blocks, tables, and URLs in spoken output, so Pi's prose explanation should come before copyable code.

## Check where speech requests go

Run `docker ps` to find the Kokoro container name. In another terminal, follow its logs, replacing `kokoro-tts` if the running container has a different name:

```bash
docker logs --since 1m -f kokoro-tts
```

Run `/speak test` in Pi. A new `POST /v1/audio/speech` line with `200 OK` confirms Pi reached the local container. If there is no new request, recheck `~/.pi/speak.json`, `/speak provider`, and whether Pi was reloaded. If the request succeeds but you hear nothing, check the computer's audio output and that an audio player such as `pw-play` is available.

The formatting toggle lives in the [`spoken-toggle` extension](.pi/extensions/spoken-toggle.ts) and uses the [`spoken-coding` skill](.pi/skills/spoken-coding/SKILL.md). Pi's [extensions](https://pi.dev/docs/latest/extensions) and [skills](https://pi.dev/docs/latest/skills) guides explain how they load.
