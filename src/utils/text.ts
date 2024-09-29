const languageLocaleMap = new Map<string, string>([
  ['Chinese', 'zh'],
  ['English', 'en'],
  ['Spanish', 'es'],
  ['French', 'fr'],
  ['German', 'de'],
  ['Italian', 'it'],
  ['Japanese', 'ja'],
  ['Korean', 'ko'],
])

function splitText(text: string, numParts = 3, targetLanguage: string = 'Chinese') {
  const segmenter = new Intl.Segmenter(languageLocaleMap.get(targetLanguage) || 'zh', { granularity: 'word' })
  const segments = segmenter.segment(text)
  
  const words = Array.from(segments).map(seg => seg.segment)
  
  const totalWords = words.length
  const wordsPerPart = Math.ceil(totalWords / numParts)
  
  const result = []
  let currentPart = []
  let currentCount = 0
  
  for (const word of words) {
    currentPart.push(word);
    currentCount++;
    
    if (currentCount >= wordsPerPart && result.length < numParts - 1) {
      result.push(currentPart.join(''));
      currentPart = [];
      currentCount = 0;
    }
  }
  
  if (currentPart.length > 0) {
    result.push(currentPart.join(''));
  }

  return result
}

export {
  splitText
}