import { DEFAULT, StationMessage, RunMode, OperatorState } from "./defaults.js"
import { Station } from "./station.js"
import { DxOperator } from "./dxoperator.js"
import * as random from './random.js'
import { Tst } from "./contest.js"
import { Qsb } from "./qsb.js"


export class DxStation extends Station {
  constructor(call) {
    super()
    this.All_DxData = call
    this.MyCall = call[0]
    this.HisCall = DEFAULT.CALL
    this.Oper = new DxOperator(this.MyCall)
    this.Oper.Skills = random.RndIntInclusive(1, 3)
    this.Oper._SetState(OperatorState.NeedPrevEnd)
    this.Wpm = this.Oper.Wpm
    this.NR = this.Oper.NR

    if (call[1]) this.exchange1 = call[1]
    if (call[2]) this.exchange2 = call[2]

    if (DEFAULT.QSB || DEFAULT.FLUTTER) {
      this.Qsb = new Qsb()
      if (DEFAULT.QSB) this.Qsb.Bandwidth = 0.1 + Math.random() / 2
      if (DEFAULT.FLUTTER && Math.random() < 0.3) {
        this.Qsb.Bandwidth = 3 + Math.random() * 30
      }
    }

    this.NrWithError = DEFAULT.LIDS && (Math.random() < 0.1)

    if (DEFAULT.LIDS && (Math.random() < 0.03))
      this.RST = 559 + 10 * random.RandomInt(0, 4)
    else this.RST = 599


    this.Amplitude = 9000 + 18000 * (1 + random.RndUShaped())
    this.Pitch = Math.round(random.RndGaussLim(0, 300))
    this.TimeOut = Station.NEVER
    this.State = Station.State.Copying
  }


  ProcessEvent(AEvent) {
    if (this.Oper.State === OperatorState.Done) return
    switch (AEvent) {
      case Station.Event.MsgSent:
        if (Tst._MyStation.State === Station.State.Sending)
          this.TimeOut = Station.NEVER
        else this.TimeOut = this.Oper.GetReplyTimeout()
        break
      case Station.Event.Timeout:
        // he did not reply, quit or try again
        if (this.State === Station.State.Listening) {
          this.Oper.MsgReceived([StationMessage.None])
          if (this.Oper.State === OperatorState.Failed) return
          this.State = Station.State.PreparingToSend
        }
        // preparations to send are done, now send
        if (this.State === Station.State.PreparingToSend)
          for (let i = 1; i <= this.Oper.RepeatCnt; i++) this.SendMsg(this.Oper.GetReply())
        break
      case Station.Event.Timeout:
        if (this.State === Station.State.Listening) {
          this.Oper.MsgReceived([StationMessage.None])
          if (Oper.State === OperatorState.Failed) return
          this.State = State.PreparingToSend
          //preparations to send are done, now send
          if (this.State = Station.State.PreparingToSend)
            for (let i = 1; i <= this.Oper.RepeatCnt; i++)
              this.SendMsg(this.Oper.GetReply)
        }
        break


      case Station.Event.MeFinished: // he finished sending
        // we notice the message only if we are not sending ourselves
        if (this.State !== Station.State.Sending) {
          //interpret the message
          switch (this.State) {
            case Station.State.Copying:
              this.Oper.MsgReceived(Tst._MyStation._Msg)
              break
            case Station.State.Listening:
            case Station.State.PreparingToSend:
              // these messages can be copied even if partially received
              if (Tst._MyStation._Msg.includes(StationMessage.CQ) ||
                Tst._MyStation._Msg.includes(StationMessage.TU) ||
                Tst._MyStation._Msg.includes(StationMessage.Nil))
                this.Oper.MsgReceived(Tst._MyStation._Msg)
              else this.Oper.MsgReceived([StationMessage.Garbage])
              break
          }

          //react to the message
          if (this.Oper.State === OperatorState.Failed)
            return        //give up
          else this.TimeOut = this.Oper.GetSendDelay() //reply or switch to standby
          this.State = Station.State.PreparingToSend
        }
        break
      case Station.Event.MeStarted:
        //If we are not sending, we can start copying
        //Cancel timeout, he is replying

        if (this.State !== Station.State.Sending)
          this.State = Station.State.Copying
        this.TimeOut = Station.NEVER
        break
    }
  }
  isDone() {
    return this.Oper.State === OperatorState.Done || this.Oper.State === OperatorState.Failed
  }

  GetBlock() {
    let result = super.GetBlock()
    if (DEFAULT.QSB || DEFAULT.FLUTTER) this.Qsb.ApplyTo(result)
    return result
  }


}