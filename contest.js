import { DEFAULT, StationMessage, RunMode, AudioMessage } from "./defaults.js"
import { Modulator } from "./modulator.js"
import { Volume } from "./volume.js"
import { MovAvg } from "./movavg.js"
import { Station } from "./station.js"
import { DxStation } from "./dxstation.js"
import * as random from './random.js'
import { MyStation } from "./mystation.js"


export class Contest {
    constructor() {
        this.BlockNumber = 0
        this._targetRate = DEFAULT.RATE
        this._src_buffer_size = DEFAULT.BUFSIZE
        this._Filter1 = new MovAvg()
        //    this._Filter2 = new MovAvg()
        // setup Filter
        this._Filter1.points = Math.round(0.7 * DEFAULT.RATE / DEFAULT.BANDWIDTH)
        this._Filter1.passes = DEFAULT.PASSES
        this._Filter1.samplesInInput = DEFAULT.BUFSIZE
        this._Filter1.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)

        //       this._Filter2.passes = DEFAULT.PASSES
        //      this._Filter2.samplesInInput = DEFAULT.BUFSIZE
        //       this._Filter2.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)

        // setup automatic gain control
        this._Agc = new Volume()
        this._Agc.NoiseInDb = 76
        this._Agc.NoiseOutDb = 76
        this._Agc.AttackSamples = Math.round(DEFAULT.RATE * 0.014)   // AGC attack 5 ms
        this._Agc.HoldSamples = Math.round(DEFAULT.RATE * 0.014)
        this._Agc.AgcEnabled = true
        // setup Modulator
        this._Modul = new Modulator()
        this._Modul.samplesPerSec = DEFAULT.RATE
        this._Modul.carrierFreq = DEFAULT.PITCH

        this._deltaRate = DEFAULT.RATE / this._targetRate

        this._src_buffer = new Float32Array(this._src_buffer_size)
        this._src_pos = 0

        this._src_complex_buffer = {
            Re: new Float32Array(this._src_buffer_size),
            Im: new Float32Array(this._src_buffer_size)
        }


        this._MyStation = new MyStation()

        this._dx_count = 0
        this.Stations = new Array()
        this.RitPhase = 0
    }

    set processor(p) {
        this._processor = p
    }


    onmessage = (message) => {
        switch (message.type) {
            case 'send':
                this._MyStation.SendText(message.data)
                break
            case AudioMessage.create_dx:
                console.log("create", message.data)
                let dx = new DxStation(message.data)
                this.Stations.push(dx)
                this._MyStation._Msg = [StationMessage.CQ]
                dx.ProcessEvent(Station.Event.MeFinished)
                break
            case AudioMessage.send_his:
                this._MyStation.HisCall = message.data
                this._MyStation.SendMsg(StationMessage.HisCall)
                break
            case AudioMessage.send_nr:
                this._MyStation.SendMsg(StationMessage.NR)
                break
            case AudioMessage.send_tu:
                this._MyStation.SendMsg(StationMessage.TU)
                break
            case AudioMessage.send_qm:
                this._MyStation.SendMsg(StationMessage.Qm)
                break
            default:
                console.log('ERROR: Unknown: ', message)
        }
    }

    _complex_noise = (complex_buffer) => {
        const noise_amp = 6000
        for (let i = 0; i < this._src_buffer_size; i++) {
            complex_buffer.Re[i] = 3 * noise_amp * (Math.random() - 0.5)
            complex_buffer.Im[i] = 3 * noise_amp * (Math.random() - 0.5)
        }
    }

    _getSrcBlock() {
        this.BlockNumber++
        this._complex_noise(this._src_complex_buffer)
        for (let Stn = 0; Stn < this.Stations.length; Stn++) {
            if (this.Stations[Stn].State === Station.State.Sending) {
                let Blk = this.Stations[Stn].GetBlock()
                for (let i = 0; i < Blk.length; i++) {
                    let Bfo = this.Stations[Stn].Bfo - this.RitPhase - i * Math.PI * 2 * DEFAULT.RIT / DEFAULT.RATE;
                    this._src_complex_buffer.Re[i] = this._src_complex_buffer.Re[i] + Blk[i] * Math.cos(Bfo)
                    this._src_complex_buffer.Im[i] = this._src_complex_buffer.Im[i] - Blk[i] * Math.sin(Bfo)
                }
            }
        }
        // Rit
        this.RitPhase = this.RitPhase + DEFAULT.BUFSIZE * Math.PI * 2 * DEFAULT.RIT / DEFAULT.RATE
        while (this.RitPhase > Math.PI * 2) this.RitPhase = this.RitPhase - Math.PI * 2
        while (this.RitPhase < -Math.PI * 2) this.RitPhase = this.RitPhase + Math.PI * 2


        let blk = this._MyStation.GetBlock()
        if (blk && blk !== null) {

            for (let n = 0; n < blk.length; n++) {
                this._src_complex_buffer.Im[n] = 0.59 * blk[n]
                this._src_complex_buffer.Re[n] = 0.59 * blk[n]
            }
        }
        //  this._Filter2.Filter(ReIm)
        this._Filter1.Filter(this._src_complex_buffer)
        let result = this._Modul.Modulate(this._src_complex_buffer)
        result = this._Agc.Process(result)



        //timer tick
        this._MyStation.Tick()
        for (let Stn = this.Stations.length - 1; Stn >= 0; Stn--) this.Stations[Stn].Tick()

        if (this._dx_count === 0) {
            this.post({
                type: 'request_dx'
            })
            this._dx_count++
        }

        // copy in this._src_buffer
        for (let i = 0; i < result.length; i++) this._src_buffer[i] = result[i]

    }

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
            for (let i = 0; i < block.length; i++) {
                if (this._src_pos === 0) this._getSrcBlock()
                block[i] = this._src_buffer[this._src_pos] / 32800
                this._src_pos++
                if (this._src_pos >= this._src_buffer.length) this._src_pos = 0
            }
        }

    }

    get Minute() {
        return random.BlocksToSeconds(this.BlockNumber) / 60
    }

    post(m) {
        this._processor.port.postMessage(m)
    }

    OnMeStartedSending() {
        //tell callers that I started sending
        for (let i = this.Stations.length - 1; i >= 0; i--)
            this.Stations[i].ProcessEvent(Station.Event.MeStarted)
    }

    OnMeFinishedSending() {
        //the stations heard my CQ and want to call
        /*   if (! (DEFAULT.RUNMODE === RunMode.Single || DEFAULT.RUNMODE === RunMode.Hst)) 
     
             if ( MyStation._Msg.include(StationMessage.CQ)) ||
                ((this.QsoList.length === 0) && (this.MyStation._Msg.include(StationMessage.TU ) &&
                 (this.MyStation._Msg.include(StationMessage.MyCall) ))) 
             for (let i=0; random.RndPoisson(this.Activity / 2)) this.Stations.AddCaller();
         */
        // tell callers that I finished sending
        for (let i = this.Stations.length - 1; i >= 0; i--)
            this.Stations[i].ProcessEvent(Station.Event.MeFinished)
    }

}

export const Tst = new Contest()