import { DEFAULT } from "./defaults.js"
import { Modulator } from "./modulator.js"
import { Volume } from "./volume.js"
import { MovAvg } from "./movavg.js"

//import { Station } from "./station.js"
import { MyStation } from "./mystation.js"


export class Contest {
    constructor() {
        this._targetRate = DEFAULT.RATE
        this._src_buffer_size = DEFAULT.BUFSIZE
        this._Filter1 = new MovAvg()
    //    this._Filter2 = new MovAvg()
        // setup Filter
        this._Filter1.points = Math.round(0.7 * DEFAULT.RATE / DEFAULT.BANDWIDTH)
        this._Filter1.passes = DEFAULT.PASSES
        this._Filter1.samplesInInput = DEFAULT.BUFSIZE
        this._Filter1.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)

 //       this._Filter2.passes = DEFAULT.PASSES
  //      this._Filter2.samplesInInput = DEFAULT.BUFSIZE
 //       this._Filter2.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)

        // setup automatic gain control
        this._Agc = new Volume()
        this._Agc.NoiseInDb = 76
        this._Agc.NoiseOutDb = 76
        this._Agc.AttackSamples = Math.round(DEFAULT.RATE * 0.014)   // AGC attack 5 ms
        this._Agc.HoldSamples = Math.round(DEFAULT.RATE * 0.014)
        this._Agc.AgcEnabled = true
        // setup Modulator
        this._Modul = new Modulator()
        this._Modul.samplesPerSec = DEFAULT.RATE
        this._Modul.carrierFreq = DEFAULT.PITCH

        this._deltaRate = DEFAULT.RATE / this._targetRate

        this._src_buffer = new Float32Array(this._src_buffer_size)
        this._src_pos = 0

        this._src_complex_buffer = {
            Re: new Float32Array(this._src_buffer_size),
            Im: new Float32Array(this._src_buffer_size)
        }        


        this._MyStation = new MyStation()
//        this._MyStation.SendText("DJ1TF")
    }


    onmessage = (message) => {
        this._MyStation.SendText(message)
    }

    _complex_noise = (complex_buffer) => {
        const noise_amp = 6000
        for (let i = 0; i <  this._src_buffer_size; i++) {
            complex_buffer.Re[i] = 3 * noise_amp * (Math.random() - 0.5)
            complex_buffer.Im[i] = 3 * noise_amp * (Math.random() - 0.5)
        }
    }

    _getSrcBlock() {
        this._complex_noise(this._src_complex_buffer)
        let blk = this._MyStation.GetBlock()
        if (blk && blk !== null) {

            for (let n = 0; n < blk.length; n++) {
                this._src_complex_buffer.Im[n] = 0.59 * blk[n]
                this._src_complex_buffer.Re[n] = 0.59 * blk[n]
            }
        }
      //  this._Filter2.Filter(ReIm)
        this._Filter1.Filter(this._src_complex_buffer)
        let result = this._Modul.Modulate(this._src_complex_buffer)
        result = this._Agc.Process(result)

        // copy in this._src_buffer
        for (let i = 0; i < result.length; i++) this._src_buffer[i] = result[i]

    }

    getBlock(block) {
        if (this._targetRate !== DEFAULT.RATE) {
            debugger
/*
            for (let i = 0; i < block.length; i++) {
                if (this._src_pos === 0) this._getSrcBlock()
                block[i] = this._src_buffer[Math.floor(this._src_pos)] / 32800
                this._src_pos += this._deltaRate
                if (Math.floor(this._src_pos) >= this._src_buffer.length) this._src_pos = 0
            }*/
        } else {
            for (let i = 0;i<block.length;i++) {
                if (this._src_pos === 0) this._getSrcBlock()
                block[i] = this._src_buffer[this._src_pos] / 32800   
                this._src_pos++
                if (this._src_pos >= this._src_buffer.length) this._src_pos = 0
            }
        }
    }
}

export const Tst = new Contest()