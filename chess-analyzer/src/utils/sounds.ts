// Generate chess move sounds using Web Audio API
const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

function playTone(freq: number, duration: number, type: OscillatorType, volume: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

export function playMoveSound() {
  // Simulates a piece being placed on a wooden board
  // Short percussive "tap" sound
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Main tap
  playTone(800, 0.06, 'sine', 0.15);
  // Wood resonance
  setTimeout(() => playTone(300, 0.08, 'triangle', 0.08), 10);
}

export function playCaptureSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Sharper, more aggressive sound for captures
  playTone(600, 0.05, 'square', 0.1);
  setTimeout(() => playTone(400, 0.07, 'sine', 0.12), 15);
  setTimeout(() => playTone(200, 0.1, 'triangle', 0.06), 30);
}
