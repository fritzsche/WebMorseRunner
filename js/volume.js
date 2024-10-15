import { DEFAULT } from "./defaults.js"

class Volume {
    constructor() {
        this._FMaxOut = 20000
        this._FNoiseIn = 1
        this._FNoiseOut = 2000
        this._CalcBeta()
        this._FAttackSamples = Math.round(DEFAULT.RATE * 0.005)
        this._FHoldSamples = this._FAttackSamples
        this._MakeAttackShape()
    }

    set NoiseInDb(Value = 76) {
        this._FNoiseIn = Math.pow(10, 0.05 * Value)
        this._CalcBeta()
    }

    set NoiseOutDb(Value) {
        this._FNoiseOut = Math.min(0.25 * this._FMaxOut, Math.pow(10, 0.05 * Value))
        this._CalcBeta()
    }

    set MaxOut(Value) {
        this._FMaxOut = Value;
        this._CalcBeta()
    }

    set AttackSamples(Value) {
        this._FAttackSamples = Math.max(1, Value)
        this._MakeAttackShape()
    }

    set HoldSamples(Value) {    
      this._FHoldSamples = Math.max(1, Value)
      this._MakeAttackShape()
    }  

    set AgcEnabled(Value) {

        if (Value && !this._FAgcEnabled) this._Reset()
        this._FAgcEnabled = Value
    } 


    _CalcBeta() {
        this._FBeta = this._FNoiseIn / Math.log(this._FMaxOut / (this._FMaxOut - this._FNoiseOut))
        this._FDefaultGain = this._FNoiseOut / this._FNoiseIn
    }


    _MakeAttackShape() {
        this._FLen = 2 * (this._FAttackSamples + this._FHoldSamples) + 1
        this._FAttackShape = new Array()


        // attack shape
        for (let i = 0; i < this._FAttackSamples; i++) {
            this._FAttackShape[i] = Math.log(0.5 - 0.5 * Math.cos((i + 1) * Math.PI / (this._FAttackSamples + 1)))
            this._FAttackShape[this._FLen - 1 - i] = this._FAttackShape[i]
        }

        this._Reset()
    }

    _Reset() {
        this._FRealBuf = new Float32Array(this._FLen)
        // TODO: Check if / how we can/should clear out ComplexBuffer?
        /*
          ClearReIm(FComplexBuf);
          SetLengthReIm(FComplexBuf, FLen);     
        */
        this._FMagBuf = new Float32Array(this._FLen);
   //     console.log("init:", this._FMagBuf)
        this._FBufIdx = 0
    }

    CalcAgcGain() {
        // look at both sides of the sample
        // and find the max. magnitude, weighed by FAttackShape
        let Envel = 1E-10
        let Di = this._FBufIdx
        for (let Wi = 0; Wi < this._FLen; Wi++) {
            let Sample = this._FMagBuf[Di] + this._FAttackShape[Wi]
            if (Sample > Envel) Envel = Sample
            Di++
            if (Di === this._FLen) Di = 0

        }
        // envelope
        this._FEnvelope = Envel;
        Envel = Math.exp(Envel)

        // gain
        let result = this._FMaxOut * (1 - Math.exp(-Envel / this._FBeta)) / Envel
        return result
    }


    _ApplyAgc(V) {
        // store data
        this._FRealBuf[this._FBufIdx] = V
        this._FMagBuf[this._FBufIdx] = Math.log(Math.abs(V + 1E-10))

        // increment index
        this._FBufIdx = (this._FBufIdx + 1) % this._FLen

        // output
        let result = this._FRealBuf[(this._FBufIdx + Math.floor(this._FLen / 2)) % this._FLen] * this.CalcAgcGain()
        return result
    }

    _ApplyDefaultGain(V) {

        let result = Math.min(this._FMaxOut, Math.max(-this._FMaxOut, V * this._FDefaultGain))
        this._FIsOverload = this._FIsOverload || (Math.abs(result) === this._FMaxOut)
        return result
    }

    Process(Data) {
        // Whats this?
        this._FIsOverload = false

        let result = new Array(Data.length)

        if (this._FAgcEnabled) {
            for (let i = 0; i < result.length; i++) {
                result[i] = this._ApplyAgc(Data[i])
            }
        } else {
            for (let i = 0; i < result.length; i++) {
                result[i] = this._ApplyDefaultGain(Data[i])
            }
        }
        return result
    }

}

export { Volume }