import { ContestDefinition } from "./contest-definition.js"
import { RunMode } from "./defaults.js"
import { Keyer } from "./keyer.js"

export class Log {

    static Check = {
        NIL: "Nil",
        NR: 'NR',
        RST: 'Rst',
        DUP: 'DUP',
        OK: ''
    }


    static std_log_header = [
        "UTC&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Call&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Recv&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Send&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Pref&nbsp;",
        "Chk&nbsp;",
    ]


    static hst_log_header = [
        "UTC&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Call&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Recv&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Send&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
        "Score&nbsp;",
        "Chk&nbsp;",
    ]

    constructor() {
        // singleton 
        if (Log._instance) {
            return Log._instance
        }
        Log._instance = this
        this._contestDefinition = new ContestDefinition()
        this.data = []
        this.NR = 1
        this.initScoreSets()
    }

    count_qso(t) {
        if (this.data.length > 0) {
            console.log(this.data)
        }
        // console.log(this)
        let count = 0
        for (const item of this.data) if (item.Clock > t) count++

        return count

    }

    initScoreSets() {
        this.Calls = new Set()
        this.Prefix = new Set()
        this.ConfCalls = new Set()
        this.ConfPrefix = new Set()
        this.HstRawScore = 0
        this.HstVerifiedScore = 0
    }

    wipe() {

        //       this.runmode = this._contestDefinition._contest.runmode
        this.runmode = ContestDefinition.getRunMode()



        this.data = []
        let table = document.querySelector('#log table')

        let table_hdr = document.querySelector('#log_hdr')

        let headers = Log.std_log_header
        if (this.runmode === RunMode.Hst) headers = Log.hst_log_header
        let header_items = ""
        headers.forEach(e => { header_items += `<th>${e}</th>` })
        table_hdr.innerHTML = header_items

        let row_no = table.rows.length
        for (let i = 1; i < row_no; i++) table.deleteRow(1)
        this.initScoreSets()
        this.updateScore()
        this.NR = 1
    }

    addQso(qso) {
        let complete_qso = qso
        let call = qso.Call
        let prefix = Log.ExtractPrefix(call)


        this.Calls.add(call)
        this.Prefix.add(prefix)
        this.updateScore()
        complete_qso.Check = Log.Check.NIL
        complete_qso.SendRST = '599'
        complete_qso.SendNr = String(this.NR).padStart(3, '0')

        // my own exchange
        const myexchange = this._contestDefinition.getMyExchange()
        complete_qso.SendExchange = myexchange

        if (this.runmode === RunMode.Hst) {
            const score = Log.callToScore(complete_qso.Call)
            complete_qso.Pref = score
            this.HstRawScore += score
        } else {
            complete_qso.Pref = prefix
        }
        this.NR++
        let log = document.getElementById("log")
        this.data.push(complete_qso)
        this.addTable(complete_qso)

        if (this.runmode === RunMode.Hst) {
            this.updateScore()
        }

    }


    checkQSO(qso) {
        // console.log("CHECK",qso)
        const call = qso.call
        const NR = String(qso.NR).padStart(3, '0')
        const last_qso = this.data[this.data.length - 1]
        const rst = (qso.RST ? qso.RST : 599).toString()
        let confirm = Log.Check.OK

        //        if (last_qso.RecvRST !== rst) confirm = Log.Check.RST
        //      if (last_qso.RecvNr !== NR) confirm = Log.Check.NR

        // check we have a last qso
        if (!last_qso) {
            return
        }

        /*
        console.log(last_qso)
        console.log(qso)
        last_qso.DX_Call = qso.call
        last_qso.DX_NR = qso.Ex.NR
         */


        const contestDefinition = new ContestDefinition()
        confirm = contestDefinition.checkExchange(last_qso.RecvExchange, qso.Ex)


        if (last_qso.Call !== call) confirm = Log.Check.NIL

        last_qso.Check = confirm

        if (confirm !== Log.Check.NIL) {
            const el = document.querySelector("#log > table tr:last-child td:last-child")
            el.innerText = confirm
        }

        if (confirm === Log.Check.OK) {
            this.ConfCalls.add(last_qso.Call)
            this.ConfPrefix.add(last_qso.Pref)
            if (this.runmode === RunMode.Hst) {
                const confPoint = parseInt(last_qso.Pref)
                this.HstVerifiedScore += confPoint
            }
            this.updateScore()
        }
    }

    static callToScore(call) {
        const morse = Keyer.Encode(call)
        let result = -1
        for (let i = 0; i < morse.length; i++) {
            switch (morse[i]) {
                case '.': result += 2
                    break
                case '-': result += 4
                    break
                case ' ': result += 2
                    break
            }
        }
        return result
    }

    updateScore() {
        let pts = this.Calls.size
        let multi = this.Prefix.size
        let score = pts * multi

        let conf_pts = this.ConfCalls.size
        let conf_multi = this.ConfPrefix.size
        let conf_score = conf_pts * conf_multi
        // Points 
        let pts_row = document.querySelector('.table_result tr:nth-child(2)')

        if (this.runmode === RunMode.Hst) {
            pts_row.querySelector('td:nth-child(1)').innerText = ''
            pts_row.querySelector('td:nth-child(2)').innerText = ''
            pts_row.querySelector('td:nth-child(3)').innerText = ''
        } else {
            pts_row.querySelector('td:nth-child(1)').innerText = 'Pts'
            pts_row.querySelector('td:nth-child(2)').innerText = pts
            pts_row.querySelector('td:nth-child(3)').innerText = conf_pts
        }
        // Multi
        let multi_row = document.querySelector('.table_result tr:nth-child(3)')
        if (this.runmode === RunMode.Hst) {
            multi_row.querySelector('td:nth-child(1)').innerText = ''
            multi_row.querySelector('td:nth-child(2)').innerText = ''
            multi_row.querySelector('td:nth-child(3)').innerText = ''
        } else {
            multi_row.querySelector('td:nth-child(1)').innerText = 'Mult'
            multi_row.querySelector('td:nth-child(2)').innerText = multi
            multi_row.querySelector('td:nth-child(3)').innerText = conf_multi
        }

        // Score
        let score_row = document.querySelector('.table_result tr:nth-child(4)')
        if (this.runmode === RunMode.Hst) {
            score_row.querySelector('td:nth-child(2)').innerText = this.HstRawScore
            score_row.querySelector('td:nth-child(3)').innerText = this.HstVerifiedScore
        } else {
            score_row.querySelector('td:nth-child(2)').innerText = score
            score_row.querySelector('td:nth-child(3)').innerText = conf_score
        }
    }


    static ExtractPrefix(Call) {
        let call = Call.toUpperCase()
        let dig = ''
        call = call.replace(/\/QRP$/, '')
        call = call.replace(/\/MM$/, '')
        call = call.replace(/\/M$/, '')
        call = call.replace(/\/P$/, '')


        call = call.replace(/^\//, '')
        call = call.replace(/\/$/, '')

        if (call.length < 2) return ''
        let s1 = call.replace(/\/.*$/, '')
        let s2 = call.replace(/^.*\//, '')
        if (/^\d$/.test(s1)) {
            call = s2
            dig = s1
        } else {
            if (/^\d$/.test(s2)) {
                call = s1
                dig = s2
            } else if (s1.length <= s2.length) call = s1; else call = s2
        }
        if (call.indexOf('/') >= 0) return ''

        //delete trailing letters, retain at least 2 chars
        call = call.replace(/([^\d]+)$/, (match, p1, offset) => {
            const keepLength = Math.max(2, offset)
            return call.substring(offset, keepLength)
        })

        // ensure digit
        if (!/\d$/.test(call)) {
            call += '0'
        }
        // replace digit

        if (dig.length > 0) {
            call = call.slice(0, -1) + dig[0]
        }
        return call.slice(0, 5)
    }

    addTable(qso) {
        const el = document.querySelector("#log > table")
        let row = el.insertRow(-1)
        row.insertCell().textContent = `${qso.UTC}`
        row.insertCell().textContent = `${qso.Call}`
        row.insertCell().textContent = qso.RecvExchange.join(" ")
        row.insertCell().textContent = qso.SendExchange.join(" ")
        row.insertCell().textContent = `${qso.Pref}`
        row.insertCell().textContent = `${qso.Check}`
        let log = document.getElementById("log")
        log.scrollTop = log.scrollHeight
    }

}