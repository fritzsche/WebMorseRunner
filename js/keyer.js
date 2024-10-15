
const MorseMap = new Map([
    ['<ka>', '-.-.-'], // Message begins / Start of work 
    ['<sk>', '...-.-'], //  End of contact / End of work
    ['<ar>', '.-.-.'], // End of transmission / End of message
    ['<kn>', '-.--.'], // Go ahead, specific named station.
    ['=', '-...-'],
    ['a', '.-'],
    ['b', '-...'],
    ['c', '-.-.'],
    ['d', '-..'],
    ['e', '.'],
    ['f', '..-.'],
    ['g', '--.'],
    ['h', '....'],
    ['i', '..'],
    ['j', '.---'],
    ['k', '-.-'],
    ['l', '.-..'],
    ['m', '--'],
    ['n', '-.'],
    ['o', '---'],
    ['p', '.--.'],
    ['q', '--.-'],
    ['r', '.-.'],
    ['s', '...'],
    ['t', '-'],
    ['u', '..-'],
    ['v', '...-'],
    ['w', '.--'],
    ['x', '-..-'],
    ['y', '-.--'],
    ['z', '--..'],
    ['1', '.----'],
    ['2', '..---'],
    ['3', '...--'],
    ['4', '....-'],
    ['5', '.....'],
    ['6', '-....'],
    ['7', '--...'],
    ['8', '---..'],
    ['9', '----.'],
    ['0', '-----'],
    ['\'', '.-.-.-'],
    ['?', '..--..'],
    ['/', '-..-.'],
    ['.', '.-.-.-']
])




class Keyer {
    constructor() {
        this.Rate = 11025
        this.RiseTime = 0.005
        this.FRiseTime = 0.005
        this.Wpm = 20
        this.BufSize = 512
        this.MorseMsg = this.Encode('DJ1TF')
        this._MakeRamp()
    }

    set riseTime(Value) {
        this.FRiseTime = Value;
        this._MakeRamp()
    }

    _BlackmanHarrisKernel(x) {
        const a0 = 0.35875
        const a1 = 0.48829
        const a2 = 0.14128
        const a3 = 0.01168
        return a0 - a1 * Math.cos(2 * Math.PI * x) + a2 * Math.cos(4 * Math.PI * x) - a3 * Math.cos(6 * Math.PI * x)
    }

    _BlackmanHarrisStepResponse(Len) {
        let result = new Array()
        // generate kernel
        for (let i = 0; i < Len; i++) result.push(this._BlackmanHarrisKernel(i / Len))
        // integrate
        for (let i = 1; i < Len; i++) result[i] = result[i - 1] + result[i]
        // normalize
        let Scale = 1 / result[Len - 1]
        for (let i = 0; i < Len; i++) result[i] = result[i] * Scale;
        return result
    }

    _MakeRamp() {
        this._RampLen = Math.round(2.7 * this.FRiseTime * this.Rate)
        this._RampOn = this._BlackmanHarrisStepResponse(this._RampLen)
        this._RampOff = new Array()
        for (let i = 0; i <= this._RampLen - 1; i++)
            this._RampOff[this._RampLen - i - 1] = this._RampOn[i]
    }

    Encode(Txt) {
        let result = ''
        for (let i = 0; i < Txt.length; i++) {
            if (Txt[i] === ' ' || Txt[i] === '_') result = result + ' '
            else result = result + MorseMap.get(Txt[i].toLowerCase()) + ' '
        }
        if (result !== '') result += '~'
        return result
    }

    GetEnvelope() {
        let UnitCnt = 0
        let p = 0
        let result = new Array()

        const AddRampOn = () => {
            for (let i = 0; i < this._RampLen; i++) result[p + i] = this._RampOn[i]
            p += this._RampLen
        }

        const AddRampOff = () => {
            for (let i = 0; i < this._RampLen; i++) result[p + i] = this._RampOff[i]
            p += this._RampLen
        }

        const AddOff = (Dur) => {
            for (let i = 0; i < Dur * SamplesInUnit - this._RampLen; i++) result[p + i] = 0
            p += Dur * SamplesInUnit - this._RampLen
        }

        const AddOn = (Dur) => {
            for (let i = 0; i < Dur * SamplesInUnit - this._RampLen; i++) result[p + i] = 1
            p += Dur * SamplesInUnit - this._RampLen
        }

        for (let i = 0; i < this._MorseMsg; i++) {
            switch (this._MorseMsg[i]) {
                case '.': UnitCnt += 2
                    break
                case '-': UnitCnt += 4
                    break
                case ' ': UnitCnt += 2
                    break
                case '~': UnitCnt++
                    break

            }
        }

        //calc buffer size
        let SamplesInUnit = Math.round(0.1 * this.Rate * 12 / this.Wpm);
        //       let TrueEnvelopeLen = UnitCnt * SamplesInUnit + this._RampLen;
        //       let Len = this.BufSize * Math.ceil(TrueEnvelopeLen / this.BufSize);       
        result = new Array()
        for (let i = 0; i < this.MorseMsg.length; i++) {
            switch (this.MorseMsg[i]) {
                case '.':
                    AddRampOn()
                    AddOn(1)
                    AddRampOff()
                    AddOff(1)
                    break
                case '-':
                    AddRampOn()
                    AddOn(3)
                    AddRampOff()
                    AddOff(1)
                    break
                case ' ': AddOff(1)
                    break
                case '~': AddOff(1)
                    break
            }

        }
        return result

    }
}


export { Keyer }