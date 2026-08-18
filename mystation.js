import { Keyer } from "./keyer.js"
import { DEFAULT, StationMessage, RunMode, AudioMessage } from "./defaults.js"
import { Station } from "./station.js"
import { Tst } from "./contest.js"

export class MyStation extends Station {
    constructor() {
        super()
        this.Pieces = new Array()
        this.PieceMsgs = new Array()
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
        const sendHis = this.PieceMsgs.includes(StationMessage.HisCall)
        const sendNr = this.PieceMsgs.some(
            (m) => MyStation.NrMessages.includes(m))

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
        this.PieceMsgs = new Array()
        this.State = Station.State.Listening //State.Listening
        this.ProcessEvent(Event.MsgSent)
    }


    SendMsg(AMsg) {
        // remember which message the pieces being added belong to,
        // so an aborted send can tell the UI what was not sent
        this._PieceMsg = AMsg
        super.SendMsg(AMsg)
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
            this.PieceMsgs.push(this._PieceMsg)
            this.Pieces.push('@')  //his callsign indicator
            this.PieceMsgs.push(StationMessage.HisCall)
            AMsg = AMsg.substr(p + 5, AMsg.length)
            p = AMsg.indexOf('<his>')
        }
        this.Pieces.push(AMsg)
        this.PieceMsgs.push(this._PieceMsg)

        for (let i = this.Pieces.length - 1; i >= 0; i--)
            if (this.Pieces[i] === '') {
                this.Pieces.splice(i, 1)
                this.PieceMsgs.splice(i, 1)
            }

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


    UpdateCall(call) {
        let canUpdateCall = false
        // the callsign is being keyed right now: try to patch the envelope on the fly
        if ((this.Pieces.length > 0) && (this.Pieces[0] === Station.Messages.HisCall)
            && this._Envelope) {
            //create new envelope
            const NewEnvelope = super.generateEnvelope(Keyer.Encode(call))
            canUpdateCall = true
            // verify the send buffer
            for (let i = 0; i < this._SendPos; i++) {
                if (NewEnvelope[i] !== this._Envelope[i]) {
                    canUpdateCall = false
                    break
                }
            }
            if (canUpdateCall) {
                this._Envelope = NewEnvelope
                this.HisCall = call
            }
        }
        //could not correct the current message
        //but another call is scheduled for sending
        if (!canUpdateCall) {
            for (let i = 0; i < this.Pieces.length; i++) {
                if (this.Pieces[i] === Station.Messages.HisCall) {
                    canUpdateCall = true
                    this.HisCall = call
                    break

                }
            }
        }
        Tst.post({
            type: AudioMessage.update_call,
            data: canUpdateCall
        })
    }

    // messages that carry the exchange / serial number
    static NrMessages = [
        StationMessage.NR, StationMessage.Exchange1, StationMessage.MyExchange,
        StationMessage.R_NR, StationMessage.R_NR2,
        StationMessage.DeMyCallNr1, StationMessage.DeMyCallNr2,
        StationMessage.MyCallNr2,
    ]

    GetBlock() {
        let result = super.GetBlock()
        if (this._Envelope === null  || this._Envelope === undefined) {

            this.Pieces.shift()
            this.PieceMsgs.shift()
            if (this.Pieces.length > 0) {
                this._SendNextPiece()
                //cursor to exchange field
                Tst.post({ type: AudioMessage.advance })
            } else {
                if (this.TX) {
                    Tst.post({
                        type: AudioMessage.stop_tx,
                    })
                    this.TX = false
                }
            }

        } else {
            if (this.TX === false) { //this._Envelope !== undefined &&
                Tst.post({
                    type: AudioMessage.start_tx,
                })
                this.TX = true

            }
        }
        return result
    }


}