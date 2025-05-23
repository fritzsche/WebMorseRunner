import { DEFAULT } from "./defaults.js"
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
        this.Rate = DEFAULT.RATE
        this.RiseTime = 0.005
        this.FRiseTime = 0.005
        this.Wpm = DEFAULT.WPM
        this.BufSize = DEFAULT.BUFSIZE
        this.MorseMsg = Keyer.Encode('DJ1TF')
        this._MakeRamp()
    }

    set rate(rate) {
        this.Rate = rate
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

    _BlackmanHarrisStepResponse(Length) {
        let result = new Array()
        // generate kernel
        for (let i = 0; i < Length; i++) result.push(this._BlackmanHarrisKernel(i / Length))
        // integrate
        for (let i = 1; i < Length; i++) result[i] = result[i - 1] + result[i]
        // normalize
        let Scale = 1 / result[Length - 1]
        for (let i = 0; i < Length; i++) result[i] = result[i] * Scale;
        return result
    }

    _MakeRamp() {
        this._RampLength = Math.round(2.7 * this.FRiseTime * this.Rate)
        this._RampOn = this._BlackmanHarrisStepResponse(this._RampLength)
        this._RampOff = new Array()
        for (let i = 0; i <= this._RampLength - 1; i++)
            this._RampOff[this._RampLength - i - 1] = this._RampOn[i]
    }

    static Encode(Txt) {
        let result = ''        
        for (let i = 0; i < Txt.length; i++) {
            if (Txt[i] === ' ' || Txt[i] === '_') result += ' '
            else result += MorseMap.get(Txt[i].toLowerCase()) + ' '
        }
        if (result !== '') result = result.substring(0, result.length-1) + '~'
        return result
    }

    GetEnvelope() {
        let UnitCount = 0
        let position = 0

        //calc buffer size
        let SamplesInUnit = Math.round(0.1 * this.Rate * 12 / this.Wpm);        

        const AddRampOn = () => {
            for (let i = 0; i < this._RampLength; i++) result[position + i] = this._RampOn[i]
            position += this._RampLength
        }

        const AddRampOff = () => {
            for (let i = 0; i < this._RampLength; i++) result[position + i] = this._RampOff[i]
            position += this._RampLength
        }

        const AddOff = (Duration) => {
            for (let i = 0; i < Duration * SamplesInUnit - this._RampLength; i++) result[position + i] = 0
            position += Duration * SamplesInUnit - this._RampLength
        }

        const AddOn = (Duration) => {
            for (let i = 0; i < Duration * SamplesInUnit - this._RampLength; i++) result[position + i] = 1
            position += Duration * SamplesInUnit - this._RampLength
        }

        for (let i = 0; i < this.MorseMsg.length; i++) {
            switch (this.MorseMsg[i]) {
                case '.': UnitCount += 2
                    break
                case '-': UnitCount += 4
                    break
                case ' ': UnitCount += 2
                    break
                case '~': UnitCount++
                    break

            }
        }


        let TrueEnvelopeLen = UnitCount * SamplesInUnit + this._RampLength;
        let Length = this.BufSize * Math.ceil(TrueEnvelopeLen / this.BufSize);       

        let result =  new Float32Array(Length) //new Array()
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
                case ' ': AddOff(2)
                    break
                case '~': AddOff(1)
                    break
            }

        }
        return result

    }
}


export { Keyer }