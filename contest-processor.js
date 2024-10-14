
import { Contest } from "./contest.js"

class ContestWorkletProcessor extends AudioWorkletProcessor {

  constructor(options) {
    super();
    this._contest = new Contest(sampleRate)
    this._block = new Float32Array(128)
    this._max = 0
    this._min = 0   
    this.phase = 0 
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0]
    this._contest.getBlock(this._block)

    

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = this._block[i]
        if (this._block[i] > this._max) {
          this._max = this._block[i]
          console.log(this._max)
        }
        if (this._block[i] < this._min) {
          this._min = this._block[i]
          console.log(this._min)
        }        


        //outputChannel[i] = Math.sin(this.phase);
        //this.phase += 0.1;


      }
    }

    return true;
  }
}

registerProcessor('contest-processor', ContestWorkletProcessor)