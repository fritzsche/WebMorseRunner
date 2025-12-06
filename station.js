import { Keyer } from "./keyer.js"
import { DEFAULT, RunMode, StationMessage } from "./defaults.js"
import { Contest } from "./contest.js"

let GKeyer = new Keyer()


export class Station {
    static NEVER = Number.MAX_VALUE
    // States 
    static State = {
        Listening: 1,
        Copying: 2,
        PreparingToSend: 3,
        Sending: 4
    }

    static Messages = {
        CQ: 'CQ <my> TEST',
        NR: '<#>',
        TU: 'TU',
        MyCall: '<my>',
        HisCall: '@',
        B4: 'QSO B4',
        Qm: '?',
        Nil: 'NIL',
        R_NR: 'R <#>',
        R_NR2: 'R <#> <#>',
        DeMyCall1: 'DE <my>',
        DeMyCall2: 'DE <my> <my>',
        DeMyCallNr1: 'DE <my> <#>',
        DeMyCallNr2: 'DE <my> <my> <#>',
        NrQm: 'NR?',
        LongCQ: 'CQ CQ TEST <my> <my> TEST',
        Qrl: 'QRL?',
        Qrl2: 'QRL?   QRL?',
        Qsy: '<his>  QSY QSY',
        Agn: 'AGN',
    }

    // Events
    static Event = {
        Timeout: 1,
        MsgSent: 2,
        MeStarted: 3,
        MeFinished: 4
    }

    static contestExchangeMessage = '<rst><nr>'
    

    constructor() {
        this._FBfo = 0
        this._dPhi = 0
        this.Wpm = 20
        this.Amplitude = 300000
        this._NrWithError = false
        this.MyCall = 'DJ1TF'
        this.HisCall = 'JJ1QPB'
        this.NR = 1
        this.RST = 599
        this._Msg = new Array()
        this.TimeOut = Station.NEVER
        GKeyer.rate = DEFAULT.RATE
        this.State = Station.State.Listening
        this._SendPos = 0
        this.done = false
        this.custom_messages = {}
        this.Messages = { ...Station.Messages, ...this.custom_messages }
        this.exchange1 = ''
        this.exchange_msg = ''
        this.All_DxData = []

        this.TX = false
        this.exchange1 = ''
        this.exchange2 = ''

    }

    get Bfo() {
        let result = this._FBfo
        this._FBfo = this._FBfo + this._dPhi
        if (this._FBfo > Math.PI * 2) this._FBfo -= Math.PI * 2
        return result
    }

    SendMsg(AMsg) {
        this.getExchange()        
        if (!this._Envelope) this._Msg = new Array()
        if (AMsg === StationMessage.None) {
            this._State = State.Listening
            return
        }
        this._Msg.push(AMsg)
        const text = Station.Messages[AMsg]
        if (text) this.SendText(text)
    }

    SendText(AMsg) {        
        AMsg = AMsg.replaceAll('<#>', this.composeExchange())
        AMsg = AMsg.replaceAll('<my>', this.MyCall)

        AMsg = AMsg.replaceAll('<1>', this.exchange1)   
 
        if (this.MsgText) {
            this.MsgText += ' ' + AMsg
        } else { this.MsgText = AMsg }
        this.SendMorse(Keyer.Encode(this.MsgText))
    }

    SendMorse(AMorse) {
        if (!this._Envelope) {
            this._SendPos = 0
            this._FBfo = 0
        }

        GKeyer.Wpm = this.Wpm
        GKeyer.MorseMsg = AMorse
        this._Envelope = GKeyer.GetEnvelope()
        for (let i = 0; i < this._Envelope.length; i++) this._Envelope[i] *= this.Amplitude

        this.State = Station.State.Sending
        this.TimeOut = Station.NEVER
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
        this._SendPos += DEFAULT.BUFSIZE
        if (this._SendPos >= this._Envelope.length) this._Envelope = null
        return result
    }

    set Pitch(Value) {
        this._FPitch = Value
        this._dPhi = Math.PI * 2 * this._FPitch / DEFAULT.RATE
    }


    Tick() {
        // just finished sending
        if (this.State === Station.State.Sending && this._Envelope === null) {
            this.MsgText = ''
            this.State = Station.State.Listening
            this.ProcessEvent(Station.Event.MsgSent)
        }
        // check timeout
        else if (this.State !== Station.State.Sending) {
            if (this.TimeOut > 0) this.TimeOut--
            if (this.TimeOut === 0) this.ProcessEvent(Station.Event.Timeout)
        }
    }


    composeExchange() {
        const contest = new Contest()
        const exchange = contest._conf.active_contest.exchange_msg

        if (!exchange || exchange === '<rst><nr>') return Station.NrAsText(this.RST, this.NR)
        let result = exchange
        const rst_txt = Station.RstAsText(this.RST)
        result = result.replaceAll('<rst>', rst_txt)
        if(this.exchange1) result = result.replaceAll('<1>', this.exchange1) 
        if(this.exchange2) result = result.replaceAll('<2>', this.exchange2) 
        return result
    }


    getExchange() {
        const contest = new Contest()
        let exchange = contest._conf.active_contest.exchange_msg       
        if (!exchange) exchange = '<rst><nr>' 
     //  "abcdeabcde".split(/(d)/)
        const split_ex = exchange.split(/(?=\<)/)

        let result = []
        split_ex.forEach( ex => {
            switch(ex) {
                case '<rst>': result.push('599')
                   break
                case '<1>': result.push(this.exchange1)
                   break
                case '<2>': result.push(this.exchange2)
                   break
                case '<nr>': result.push(String(this.NR).padStart(3, "0"))
                   break;
            }
            result.push
        })
        return result
    }


    static RstAsText(rst) {
        // convert rst to string
        let rst_str = rst.toString().padStart(3, '0')
        let result = `${rst_str}`
        result = result.replaceAll('599', '5NN')
        return result
    }



    static NrAsText(rst, nr) {
        // convert rst to string
        let rst_str = rst.toString().padStart(3, '0')
        // convert NR to string
        let nr_str = nr.toString().padStart(3, '0')
        // return combination like: "599001" without space
        let result = `${rst_str}${nr_str}`
        // lids might cause errors.
        if (this._NrWithError) {
            let Idx = result.length - 1
            if (!/[2-7]/.test(result[Idx])) Idx--
            if (/[2-7]/.test(result[Idx])) {
                let code = result.charCodeAt(Idx)
                if (Math.random() < 0.5) code--; else code++

                result = result.substring(0, Idx) + String.fromCharCode(code) + result.substring(Idx + 1)
                result += `EEEEE ${nr_str}`
            }
        }
        // flip 599 in 5NN
        result = result.replaceAll('599', '5NN')
        if (DEFAULT.RUNMODE !== RunMode.Hst) {
            result = result.replaceAll('000', 'TTT')
            result = result.replaceAll('00', 'TT')
            if (Math.random() < 0.4) {
                result = result.replaceAll('0', 'O')
            } else if (Math.random() < 0.97) {
                result = result.replaceAll('0', 'T')
            }
            if (Math.random() < 0.97) {
                result = result.replaceAll('9', 'N')
            }
        }
        return result
    }

    isDone() {
        return this.done
    }


}
