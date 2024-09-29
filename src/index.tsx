import { Hono } from 'hono'
import Binding from './bindings'
import renderer from './renderer'
import { mergeSubtitle } from './utils/vtt'
import { splitText } from './utils/text'
import { NodeList, stringifySync } from 'subtitle'
import { safeEncode } from './utils/base64'

const app = new Hono<{ Bindings: Binding }>()

app.get('/', (c) => {
  return c.html(renderer)
})

app.get('/task/keys', async (c) => {
  const list = await c.env.KV.list()
  return c.json(list.keys.map(item => item.name))
})

app.get('/task/detail/:key', async (c) => {
  const key = c.req.param('key')
  const task = await c.env.KV.get(key)
  return c.json(task)
})

app.post('/upload', async (c) => {
  // Check if the file type is mp3
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  if (file.type !== 'audio/mpeg') {
    return c.text('Invalid file type', 400)
  }

  const key = safeEncode(`${file.name.replace('.mp3', '')}-${Date.now()}`)
  await c.env.KV.put(key, JSON.stringify({
    status: 'pending'
  }))

  async function processTask() {
    // convert file to arraybuffer
    const audioBuffer = await file.arrayBuffer()

    const whisperResponse = await c.env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(audioBuffer)]
    })
    const vtt = whisperResponse.vtt || ''
    const { nodes, textList, vttContent } = mergeSubtitle(vtt)
    await c.env.KV.put(key, JSON.stringify({
      status: 'processing',
      raw: vttContent
    }))

    const targetLanguage = formData.get('targetLanguage') as string

    const result = []
    for (let i = 0; i < textList.length; i += 3) {
      const subContent = textList.slice(i, i + 3)
      const content = subContent.join(' ')
      console.log('content', content)
      const translatedContent = await c.env.AI.run('@cf/qwen/qwen1.5-7b-chat-awq', {
        messages: [{
          role: "user",
          content: `
            Translate the following text to ${targetLanguage}:
            ${content}
          `
        }],
        top_p: 0.9,
        top_k: 1,
        temperature: 0.1,
        stream: false
      })
      result.push(...splitText((translatedContent as any).response || '', subContent.length));
    }

    if (result.length !== textList.length) {
      c.env.KV.put(key, JSON.stringify({
        status: 'failed',
      }))
      return
    }

    let translatedNodes: NodeList = []
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.type === 'cue') {
        translatedNodes.push({
          ...node,
          data: {
            ...node.data,
            text: result[i]
          }
        })
      } else {
        translatedNodes.push(node)
      }
    }

    translatedNodes.unshift({
      type: 'header',
      data: 'WEBVTT'
    })

    const translatedVtt = stringifySync(translatedNodes, { format: 'WebVTT' })

    const previous = await c.env.KV.get(key)
    if (previous) {
      const { status, raw: rawVtt } = JSON.parse(previous)
      if (status === 'processing') {
        await c.env.KV.put(key, JSON.stringify({
          status: 'success',
          raw: rawVtt,
          translatedVtt
        }))
      }
    }
  }

  processTask()
  return c.json({
    success: true,
  })
})

export default app
