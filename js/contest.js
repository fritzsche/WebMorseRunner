import { DEFAULT } from "./defaults.js"
import { Modulator } from "./modulator.js"
import { Volume } from "./volume.js"
import { MovAvg } from "./movavg.js"

import { Station } from "./station.js"

export class Contest {
    constructor(target_rate) {
        this._targetRate = target_rate
        this._Filter1 = new MovAvg()
        this._Filter2 = new MovAvg()
        // setup Filter
        this._Filter1.points = Math.round(0.7 * DEFAULT.RATE / DEFAULT.BANDWIDTH)
        this._Filter1.passes = DEFAULT.PASSES
        this._Filter1.samplesInInput = DEFAULT.BUFSIZE
        this._Filter1.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)

        this._Filter2.passes = DEFAULT.PASSES
        this._Filter2.samplesInInput = DEFAULT.BUFSIZE
        this._Filter2.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)

        // setup automatic gain control
        this._Agc = new Volume()
        this._Agc.NoiseInDb = 76
        this._Agc.NoiseOutDb = 76
        this._Agc.AttackSamples = Math.round(DEFAULT.RATE * 0.014) //155   // AGC attack 5 ms
        this._Agc.HoldSamples = Math.round(DEFAULT.RATE * 0.014) //155 //this._Agc.AttackSamples
        this._Agc.AgcEnabled = true
        // setup Modulator
        this._Modul = new Modulator()
        this._Modul.samplesPerSec = DEFAULT.RATE
        this._Modul.carrierFreq = DEFAULT.PITCH

        this._deltaRate = DEFAULT.RATE / this._targetRate

        this._src_buffer = new Float32Array(DEFAULT.BUFSIZE)
        this._src_pos = 0


        this._MyStation = new Station()
        this._MyStation.SendText("DJ1TF")
        console.log("all setup")
    }

    _complex_noise = () => {
        const buffer_size = DEFAULT.BUFSIZE
        const noise_amp = 6000
        let result = {
            Re: [],
            Im: []
        }
        for (let i = 0; i < buffer_size; i++) {
            result.Re.push(3 * noise_amp * (Math.random() - 0.5))
            result.Im.push(3 * noise_amp * (Math.random() - 0.5))
        }
        return result
    }

    _getSrcBlock() {
        let ReIm = this._complex_noise()
        let blk = this._MyStation.GetBlock()
        const call_amp = 0.59
        if (blk && blk !== null) {

            for (let n = 0; n < blk.length; n++) {
                ReIm.Im[n] = call_amp * blk[n]
                ReIm.Re[n] = call_amp * blk[n]
            }
        }
        this._Filter2.Filter(ReIm)
        ReIm = this._Filter1.Filter(ReIm)
        let result = this._Modul.Modulate(ReIm)
        result = this._Agc.Process(result)

        // copy in this._src_buffer
        for (let i = 0; i < result.length; i++) this._src_buffer[i] = result[i]

    }

/*
            for (let i = 0;i<block.length;i++) {
                if (this._src_pos === 0) this._getSrcBlock()
                block[i] = this._src_buffer[this._src_pos] / 32800   
                this._src_pos++
                if (this._src_pos >= this._src_buffer.length) this._src_pos = 0
            }
*/


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