class MovAvg {
    constructor() {
        this.FPasses = 3
        this.FPoints = 129
        this.FSamplesInInput = 512
        this.FDecimateFactor = 1
        this.FGainDb = 0
        this._Reset()
    }
    _Reset() {
        let number_of_buffers = this.FPasses + 1
        let buffer_size = this.FSamplesInInput + this.FPoints
        let initial_value = 0
        this.BufRe = Array.from(Array(number_of_buffers), _ => Array(buffer_size).fill(initial_value))
        this.BufIm = Array.from(Array(number_of_buffers), _ => Array(buffer_size).fill(initial_value))
        this._CalcScale();
    }
    _CalcScale() {
        this.FNorm = Math.pow(10, 0.05 * this.FGainDb) * Math.pow(this.FPoints, -this.FPasses)
    }
    set passes(pass) {
        this.FPasses = pass
        this._Reset()
    }

    set points(p) {
        this.FPoints = p
        this._Reset()
    }

    set samplesInInput(s) {
        this.FSamplesInInput = s
        this._Reset()
    }

    set decimateFactor(d) {
        this.FDecimateFactor = d
        this._Reset()
    }

    set gainDb(g) {
        this.FGainDb = g
        this._CalcScale()
    }

    Filter(AData) {
        let result = {
            Re: [],
            Im: []
        }
        result.Re = this._DoFilter(AData.Re, this.BufRe)
        result.Im = this._DoFilter(AData.Im, this.BufIm)
        return result
    }

    _DoFilter(AData, ABuf) {
        // put new data at the end of the 0-th buffer
        this._PushArray(AData, ABuf[0]);
        // multi-pass
        for (let i = 1; i <= this.FPasses; i++) this._Pass(ABuf[i - 1], ABuf[i])
        // the sums are in the last buffer now, normalize and decimate result
        return this._GetResult(ABuf[this.FPasses])

    }
    _PushArray(Src, Dst) {
        let Len = Dst.length - Src.length
        // shift existing data to the left 
        for (let i = 0; i < Len; i++) Dst[i] = Dst[Src.length + i]
        // append new data
        for (let i = 0; i < Src.length; i++) Dst[Len + i] = Src[i]
    }

    _Pass(Src, Dst) {
        // make some free space in the buffer
        this._ShiftArray(Dst, this.FSamplesInInput);
        // calculate moving average recursively
        for (let i = this.FPoints; i < Src.length; i++) {
            Dst[i] = Dst[i - 1] - Src[i - this.FPoints] + Src[i]
        }
    }

    _ShiftArray(Dst, Count) {
        // shift data to the left
        const Len = Dst.length - Count
        for (let i = 0; i <= Len; i++) Dst[i] = Dst[Count + i]
    }

    _GetResult(Src) {
        let result = new Array()
        for (let i = 0; i < this.FSamplesInInput; i++)
            result.push(Src[this.FPoints + i * this.FDecimateFactor] * this.FNorm)
        return result
    }
}

export { MovAvg }