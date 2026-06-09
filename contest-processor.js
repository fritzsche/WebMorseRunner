
import { Tst } from "./contest.js"
import { AudioMessage } from "./defaults.js"

class ContestWorkletProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super()
    Tst.processor = this
    this._contest = Tst
    this._block = new Float32Array(128)
    this._start = false
    this._recording = false
    this._rec_buf   = new Float32Array(8192)
    this._rec_pos   = 0
    this.port.onmessage = (e) => {
      const { type } = e.data
      if (type === AudioMessage.start_recording) {
        this._rec_buf = new Float32Array(8192)
        this._rec_pos = 0
        this._recording = true
        return
      }
      if (type === AudioMessage.stop_recording) {
        this._recording = false
        if (this._rec_pos > 0) {
          const partial = this._rec_buf.slice(0, this._rec_pos)
          this.port.postMessage(
            { type: AudioMessage.audio_chunk, data: partial.buffer },
            [partial.buffer]
          )
        }
        this._rec_pos = 0
        return
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
      if (this._recording) {
        for (let i = 0; i < 128; i++) {
          this._rec_buf[this._rec_pos++] = this._block[i]
          if (this._rec_pos === 8192) {
            this.port.postMessage(
              { type: AudioMessage.audio_chunk, data: this._rec_buf.buffer },
              [this._rec_buf.buffer]
            )
            this._rec_buf = new Float32Array(8192)
            this._rec_pos = 0
          }
        }
      }
      return true
    } else return false
  }
}

registerProcessor('contest-processor', ContestWorkletProcessor)
