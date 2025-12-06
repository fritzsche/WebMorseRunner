import { AudioMessage, DEFAULT, OperatorState, RunMode, StationMessage } from "./defaults.js"

import { Modulator } from "./modulator.js"
import { Volume } from "./volume.js"
import { MovAvg } from "./movavg.js"
import { Station } from "./station.js"
import { DxStation } from "./dxstation.js"
import * as random from "./random.js"
import { MyStation } from "./mystation.js"
import { QrnStation } from "./qrnstation.js"
import { QrmStation } from "./qrmstation.js"

export class Contest {
    constructor() {
        // singleton 
        if (Contest._instance) {
            return Contest._instance
        }
        Contest._instance = this
        this.init()
    }

    init() {
        this.BlockNumber = 0
        this._targetRate = DEFAULT.RATE
        this._src_buffer_size = DEFAULT.BUFSIZE
        this._Filter1 = new MovAvg()
        //    this._Filter2 = new MovAvg()
        // setup Filter
        this._Filter1.points = Math.round(
            0.7 * DEFAULT.RATE / DEFAULT.BANDWIDTH,
        )
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
        this._Agc.AttackSamples = Math.round(DEFAULT.RATE * 0.014) // AGC attack 5 ms
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
            Im: new Float32Array(this._src_buffer_size),
        }

        this._MyStation = new MyStation()

        this._dx_count = 0
        this.Stations = new Array()
        this.RitPhase = 0
        this.running = false

        this.Smg = 1
        this.qsk = false
    }

    set processor(p) {
        this._processor = p
    }

    reset() {
        this._dx_count = 0
        this.Stations = new Array()
    }

    updateConfig(conf) {
        this._conf = conf

        // MyCall
        if (DEFAULT.CALL !== conf.my_call) {
            DEFAULT.CALL = conf.my_call
            this._MyStation.Call = DEFAULT.CALL
        }

        // MyExchange
        if (conf.contest_id) {
            const contest_data = conf.contest[conf.contest_id]
            if (contest_data) {
                const exchange1 = contest_data.exchange1
                if (exchange1) this._MyStation.exchange1 = exchange1
                //     console.log(exchange1)
                const exchange_msg = contest_data.exchange_msg
                if (exchange_msg) Station.contestExchangeMessage = exchange_msg
            }
        }

        // Contest specific messages
        const active_contest = conf.active_contest

        if (active_contest) Station.Messages = { ...Station.Messages, ...active_contest.contest_messages }

        // WPM
        if (DEFAULT.WPM !== conf.wpm) {
            DEFAULT.WPM = conf.wpm
            this._MyStation.Wpm = DEFAULT.WPM
        }

        // Pitch / Bandwidth
        if (
            DEFAULT.PITCH !== conf.pitch ||
            DEFAULT.BANDWIDTH !== conf.rx_bandwidth
        ) {
            DEFAULT.PITCH = conf.pitch
            DEFAULT.BANDWIDTH = conf.rx_bandwidth
            this._MyStation.Pitch = DEFAULT.PITCH
            this._Modul.carrierFreq = DEFAULT.PITCH

            // update filter bandwidth
            this._Filter1.points = Math.round(
                0.7 * DEFAULT.RATE / DEFAULT.BANDWIDTH,
            )
            this._Filter1.gainDb = 10 * Math.log10(500 / DEFAULT.BANDWIDTH)
        }

        // update qsk setting in contest
        this.qsk = conf.qsk

        // Update volume
        this.Smg = Math.pow(10, (conf.volume - 0.75) * 4)

        // RIT
        if (DEFAULT.RIT !== conf.rit) {
            DEFAULT.RIT = conf.rit
        }

        // Runmode
        if (DEFAULT.RUNMODE !== conf.runmode) {
            DEFAULT.RUNMODE = conf.runmode
        }

        // Band Activity
        if (DEFAULT.ACTIVITY !== conf.activity) {
            DEFAULT.ACTIVITY = conf.activity
        }

        if (DEFAULT.QSB !== conf.qsb) DEFAULT.QSB = conf.qsb
        if (DEFAULT.QRN !== conf.qrn) DEFAULT.QRN = conf.qrn
        if (DEFAULT.QRM !== conf.qrm) DEFAULT.QRM = conf.qrm
        if (DEFAULT.LIDS !== conf.lids) DEFAULT.LIDS = conf.lids
        if (DEFAULT.FLUTTER !== conf.flutter) DEFAULT.FLUTTER = conf.flutter

    }

    onmessage = (message) => {
        switch (message.type) {
            case AudioMessage.abort_sending:
                this._MyStation.AbortSend()
                break
            case AudioMessage.start_contest:
                this.init()
                this.running = true
                this.updateConfig(message.data)
                break
            case AudioMessage.update_call:            
                this._MyStation.UpdateCall(message.data)
                break                
            case AudioMessage.stop_contest:
                this.init()
                this.running = false
                Tst.post({
                    type: AudioMessage.stop_tx,
                })                
                break
            case AudioMessage.update_nr:
                this._MyStation.NR = message.data
                break
            case AudioMessage.create_dx:
                // this is a lock to avoid more dx stations created (Android)
                this._dx_requested = false
                if (DEFAULT.RUNMODE === RunMode.Single || DEFAULT.RUNMODE === RunMode.Hst) this._MyStation._Msg = [StationMessage.CQ]
                message.data.forEach((call) => {
                    const dx = new DxStation(call)
                    this.Stations.push(dx)
                    dx.ProcessEvent(Station.Event.MeFinished)
                })

                break
            case AudioMessage.create_qrm:
                const qrm = new QrmStation(message.data)
                this.Stations.push(qrm)
                break

            case AudioMessage.send_msg:
                this._MyStation.SendMsg(message.data)
                break

            case AudioMessage.send_his:
                this._MyStation.HisCall = message.data
                this._MyStation.SendMsg(StationMessage.HisCall)
                break
            case AudioMessage.send_exchange:
                this._MyStation.exchange1 = message.data
                this._MyStation.SendMsg(StationMessage.Exchange1)
                break
            case AudioMessage.config:
                this.updateConfig(message.data)
                break
            default:
                console.log("ERROR: Unknown: ", message)
        }
    };

    static noise_amp = 6000
    _complex_noise = (complex_buffer) => {

        for (let i = 0; i < this._src_buffer_size; i++) {
            complex_buffer.Re[i] = 3 * Contest.noise_amp * (Math.random() - 0.5)
            complex_buffer.Im[i] = 3 * Contest.noise_amp * (Math.random() - 0.5)
        }
    };

    _getSrcBlock() {
        this.BlockNumber++
        this._complex_noise(this._src_complex_buffer)

        // QRN
        if (DEFAULT.QRN) {
            // background
            for (let i = 0; i < this._src_complex_buffer.Re.length; i++)
                if (Math.random() < 0.01) this._src_complex_buffer.Re[i] = 60 * Contest.noise_amp * (Math.random() - 0.5)
            //burst
            if (Math.random() < 0.01) this.Stations.push(new QrnStation())

        }

        if (DEFAULT.QRM && Math.random() < 0.002)
            this.post({ type: AudioMessage.request_qrm, })

        for (let Stn = 0; Stn < this.Stations.length; Stn++) {
            if (this.Stations[Stn].State === Station.State.Sending) {
                let Blk = this.Stations[Stn].GetBlock()
                for (let i = 0; i < Blk.length; i++) {
                    let Bfo = this.Stations[Stn].Bfo - this.RitPhase -
                        i * Math.PI * 2 * DEFAULT.RIT / DEFAULT.RATE
                    this._src_complex_buffer.Re[i] =
                        this._src_complex_buffer.Re[i] + Blk[i] * Math.cos(Bfo)
                    this._src_complex_buffer.Im[i] =
                        this._src_complex_buffer.Im[i] - Blk[i] * Math.sin(Bfo)
                }
            }
        }
        // Rit
        this.RitPhase = this.RitPhase +
            DEFAULT.BUFSIZE * Math.PI * 2 * DEFAULT.RIT / DEFAULT.RATE
        while (this.RitPhase > Math.PI * 2) {
            this.RitPhase = this.RitPhase - Math.PI * 2
        }
        while (this.RitPhase < -Math.PI * 2) {
            this.RitPhase = this.RitPhase + Math.PI * 2
        }

        let blk = this._MyStation.GetBlock()
        let Rfg = 1

        if (blk && blk !== null) {
            for (let n = 0; n < blk.length; n++) {
                if (this.qsk) {
                    if (Rfg > (1 - blk[n] / this._MyStation.Amplitude)) {
                        Rfg = 1 - blk[n] / this._MyStation.Amplitude
                    } else Rfg = Rfg * 0.997 + 0.003
                    this._src_complex_buffer.Re[n] = this.Smg * blk[n] +
                        Rfg * this._src_complex_buffer.Re[n]
                    this._src_complex_buffer.Im[n] = this.Smg * blk[n] +
                        Rfg * this._src_complex_buffer.Im[n]
                } else {
                    this._src_complex_buffer.Im[n] = this.Smg * blk[n]
                    this._src_complex_buffer.Re[n] = this.Smg * blk[n]
                }
            }
        }

        this._Filter1.Filter(this._src_complex_buffer)
        let result = this._Modul.Modulate(this._src_complex_buffer)
        result = this._Agc.Process(result)

        //timer tick
        this._MyStation.Tick()

        const all_stations = this.Stations.length
        // Filter all Dane and Failed Stations
        this.Stations = this.Stations.filter((Stn) => {
            return !Stn.isDone()
        })

        /*        // Filter all the Done Stations
                this.Stations = this.Stations.filter((Stn) => {
                    return !(Stn instanceof DxStation)  || Stn.Oper.State !== OperatorState.Done
                })
        */
        const delta = all_stations - this.Stations.length

        if (delta > 0) this.post({
            type: AudioMessage.update_pileup,
            data: this.countDXStations(),
        })

        this._dx_count = this.Stations.length

        for (let Stn = this.Stations.length - 1; Stn >= 0; Stn--) {
            this.Stations[Stn].Tick()
        }
        if (DEFAULT.RUNMODE == RunMode.Single && this._dx_count === 0 && !this._dx_requested) {
            this._dx_requested = true
            this.post({
                type: AudioMessage.request_dx,
                data: 1,
            })
        }

        // Hst has pile-up of 4
        
        if (DEFAULT.RUNMODE == RunMode.Hst && this._dx_count < 4 && !this._dx_requested) {
            this._dx_requested = true
            this.post({
                type: AudioMessage.request_dx,
                data: 1,
            })            
        }




        // copy in this._src_buffer
        for (let i = 0; i < result.length; i++) this._src_buffer[i] = result[i]
    }

    getBlock(block) {
        for (let i = 0; i < block.length; i++) {
            if (this._src_pos === 0) this._getSrcBlock()
            block[i] = this._src_buffer[this._src_pos] / 32800
            this._src_pos++
            if (this._src_pos >= this._src_buffer.length) this._src_pos = 0
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
        for (let i = this.Stations.length - 1; i >= 0; i--) {
            this.Stations[i].ProcessEvent(Station.Event.MeStarted)
        }
    }

    countDXStations() {
        let result = 0
        for (let i = 0; i < this.Stations.length; i++)
            if (this.Stations[i] instanceof DxStation) result++
        return result
    }

    OnMeFinishedSending() {
        //the stations heard my CQ and want to call
        if (
            !(DEFAULT.RUNMODE === RunMode.Single ||
                DEFAULT.RUNMODE === RunMode.Hst)
        ) {
            if (
                this._MyStation._Msg.includes(StationMessage.CQ) ||
                ( /*(this.QsoList.length === 0) &&*/
                    (this._MyStation._Msg.includes(StationMessage.TU) &&
                        (this._MyStation._Msg.includes(StationMessage.MyCall))))
            ) {
                let number_of_calls = random.RndPoisson(DEFAULT.ACTIVITY / 2)
                if (number_of_calls > 0) {
                    this.post({
                        type: AudioMessage.request_dx,
                        data: number_of_calls,
                    })
                }
            }
        }
        // for (let i=0; random.RndPoisson(this.Activity / 2)) this.Stations.AddCaller();

        // tell callers that I finished sending
        for (let i = this.Stations.length - 1; i >= 0; i--) {
            let stn = this.Stations[i]
            stn.ProcessEvent(Station.Event.MeFinished)
            if (stn instanceof DxStation && stn.Oper.State === OperatorState.Done) {
                this.post({
                    type: AudioMessage.check_log,
                    data: {
                        call: stn.MyCall,
                        NR: stn.NR,
                        RST: stn.RST,
                        Ex: stn.getExchange(),
                    },
                })
            }
        }
    }
}

export const Tst = new Contest()
