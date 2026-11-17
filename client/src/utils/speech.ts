export function speakText(text: string) {

  if (!('speechSynthesis' in window)) {
    return false
  }

  window.speechSynthesis.cancel()

  const speech = new SpeechSynthesisUtterance(text)

  speech.lang = 'en-IN'
  speech.rate = 0.95
  speech.pitch = 1
  speech.volume = 1

  window.speechSynthesis.speak(speech)

  return true
}

export function stopSpeaking() {

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}