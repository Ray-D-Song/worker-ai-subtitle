Free and open-source subtitle translation tool.
Built with Cloudflare Workers AI.

Roadmap:
- [x] Convert video to mp3 format in the browser using ffmpeg.wasm
- [x] Send mp3 to worker, generate vtt subtitles through whisper
- [x] translate subtitles through cloudflare AI qwen1.5-7b-chat-awq
- [ ] Resolve the cloudflare whisper audio duration limit of less than 5 minutes