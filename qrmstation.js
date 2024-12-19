import { DEFAULT, StationMessage } from './defaults'
import { Station } from "./station.js"
import * as random from './random.js'

class QrmStation extends Station {
    constructor(call) {
        super()
        this.Patience = 1 + random.RandomInt(0, 5)
        this.MyCall = call
        this.HisCall = DEFAULT.CALL
        this.Amplitude = 5000 + 25000 * Math.random()
        this.Pitch = random.RandomInt(0, random.RndGaussLim(0, 300))
        this.Wpm = 30 + random.RandomInt(random(20))

        switch (random.RandomInt(0, 7)) {
            case 0:
                this.SendMsg(StationMessage.Qrl)
                break
            case 1, 2:
                this.SendMsg(StationMessage.Qrl2)
                break
            case 3, 4, 5:
                this.SendMsg(StationMessage.LongCQ)
                break
            case 6:
                this.SendMsg(StationMessage.Qsy)
                break
        }
    }

    ProcessEvent(TStationEvent) {
        switch (AEvent) {
            case Station.Event.MsgSent:
                this.Patience--
                if (this.Patience !== 0)
                    this.Timeout = Math.round(random.RndGaussLim(random.SecondsToBlocks(4), 2))
                break
            case Station.Event.Timeout:
                this.SendMsg(StationMessage.LongCQ)
        }
    }


}