import { Station } from "./station.js"
import * as random from './random.js'
import { DEFAULT } from "./defaults.js"

export class QrnStation extends Station {
    constructor() {
        super()
        this.Duration = random.SecondsToBlocks(Math.random()) * DEFAULT.BUFSIZE
        this._Envelope = new Float32Array(this.Duration)
        this.Amplitude = 1000 * Math.pow(10, 2 * Math.random())
        for (let i = 0; i < this._Envelope.length; i++) {          
            if (Math.random() < 0.01) {
                const fact = Math.random()
                const val = (fact - 0.5) * this.Amplitude
                this._Envelope[i] = val
            }
        }    
        this.State = Station.State.Sending
    }

    ProcessEvent(AEvent) {
        if (AEvent === Station.Event.MsgSent) this.done = true
    }

}