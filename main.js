const DEFAULTRATE = 11025
const DEFAULTBUFSIZE = 512
const DEFAULTPASSES = 3
const BANDWIDTH = 300
const PITCH = 500

import { Keyer } from "./keyer.js"
import { Modulator }  from "./modulator.js"
import { Volume }  from "./volume.js"
import { MovAvg }  from "./movavg.js"
import { Contest } from "./js/contest.js"

let GKeyer = new Keyer()

const NEVER = Number.MAX_VALUE

class Station {
    static stListening = 1
    static stCopying = 2
    static stPreparingToSend = 3
    static stSending = 4
//    static NEVER = Number.MAX_VALUE

    constructor() {
        this._FBfo = 0
        this._dPhi = 0
        this.Wpm = 20
        this.Amplitude = 300000
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
        for (let i = 0; i < DEFAULTBUFSIZE && this._SendPos + i < this._Envelope.length; i++) {
            result.push(this._Envelope[this._SendPos + i])
        }
        // advance TX buffer
        this._SendPos += DEFAULTBUFSIZE;
        if (this._SendPos >= this._Envelope.length) this._Envelope = null
        return result
    }

    SetPitch(Value) {
        this._FPitch = Value;
        dPhi = Math.PI * 2 * this._FPitch / DEFAULTRATE
    }
}

import { DEFAULT } from "./js/defaults.js"


const complex_noise = () => {
    const buffer_size = 512
    const noiseamp = 6000
    let result = {
        Re: [],
        Im: []
    }
    for (let i = 0; i < buffer_size; i++) {
        result.Re.push(0)
        result.Im.push(0)
    }
    return result
}



window.onload = () => {
    const button = document.getElementById("start")
    console.log("main")
    //contest();

    button.onclick = async () => {
        console.log("Start")
    

        let Filt = new MovAvg()
        let Filt2 = new MovAvg()
        const audioCtx = new AudioContext();
    //    console.log("Samples per second ", audioCtx.sampleRate)
        Filt.points = Math.round(0.7 * DEFAULTRATE / BANDWIDTH)
        Filt.passes = DEFAULTPASSES
        Filt.samplesInInput = DEFAULTBUFSIZE
        Filt.gainDb = 10 * Math.log10(500 / BANDWIDTH)

/*        Filt2.passes = DEFAULTPASSES
        Filt2.samplesInInput = DEFAULTBUFSIZE
        Filt2.gainDb = 10 * Math.log10(500 / BANDWIDTH)
*/

        let Agc = new Volume()
        Agc.NoiseInDb = 76
        Agc.NoiseOutDb = 76
        Agc.AttackSamples = 155   // AGC attack 5 ms
        Agc.HoldSamples = 155
        Agc.AgcEnabled = true


        let MyStation = new Station()
        MyStation.SendText("DJ1TF")

        let Modul = new Modulator()
        Modul.samplesPerSec = DEFAULTRATE;
        Modul.carrierFreq = PITCH

        let ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: DEFAULT.RATE })
        //DEFAULT.RATE = ctx.sampleRate    
        console.log("My Sample Rate: ",ctx.sampleRate)     
        const sampleRate =  ctx.sampleRate// DEFAULT.RATE//ctx.sampleRate//  DEFAULT.RATE //ctx.sampleRate // 11025 // samples per second 
        const numberOfSeconds = 15
        const myArrayBuffer = ctx.createBuffer(
            1,
            sampleRate * numberOfSeconds,
            sampleRate
        );


        let MyContest = new Contest( sampleRate )

        const source = ctx.createBufferSource();

        let ReIm = complex_noise()
        let buffer_pos = DEFAULTBUFSIZE
      //  Filt2.Filter(ReIm)
  //      ReIm = Filt.Filter(ReIm)
        
  //      let result = Modul.Modulate(ReIm)
         let result = new Array()
 //       result = Agc.Process(result)
        for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
            // This gives us the actual ArrayBuffer that contains the data
            const nowBuffering = myArrayBuffer.getChannelData(channel);
            if( 1 === 1) {
               MyContest.getBlock(nowBuffering )
            } else
            for (let i = 0; i < myArrayBuffer.length; i++) {

                if (buffer_pos === DEFAULTBUFSIZE) {
                    ReIm = complex_noise()
                    let blk = MyStation.GetBlock()

                    if (blk && blk !== null) {

                        for (let n = 0; n < blk.length; n++) {
                            ReIm.Im[n] = 0.59 * blk[n]
                            ReIm.Re[n] = 0.59 * blk[n]
                        }
                    }
                    buffer_pos = 0
//                    Filt2.Filter(ReIm)
                    ReIm = Filt.Filter(ReIm)
                    result = Modul.Modulate(ReIm)
                    result = Agc.Process(result)
                    

                }
                // audio needs to be in [-1.0; 1.0]
                nowBuffering[i] = result[buffer_pos] / 32800
                buffer_pos++
                //console.log(nowBuffering[i])

            }
        }
        console.log("finish buffer")

        // set the buffer in the AudioBufferSourceNode
        source.buffer = myArrayBuffer
        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(ctx.destination)
        // start the source playing
        source.start()
    }
    
}
