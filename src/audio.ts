const ROOTS = [110, 98, 131, 87, 147, 123, 165, 104, 175, 116, 155, 92, 185, 138, 110]
const AIR = [520, 1500, 900, 640, 1700, 1900, 620, 740, 780, 1300, 980, 860, 1500, 2100, 460]

export class Score {
  enabled = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private oscA: OscillatorNode | null = null
  private oscB: OscillatorNode | null = null
  private filter: BiquadFilterNode | null = null
  private noiseGain: GainNode | null = null
  private index = 0

  toggle(): boolean {
    this.ensure()
    if (!this.ctx || !this.master) return false
    this.enabled = !this.enabled
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(this.enabled ? 0.2 : 0, now, 0.04)
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    if (this.enabled) this.apply(this.index, true)
    return this.enabled
  }

  setWorld(index: number) {
    this.index = index
    if (this.enabled) this.apply(index, true)
  }

  sip() {
    if (!this.enabled || !this.ctx) return
    this.blip(1680, 0.03, 0.04)
    this.noiseBurst(0.18, 900)
  }

  private ensure() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 700
    filter.Q.value = 0.6
    filter.connect(master)

    const oscA = ctx.createOscillator()
    const oscB = ctx.createOscillator()
    oscA.type = 'sine'
    oscB.type = 'sine'
    const gainA = ctx.createGain()
    const gainB = ctx.createGain()
    gainA.gain.value = 0.07
    gainB.gain.value = 0.045
    oscA.connect(gainA).connect(filter)
    oscB.connect(gainB).connect(filter)
    oscA.start()
    oscB.start()

    const length = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 800
    noiseFilter.Q.value = 0.7
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.012
    noise.connect(noiseFilter).connect(noiseGain).connect(master)
    noise.start()

    this.ctx = ctx
    this.master = master
    this.oscA = oscA
    this.oscB = oscB
    this.filter = filter
    this.noiseGain = noiseGain
  }

  private apply(index: number, tick: boolean) {
    if (!this.ctx || !this.oscA || !this.oscB || !this.filter) return
    const now = this.ctx.currentTime
    const freq = ROOTS[index] ?? 110
    this.oscA.frequency.setTargetAtTime(freq, now, 0.08)
    this.oscB.frequency.setTargetAtTime(freq * 1.005, now, 0.09)
    this.filter.frequency.setTargetAtTime(AIR[index] ?? 800, now, 0.12)
    if (tick) this.blip(freq * 2, 0.025, 0.03)
  }

  private blip(freq: number, gain: number, decay: number) {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const amp = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    amp.gain.setValueAtTime(gain, now)
    amp.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    osc.connect(amp).connect(this.master)
    osc.start(now)
    osc.stop(now + decay + 0.02)
  }

  private noiseBurst(gain: number, freq: number) {
    if (!this.ctx || !this.master || !this.noiseGain) return
    const now = this.ctx.currentTime
    this.noiseGain.gain.cancelScheduledValues(now)
    this.noiseGain.gain.setValueAtTime(gain, now)
    this.noiseGain.gain.exponentialRampToValueAtTime(0.012, now + 0.22)
    void freq
  }
}
