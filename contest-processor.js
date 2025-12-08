
import { Tst } from "./contest.js"

class ContestWorkletProcessor extends AudioWorkletProcessor {

  constructor(options) {
    //console.log("audio")
    super();
    Tst.processor = this
    this._contest = Tst //new Contest()
    this._block = new Float32Array(128)
    this._start = false
    this.port.onmessage = (e) => {
      Tst.onmessage(e.data)
      this._start = true
    };
   
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0]
    const no_of_channel = output.length
    if(!this._start) return true
    if (Tst.running  && no_of_channel > 0) {
      this._contest.getBlock(this._block)
      for (let channel = 0; channel < no_of_channel; ++channel) {
        const outputChannel = output[channel];
        const buffer_size = outputChannel.length
        for (let i = 0; i < buffer_size; ++i) {
          outputChannel[i] = this._block[i];
        }
      }
      return true;
    } else return false;
  }
}

registerProcessor('contest-processor', ContestWorkletProcessor)