
import { Contest } from "./contest.js"

class ContestWorkletProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super();
    this._contest = new Contest(sampleRate)
    this._block = new Float32Array(128)
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0]
    this._contest.getBlock(this._block)

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = this._block[i];
      }
    }

    return true;
  }
}

registerProcessor('contest-processor', ContestWorkletProcessor)