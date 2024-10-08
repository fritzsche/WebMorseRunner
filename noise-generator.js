
import { RingBuffer }  from "./ringbuffer.js"  



class NoiseGenerator extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [{name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1}];
    }
  
    process(inputs, outputs, parameters) {
      const output = outputs[0];
      const amplitude = parameters.amplitude;
      const isAmplitudeConstant = amplitude.length === 1;


      var lastOut = 0;
  
      for (let channel = 0; channel < output.length; ++channel) {
        const outputChannel = output[channel];
        for (let i = 0; i < outputChannel.length; ++i) {
          let white = 2 * (Math.random() - 0.5);
    //      let brown = (lastOut + (0.02 * white)) / 1.02;

          outputChannel[i] = white;
        //  lastOut = brown;

        }
      }
  
      return true;
    }
  }
  
  registerProcessor('noise-generator', NoiseGenerator);
  console.log("processor")