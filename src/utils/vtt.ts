import { parseSync, Node, stringifySync } from 'subtitle'

function mergeSubtitle(source: string): {
  nodes: Node[] 
  vttContent: string
  textList: string[]
} {
  const convertedVtt = convertTimeFormat(source)
  const subtitles = parseSync(convertedVtt)
    .filter(item => item.type === 'cue')

  const mergedSubtitles = []
  for (let i = 0; i < subtitles.length; i += 3) {
    const group = subtitles.slice(i, i + 3)
    const mergedSubtitle = {
      type: 'cue',
      data: {
        start: group[0].data.start,
        end: group[group.length - 1].data.end,
        text: group.map(s => s.data.text).join(' ')
      }
    }
    mergedSubtitles.push(mergedSubtitle)
  }
  const vttContent = stringifySync([
    { type: 'header', data: 'WEBVTT' },
    ...JSON.parse(JSON.stringify(mergedSubtitles))
  ], { format: 'WebVTT' })
  
  return {
    nodes: mergedSubtitles as Node[],
    vttContent,
    textList: mergedSubtitles.map(item => {
      return item.data.text
    })
  }
}

function convertTimeFormat(vttContent: string): string {
  // convert time format
  return vttContent.replace(/(\d+)\.(\d{3}) --> (\d+)\.(\d{3})/g, (match, m1, m2, m3, m4) => {
    const formatTime = (seconds: string, milliseconds: string) => {
      const totalSeconds = parseInt(seconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds}`;
    };
    
    return `${formatTime(m1, m2)} --> ${formatTime(m3, m4)}`;
  })
}

export {
  mergeSubtitle
}
