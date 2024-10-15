import { Keyer } from "./keyer.js"
import { DEFAULT } from "./defaults.js"

let GKeyer = new Keyer()

const NEVER = Number.MAX_VALUE

export class Station {
    static stListening = 1
    static stCopying = 2
    static stPreparingToSend = 3
    static stSending = 4

    constructor() {
        this._FBfo = 0
        this._dPhi = 0
        this.Wpm = 20
        this.Amplitude = 300000
        GKeyer.rate = DEFAULT.RATE
    }

    _GetBfo() {
        let result = this._FBfo
        this._FBfo = this._FBfo + this._dPhi
        if (this._FBfo > Math.PI * 2) this._FBfo -= Math.PI * 2
        return XPathResult
    }
    SendText(AMsg) {
        /*    
              if Pos('<#>', AMsg) > 0 then
                begin
                //with error
                AMsg := StringReplace(AMsg, '<#>', NrAsText, []);
                //error cleared
                AMsg := StringReplace(AMsg, '<#>', NrAsText, [rfReplaceAll]);
                end;
            
              AMsg := StringReplace(AMsg, '<my>', MyCall, [rfReplaceAll]);
            
            {
              if CallsFromKeyer
                 then AMsg := StringReplace(AMsg, '<his>', ' ', [rfReplaceAll])
                 else AMsg := StringReplace(AMsg, '<his>', HisCall, [rfReplaceAll]);
            }
        */
        if (this.MsgText) {
            this.MsgText += ' ' + AMsg
        } else { this.MsgText = AMsg }
        this.SendMorse(GKeyer.Encode(this.MsgText))
    }

    SendMorse(AMorse) {
        if (!this._Envelope) {
            this._SendPos = 0
            this._FBfo = 0

        }

        GKeyer.Wpm = this.Wpm;
        GKeyer.MorseMsg = AMorse;
        this._Envelope = GKeyer.GetEnvelope()
        for (let i = 0; i < this._Envelope.length; i++) this._Envelope[i] *= this.Amplitude;

        this.State = this.stSending;
        this.TimeOut = NEVER;
    }

    GetBlock() {
        if (!this._Envelope || this._Envelope === null) {
            return null
        }
        let result = new Array()
        for (let i = 0; i < DEFAULT.BUFSIZE && this._SendPos + i < this._Envelope.length; i++) {
            result.push(this._Envelope[this._SendPos + i])
        }
        // advance TX buffer
        this._SendPos += DEFAULT.BUFSIZE;
        if (this._SendPos >= this._Envelope.length) this._Envelope = null
        return result
    }

    SetPitch(Value) {
        this._FPitch = Value;
        dPhi = Math.PI * 2 * this._FPitch / DEFAULT.RATE
    }
}
