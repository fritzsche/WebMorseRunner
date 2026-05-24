
import { Tst } from "./contest.js"
import { DEFAULT, RunMode } from "./defaults.js"
import { DxOperator } from "./dxoperator.js"

const dxWpmByCall = new Map()

Object.defineProperty(DxOperator.prototype, "Wpm", {
  get() {
    if (DEFAULT.RUNMODE !== RunMode.Hst && dxWpmByCall.has(this.Call)) {
      return dxWpmByCall.get(this.Call)
    }
    if (DEFAULT.RUNMODE === RunMode.Hst) return DEFAULT.WPM
    return Math.round(DEFAULT.WPM * 0.5 * (1 + Math.random()))
  }
})

class ContestWorkletProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super()
    Tst.processor = this
    this._contest = Tst //new Contest()
    this._block = new Float32Array(128)
    this._start = false
    this.port.onmessage = (e) => {
      if (e.data.type === "create_dx") {
        const calls = Array.isArray(e.data.data) ? e.data.data : e.data.data.calls
        calls.forEach(call => {
          if (call[3]) dxWpmByCall.set(call[0], Number(call[3]))
        })
      }
      Tst.onmessage(e.data)
      this._start = true
    }

  }

  process(inputs, outputs, parameters) {
    const output = outputs[0]
    const no_of_channel = output.length
    if (!this._start) return true
    if (Tst.running && no_of_channel > 0) {
      this._contest.getBlock(this._block)
      for (let channel = 0; channel < no_of_channel; ++channel) {
        const outputChannel = output[channel]
        const buffer_size = outputChannel.length
        for (let i = 0; i < buffer_size; ++i) {
          outputChannel[i] = this._block[i]
        }
      }
      return true
    } else return false
  }
}

registerProcessor('contest-processor', ContestWorkletProcessor)
