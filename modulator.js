import { DEFAULT } from "./js/defaults.js"

class Modulator {
    constructor() {
        this.FCarrierFreq = DEFAULT.PITCH
        this.FSamplesPerSec = DEFAULT.RATE
        this.FGain = 1
        this._CalcSinCos()
        this.FSampleNo = 0
    }

    set carrierFreq(Value) {
        this.FCarrierFreq = Value;
        this._CalcSinCos()
        this.FSampleNo = 0
    }

    set samplesPerSec(Value) {
        this.FSamplesPerSec = Value
        this._CalcSinCos()
        this.FSampleNo = 0
    }

    _CalcSinCos() {
        let Cnt = Math.round(this.FSamplesPerSec / this.FCarrierFreq)
        this.FCarrierFreq = this.FSamplesPerSec / Cnt
        let dFi = (Math.PI * 2) / Cnt

        this._Sn = new Float32Array(Cnt) 
        this._Cs = new Float32Array(Cnt) 

        this._Sn[0] = 0; this._Sn[1] = Math.sin(dFi)
        this._Cs[0] = 1; this._Cs[1] = Math.cos(dFi)

        // phase
        for (let i = 2; i < Cnt ; i++) {
            this._Cs[i] = this._Cs[1] * this._Cs[i - 1] - this._Sn[1] * this._Sn[i - 1]
            this._Sn[i] = this._Cs[1] * this._Sn[i - 1] + this._Sn[1] * this._Cs[i - 1]
        }

        // apply gain
        for (let i = 0; i < Cnt; i++) {
            this._Cs[i] = this._Cs[i] * this.FGain;
            this._Sn[i] = this._Sn[i] * this.FGain;
        }
    }

    Modulate(Data) {
        let result = new Array()

        for (let i = 0; i < Data.Re.length; i++) {
            result.push(Data.Re[i] * this._Sn[this.FSampleNo] - Data.Im[i] * this._Cs[this.FSampleNo])
            this.FSampleNo = (this.FSampleNo + 1) % this._Cs.length
        }
        return result
    }

}

export { Modulator }