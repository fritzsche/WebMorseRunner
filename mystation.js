
import { DEFAULT, StationMessage, RunMode, AudioMessage } from "./defaults.js"
import { Station } from "./station.js"
import { Tst } from "./contest.js"

export class MyStation extends Station {
    constructor() {
        super()
        this.Pieces = new Array()
        this.Init()
    }

    Init() {
        this.MyCall = DEFAULT.CALL
        this.NR = 1
        this.RST = 599
        this.Pitch = DEFAULT.PITCH
        this.Wpm = DEFAULT.WPM
        this.Amplitude = 300000
    }

    AbortSend() {
        const sendHis = this.Pieces.includes(Station.Messages.HisCall) ? true : false
        const sendNr = this.Pieces.includes(Station.Messages.HisCall) ? true : false

        Tst.post({
            type: AudioMessage.abort_sending,
            data: {
                sendHis: sendHis,
                sendNr: sendNr
            }
        })

        this._Envelope = new Array()
        this._Msg = [StationMessage.Garbage]
        this.MsgText = ''
        this.Pieces = new Array()
        this.State = Station.State.Listening //State.Listening
        this.ProcessEvent(Event.MsgSent)
    }


    SendText(AMsg) {
        this._AddToPieces(AMsg)
        if (this.State !== Station.State.Sending) {
            this._SendNextPiece()
            Tst.OnMeStartedSending()
        }
    }

    set Call(c) {
        this.MyCall = c
    }

    ProcessEvent(AEvent) {
        if (AEvent === Station.Event.MsgSent) Tst.OnMeFinishedSending()
    }

    _AddToPieces(AMsg) {
        //split into pieces
        //special processing of callsign
        let p = AMsg.indexOf('<his>')
        while (p >= 0) {

            this.Pieces.push(AMsg.substr(1, p - 1))
            this.Pieces.push('@')  //his callsign indicator
            AMsg = AMsg.substr(p + 5, AMsg.length)
            p = AMsg.indexOf('<his>')
        }
        this.Pieces.push(AMsg)

        for (let i = this.Pieces.length - 1; i >= 0; i--)
            if (this.Pieces[i] === '') this.Pieces.splice(i, 1)

    }

    _SendNextPiece() {
        this.MsgText = ''
        if (this.Pieces[0] !== '@')
            super.SendText(this.Pieces[0])
        else
            //            if ( /*CallsFromKeyer && */
            //                (!(DEFAULT.RUNMODE === RunMode.Hst
            //                   || DEFAULT.RUNMODE === RunMode.Wpx)))
            //               super.SendText(' ')
            //           else */

            super.SendText(this.HisCall)
    }

    GetBlock() {
        let result = super.GetBlock()
        if (this._Envelope === null) {

            this.Pieces.shift()
            if (this.Pieces.length > 0) {
                this._SendNextPiece()
                //cursor to exchange field
                Tst.post({ type: AudioMessage.advance })
            }
        }
        return result
    }


}