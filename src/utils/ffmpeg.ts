import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

async function useFFmpeg(inputFile: Uint8Array, filename: string, {
  onProgress,
  onTip,
}: {
  onProgress: (progress: number) => void
  onTip: (tip: string) => void
}) {
  let data: File | null = null
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  const ffmpeg = new FFmpeg()

  try {
    ffmpeg.on('progress', ({progress}) => {
      onProgress(progress * 100)
    })

    onTip('loading ffmpeg')
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
    onTip('ffmpeg core js loaded')
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    onTip('ffmpeg wasm loaded')

    await ffmpeg.load({
      coreURL,
      wasmURL,
    })
    onTip('converting video to mp3')
    await ffmpeg.writeFile(filename, inputFile)
    const mp3Filename = `${filename.split('.')[0]}.mp3`
    await ffmpeg.exec([
      '-i', filename,
      '-f', 'mp3',
      '-acodec', 'libmp3lame',
      '-b:a', '16k',        // 极低比特率
      '-ac', '1',          // 单声道
      '-ar', '8000',       // 极低采样率
      '-q:a', '9',         // 最低 VBR 质量
      '-compression_level', '9', // 最高压缩级别
      mp3Filename
    ])
    const f = await ffmpeg.readFile(mp3Filename)
    data = new File([f], mp3Filename, { type: 'audio/mpeg' })
  } catch (error) {
    console.error(error)
    onTip('failed to convert video to mp3')
  }
  return data
}

export default useFFmpeg