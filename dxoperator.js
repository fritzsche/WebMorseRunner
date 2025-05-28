import { DEFAULT, StationMessage, OperatorState, RunMode } from "./defaults.js"
import * as random from './random.js'
import { Tst } from "./contest.js"

const NEVER = Number.MAX_SAFE_INTEGER
const FULL_PATIENCE = 5

export class DxOperator {
    constructor(call) {
        this.Call = call
        this.Skills = 0
        this.Patience = FULL_PATIENCE
        this.RepeatCnt = 1
        this.State = OperatorState.Done
    }

    static CallCheckResult = {
        No: 0,
        Yes: 1,
        Almost: 2
    }

    static IsMyCall(My, His) {
        const W_X = 2
        const W_Y = 2
        const W_D = 2

        let C0 = My
        let C = His

        let result = this.CallCheckResult.No
        let M = Array.from(Array(C.length + 1), () => new Array(C0.length + 1))

        for (let y = 0; y < C0.length + 1; y++) M[0][y] = 0
        for (let x = 1; x < C.length + 1; x++) M[x][0] = M[x - 1][0] + W_X

        // levenshtein distance
        for (let x = 1; x < C.length + 1; x++)
            for (let y = 1; y < C0.length + 1; y++) {
                let T = M[x][y - 1]
                //'?' can match more than one char
                //end may be missing
                if ((x < C.length) && (C[x - 1] !== '?')) T += W_Y

                let L = M[x - 1][y]
                //'?' can match no chars  
                if (C[x - 1] !== '?') L += W_X

                let D = M[x - 1][y - 1]
                //'?' matches any char
                if (!(C[x - 1] === C0[y - 1] || (C[x - 1] === '?'))) D += W_D
                M[x][y] = Math.min(T, D, L)
            }

        //classify by penalty
        const lev = M[C.length][C0.length]
        switch (lev) {
            case 0:
                result = this.CallCheckResult.Yes
                break
            case 1: 
            case 2:
                result = this.CallCheckResult.Almost
                break
            default:
                result = this.CallCheckResult.No
        }

        // callsign-specific corrections
        // if too short change an "almost" to "no"
        if (!DEFAULT.LIDS && C.length === 2 && result === DxOperator.CallCheckResult.Almost)
            result = DxOperator.CallCheckResult.No

        // partial and wildcard match result in 0 penalty but are not exact matches
        if (result === DxOperator.CallCheckResult.Yes)
            if (C.length !== C0.length || C.indexOf('?') > -1)
                result = DxOperator.CallCheckResult.Almost

        // partial match too short
        const no_questionmark = C.replaceAll('?', '')
        if (no_questionmark.length < 2) result = this.CallCheckResult.No

        // accept a wrong call, or reject the correct one        
        if (DEFAULT.LIDS && C.length > 3)
            switch (result) {
                case DxOperator.CallCheckResult.Yes:
                    if (Math.random() < 0.01) result = DxOperator.CallCheckResult.Almost
                    break
                case DxOperator.CallCheckResult.Almost:
                    if (Math.random() < 0.04) result = DxOperator.CallCheckResult.Yes
                    break
            }

        return result
    }



    get Wpm() {
        if (DEFAULT.RUNMODE === RunMode.Hst) return DEFAULT.WPM
        else return Math.round(DEFAULT.WPM * 0.5 * (1 + Math.random()))
    }


    get NR() {
        return 1 + Math.round(Math.random() * Tst.Minute * this.Skills)
    }

    // Process an incoming message
    MsgReceived(AMsg) {
        if (AMsg.includes(StationMessage.CQ)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedQso:
                    this._DecPatience()
                    break
                case OperatorState.NeedNr:
                case OperatorState.NeedCall:
                case OperatorState.NeedCallNr:
                    this.State = OperatorState.Failed
                    break
                case OperatorState.NeedEnd:
                    this.State = OperatorState.Done
                    break
            }
            return
        }
        if (AMsg.includes(StationMessage.Nil)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedQso:
                    this._DecPatience()
                    break
                    0
                case OperatorState.NeedNr:
                case OperatorState.NeedCall:
                case OperatorState.NeedCallNr:
                case OperatorState.NeedEnd:
                    this.State = OperatorState.Failed
                    break
            }
            return
        }
        // we got a call and check if this is dx stations call
        if (AMsg.includes(StationMessage.HisCall)) {
            switch (DxOperator.IsMyCall(this.Call, Tst._MyStation.HisCall)) {
                case DxOperator.CallCheckResult.Yes:
                    if (this.State === OperatorState.NeedPrevEnd ||
                        this.State === OperatorState.NeedQso)
                        this._SetState(OperatorState.NeedNr)
                    else if (this.State === OperatorState.NeedCallNr)
                        this._SetState(OperatorState.NeedNr)
                    else if (this.State === OperatorState.NeedCall)
                        this._SetState(OperatorState.NeedEnd)
                    break
                case DxOperator.CallCheckResult.Almost:
                    if (this.State === OperatorState.NeedPrevEnd ||
                        this.State === OperatorState.NeedQso)
                        this._SetState(OperatorState.NeedCallNr)
                    else if (this.State === OperatorState.NeedNr) this._SetState(OperatorState.NeedCallNr)
                    else if (this.State === OperatorState.NeedEnd) this._SetState(OperatorState.NeedCall)
                    break
                case DxOperator.CallCheckResult.No:
                    if (this.State === OperatorState.NeedQso) this.State = OperatorState.NeedPrevEnd
                    else if (this.State === OperatorState.NeedNr ||
                        this.State === OperatorState.NeedCall ||
                        this.State === OperatorState.NeedCallNr) this.State = OperatorState.Failed
                    else if (this.State === OperatorState.NeedEnd) this.State = OperatorState.Done
                    break
            }
        }

        if (AMsg.includes(StationMessage.B4)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                case OperatorState.NeedQso:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedNr:
                case OperatorState.NeedEnd:
                    this._State = OperatorState.Failed
                    break
                case OperatorState.NeedCall:
                case OperatorState.NeedCallNr: 
                  break //same state: correct the call

            }
        }

        if (AMsg.includes(StationMessage.NR)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    break
                case OperatorState.NeedQso:
                    this.State = OperatorState.NeedPrevEnd
                    break
                case OperatorState.NeedNr:
                    if (Math.random() < 0.9 || DEFAULT.RUNMODE === RunMode.Hst)
                        this._SetState(OperatorState.NeedEnd)
                    break
                case OperatorState.NeedCall:
                    break
                case OperatorState.NeedCallNr:
                    if (Math.random() < 0.9 || DEFAULT.RUNMODE === RunMode.Hst)
                        this._SetState(OperatorState.NeedCall)
                    break
                case OperatorState.NeedEnd:
                    break
            }
        }

        if (AMsg.includes(StationMessage.TU)) {
            switch (this.State) {
                case OperatorState.NeedPrevEnd:
                    this._SetState(OperatorState.NeedQso)
                    break
                case OperatorState.NeedEnd:
                    this.State = OperatorState.Done
                    break
                default: break
            }
        }

        if (!DEFAULT.LIDS && AMsg.includes(StationMessage.Garbage))
            this._State = OperatorState.NeedPrevEnd


        if (this.State !== OperatorState.NeedPrevEnd) this._DecPatience()

    }

    _SetState(AState) {
        this.State = AState
        if (AState === OperatorState.NeedQso)
            this.Patience = Math.round(random.RndRayleigh(4))
        else this.Patience = FULL_PATIENCE

        // on pile up and other repeat sometimes (not HST)
        if (AState === OperatorState.NeedQso && 
            (! (DEFAULT.RUNMODE === RunMode.Single || DEFAULT.RUNMODE === RunMode.Hst)) && 
            (Math.random() < 0.1)) this.RepeatCnt = 2
            else this.RepeatCnt = 1

    }

    _DecPatience() {
        if (this.State === OperatorState.Done) return
        this.Patience--
        if (this.Patience < 1) this.State = OperatorState.Failed
    }

    // Delay before reply, keying speed and exchange number are functions
    // of the operator's skills      
    GetSendDelay() {
        let result = 0
        if (this.State === OperatorState.NeedPrevEnd)
            result = NEVER
        else if (DEFAULT.RUNMODE === RunMode.Hst) {
            result = random.SecondsToBlocks(0.05 + 0.5 * Math.random() * 10 / this.Wpm)
        } else result = random.SecondsToBlocks(0.1 + 0.5 * Math.random())
        /*  if(result <= 0 || result > 200) debugger;        */
        return result
    }

    GetReplyTimeout() {
        let result = 0
        if (DEFAULT.RUNMODE === RunMode.Hst)
            result = random.SecondsToBlocks(60 / this.Wpm)
        else result = random.SecondsToBlocks(6 - this.Skills)
        result = Math.round(random.RndGaussLim(result, result / 2))
        /*  if(result <= 0 || result > 200) debugger;     */
        return result
    }

    GetReply() {
        switch (this.State) {
            case OperatorState.NeedPrevEnd:
            case OperatorState.Done:
            case OperatorState.Failed:
                return StationMessage.None
            case OperatorState.NeedQso:
                return StationMessage.MyCall
            case OperatorState.NeedNr:
                if (this.Patience === (FULL_PATIENCE - 1) || (Math.random() < 0.3))
                    return StationMessage.NrQm
                else return StationMessage.Agn
                break
            case OperatorState.NeedCall:
                if ((DEFAULT.RUNMODE === RunMode.Hst) || (Math.random() > 0.5))
                    return StationMessage.DeMyCallNr1
                else if (Math.random() > 0.25) return StationMessage.DeMyCallNr2
                else return StationMessage.MyCallNr2
                break
            case OperatorState.NeedCallNr:
                if ((DEFAULT.RUNMODE === RunMode.Hst) || (Math.random() > 0.5))
                    return StationMessage.DeMyCall1
                else return StationMessage.DeMyCall2
                break
            default: //osNeedEnd:
                if (this.Patience < (FULL_PATIENCE - 1)) return StationMessage.NR
                else if ((DEFAULT.RUNMODE === RunMode.Hst) || (Math.random() < 0.9))
                    return StationMessage.R_NR
                else StationMessage.R_NR2
                break
        }
    }
}