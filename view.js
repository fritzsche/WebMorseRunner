import { Calls } from "./call.js"
import { AudioMessage, DEFAULT, RunMode, StationMessage } from "./defaults.js"
import { Log } from "./log.js"
import { Config } from "./config.js"

import { ContestDefinition } from "./contest-definition.js"

export class View {
    constructor() {
        this.running = false
        this.ContestNode = null
        this.calls = new Calls()
        this.calls.fetch_calls()
        this.MustAdvance = true
        this.call = document.getElementById("call")
        this.clock = document.getElementById("clock")
        this.txIndicator = document.getElementById('tx-indicator')
        this._pileupStations = 0
        this.prev_call = ""
        this.CallSend = false
        this.NrSend = false
        this.TX = false

        this.log = new Log()

    }
    setFocus(id) {
        document.getElementById(id).focus()
    }

    set pileupStations(number) {
        this._pileupStations = number
        this._updatePileUp()
    }

    get pileupStations() {
        return this._pileupStations
    }

    _updatePileUp() {
        if (this._config._config.runmode === RunMode.Pileup) {
            const element = document.getElementById("pileup")
            const txt = `Pileup: ${this._pileupStations}`
            element.innerText = txt
            if (this._pileupStations > 0) element.classList.add('pileup_green'); else element.classList.remove('pileup_green')
        }

    }

    wipeFields() {
        document.getElementById("call").value = ""
        this._ContestDefinition.wipeExchangeFields()
        this.setFocus("call")

        this.CallSend = false
        this.NrSend = false
    }

    sendMessage(data) {
        if (this.ContestNode) this.ContestNode.port.postMessage(data)
    }

    processSpace() {
        this.MustAdvance = false
        const active = document.activeElement
        const RST = document.getElementById('rst')
        let rst_value = ''
        if (RST) rst_value = RST.value
        if (!active) return
        switch (active.id) {
            case 'call':
            case 'RST':
                if (rst_value === '' && RST) RST.value = '599'
                let next_id = this._ContestDefinition.getNextField(active.id)
                if (next_id === 'rst') next_id = this._ContestDefinition.getNextField(next_id)
                this.setFocus(next_id)
                break
            default:
                const default_next_id = this._ContestDefinition.getNextField(active.id)
                this.setFocus(default_next_id)
                break
        }
    }

    processEnter() {
        let new_call = this.call.value.toUpperCase()
        this.MustAdvance = false

        // send CQ if call is empty
        if (this.call.value === "") {
            this.sendMessage({
                type: AudioMessage.send_msg,
                data: StationMessage.CQ
            })
            return
        }
        // access member variable
        // these are reset when qso finished
        let callSend = this.CallSend
        let numberSend = this.NrSend
        console.log("call: ", callSend)
        console.log("number: ", numberSend)


        // content in the NR/exchange field
        const dxNrLogged = this._ContestDefinition.isExchangeEdited()

        // Call has not yet send, so we send the call
        if (!callSend || (!numberSend && !dxNrLogged)) {
            // remember we have send the call
            this.CallSend = true
            // we remember the call to check if we changes it.
            // we can resend all changed 
            this.prev_call = new_call
            // send <his>
            this.sendMessage({
                type: AudioMessage.send_his,
                data: new_call,
            })
        }
        if (!numberSend) {
            this.NrSend = true
            this.sendMessage({
                type: AudioMessage.send_msg,
                data: StationMessage.NR
            })
        }
        // send ?
        if (numberSend && !dxNrLogged) {
            this.sendMessage({
                type: AudioMessage.send_msg,
                data: StationMessage.Qm,
            })
        }
        // qso finished:
        // we have NR and call
        // now send TU and log QSO and reset the fields.
        if (dxNrLogged && (callSend || numberSend)) {
            this.sendMessage({
                type: AudioMessage.send_msg,
                data: StationMessage.TU
            })

            const contestDef = new ContestDefinition()
            const RecvExchange = contestDef.getExchange()

            this.log.addQso(
                {
                    UTC: this.getClock(),
                    Call: this.Call,
                    RecvNr: String(this.Nr).padStart(3, "0"),
                    RecvRST: String(this.Rst),
                    RecvExchange: RecvExchange,
                },
            )
            this.sendMessage({
                type: AudioMessage.update_nr,
                data: this.log.NR,
            })
            this.wipeFields()
        } else {
            this.MustAdvance = true
        }
    }



    // My outgoing messages
    sendMyMessage(message) {
        switch (message) {
            // we need to send the text of his call
            case StationMessage.HisCall:
                this.sendMessage({
                    type: AudioMessage.send_his,
                    data: this.Call,
                })
                break
            case StationMessage.Exchange1:
                const exchange = this._ContestDefinition.composeExchange()
                this.sendMessage({
                    type: AudioMessage.send_exchange,
                    data: exchange
                })
                break
            default:
                this.sendMessage({
                    type: AudioMessage.send_msg,
                    data: message
                })
                break
        }
    }

    // process function key
    processFunctionKey(key) {
        const Constest_FKey = this._ContestDefinition._contest.key
        if (Constest_FKey) {
            if (!Constest_FKey[key]) return false
            this.sendMyMessage(Constest_FKey[key].send)
        } else {
            //debugger;
        }
        return true
    }

    hideTitle() {
        document.querySelector("#title").style.display = "none"
    }

    sendButton() {
        const send_buttons = document.querySelectorAll(".send button")
        send_buttons.forEach((button) => {
            button.addEventListener("mousedown", (e) => {
                this.startContest()
                // avoid loosing focus of input fields
                this.processFunctionKey(e.target.id)
                e.preventDefault()
            })
        })

        //        document.getElementById("input").addEventListener("keydown", (e) => {
        document.addEventListener("keydown", (e) => {
            if (!this.running) return
            //this.startContest()
            if (this.call.value.toUpperCase() !== this.prev_call) {
                this.prev_call = ""
                this.CallSend = false
            }

            switch (e.key) {
                case "Escape":
                    e.preventDefault()
                    this.MustAdvance = true
                    this.ContestNode.port.postMessage({
                        type: AudioMessage.abort_sending,
                        data: "",
                    })
                    break
                case "Space":
                case " ":
                    this.processSpace()
                    e.preventDefault()
                    break
                case "Enter":
                    this.processEnter()
                    e.preventDefault()
                    break
                case "ArrowDown":
                    this._config.updateRIT(-50)
                    e.preventDefault()
                    break
                case "ArrowUp":
                    this._config.updateRIT(50)
                    e.preventDefault()
                    break
                case "Tab":
                    const last_id = this._ContestDefinition.getLastExchangeField().id
                    if (!e.shiftKey && e.target.id === last_id) {
                        document.getElementById("call").focus()
                        e.preventDefault()
                    }
                    if (e.shiftKey && e.target.id === "call") {
                        document.getElementById(last_id).focus()
                        e.preventDefault()
                    }

                    break
                default:
                    const regex = /Digit(\d)/
                    const digit_match = e.code.match(regex)

                    let key = e.key
                    const modifier_pressed = (e.ctrlKey || e.altKey || e.metaKey ||
                        e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) // e.shiftKey ||
                    // if a modifier key is pressed we also accept numbers as function key
                    if (modifier_pressed && digit_match) key = `F${digit_match[1]}`
                    if (this.processFunctionKey(key)) e.preventDefault()
                    break
            }
        })
    }

    get Call() {
        return this.call.value.toUpperCase().trim()
    }

    get Nr() {
        const nr_dom = document.getElementById("nr")
        if (!nr_dom) return -1
        let nr = nr_dom.value
        if (nr === "") return -1
        return parseInt(nr)
    }
    get Rst() {
        const rst_dom = document.getElementById("rst")
        if (!rst_dom) return 999
        const rst = rst_dom.value
        if (rst === "") return 599
        return parseInt(rst)
    }



    advance() {
        if (!this.MustAdvance) return
        const rst = document.getElementById("rst")
        if (rst && rst.value === "") rst.value = 599

        if (this.call.value.indexOf("?") === -1) {
            if (rst) {
                const next_field = this._ContestDefinition.getNextField("rst")
                this.setFocus(next_field)
            } else {
                const next_field = this._ContestDefinition.getNextField("call")
                this.setFocus(next_field)
            }
        }
        this.MustAdvance = false
    }

    formatTimer(sec) {
        let hours = Math.floor(sec / 3600)
        let minutes = Math.floor((sec - (hours * 3600)) / 60)
        let seconds = Math.floor(sec - (hours * 3600) - (minutes * 60))
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")
            }:${String(seconds).padStart(2, "0")}`
    }

    updateTimer() {
        if (!this.running === true) return
        let t = this.ctx.currentTime - this.start_time

        if (t > this._config._config.time * 60) {
            this.clock.innerText = this.formatTimer(
                this._config._config.time * 60,
            )
            this.stopContest()
        }
        this.clock.innerText = this.getClock()
    }

    getClock() {
        let t = this.ctx.currentTime - this.start_time
        return this.formatTimer(t)
    }

    toggleNoRunFields() {
        document.querySelectorAll(".no_run").forEach(
            (f) => f.disabled = !f.disabled,
        )
    }

    async startContest() {
        if (this.running === true) return
        this.hideTitle()
        this.running = true
        this.wipeFields()
        this.stopTX()
        this.pileupStations = 0

        this.log.wipe()
        this.toggleRunButton()

        //if (!this.ctx)
        document.getElementById("debug").innerText = ""
        this.ctx = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: DEFAULT.RATE,
        })
        if (this.ctx.state === "suspended") {
            await this.ctx.resume()
        }

        await this.ctx.audioWorklet.addModule("contest-processor.js")
        this.ContestNode = new AudioWorkletNode(
            this.ctx,
            "contest-processor",
        )

        this.start_time = this.ctx.currentTime
        this.updateTimer()
        this.timer_id = window.setInterval(() => {
            this.updateTimer()
        }, 500)
        this.ContestNode.port.onmessage = (e) => {
            let type = e.data.type
            let data = e.data.data
            switch (type) {
                case AudioMessage.request_dx:
                    let calls = new Array()
                    for (let i = 0; i < data; i++) calls.push(this.calls.get_random())
                    // console.log(calls[0])
                    this.pileupStations += data
                    this.ContestNode.port.postMessage({
                        type: AudioMessage.create_dx,
                        data: calls,
                    })
                    break
                case AudioMessage.request_qrm:
                    const call = this.calls.get_random()
                    this.ContestNode.port.postMessage({
                        type: AudioMessage.create_qrm,
                        data: call,
                    })
                    break
                case AudioMessage.abort_sending:
                    const abort = data                    
                    if (abort.sendHis) {
                        this.CallSend = false
                    }
                    if (abort.sendNr) {
                        this.NrSend = false
                    }
                    break
                case AudioMessage.start_tx:
                    this.startTX()
                    break
                case AudioMessage.stop_tx:
                    this.stopTX()
                    break
                case AudioMessage.advance:
                    this.advance()
                    break
                case AudioMessage.check_log:
                    this.log.checkQSO(data)
                    break
                case AudioMessage.update_pileup:
                    this.pileupStations = data
                    break
                case AudioMessage.update_call:
                    console.log("U1: ",data)
                    
                    if (!data) {
                        this.CallSend = false
                    } else this.prev_call = this.Call

                    console.log("U2: ",this.CallSend)                    
                    break
                default:
                    console.log("ERROR: Unsupported message")
                    debugger
            }
        }
        this.ContestNode.connect(this.ctx.destination)
        this._config.read_dom()
        let conf = this._config._config
        //        conf['active_contest'] = this._ContestDefinition._contest
        this._ContestDefinition.updateConfig(this._config._config)
        this.sendMessage({
            type: AudioMessage.start_contest,
            data: conf,
        })
    }

    updateCall(e) {
        const call = this.Call
        this.ContestNode.port.postMessage({
            type: AudioMessage.update_call,
            data: call,
        })
    }

    stopTX() {
        this.TX = false
        this.txIndicator.classList.remove('tx-active')
        this.call.removeEventListener('input', this.updateCall)
    }

    startTX() {
        this.TX = false
        this.updateCall = this.updateCall.bind(this); 
        this.call.addEventListener('input', this.updateCall)
        this.txIndicator.classList.add('tx-active')
    }

    stopContest() {
        this.running = false
        this.toggleRunButton()
        this.sendMessage({
            type: AudioMessage.stop_contest,
        })

        this.ContestNode.disconnect()
        this.ctx.close()
        if (this.timer_id) window.clearInterval(this.timer_id)
        this.stopTX()
    }

    toggleRunButton() {
        this.toggleNoRunFields()
        if (this.running) {
            this.run.classList.add("stop")
            this.run.innerHTML = "&#9724; Stop"
        } else {
            this.run.classList.remove("stop")
            this.run.innerHTML = "&#9654; Run"
        }
    }

    initRunButton() {
        this.run = document.getElementById("run")
        this.run.addEventListener("click", (e) => {
            if (this.running) this.stopContest()
            else this.startContest()
        })
    }

    updateConf(conf) {
        if (this.running) {
            this.sendMessage({
                type: AudioMessage.config,
                data: conf,
            })
        }
    }

    initConfig() {
        this._config = new Config((conf) => {
            this.updateConf(conf)
            this._ContestDefinition.updateConfig(conf)
        })
        this._config.update_dom()
        //const input = document.querySelector("#volume")
    }



    onLoad() {
        this._ContestDefinition = new ContestDefinition()
        this.initConfig()
        this.initRunButton()
        this.sendButton()
        this.wipeFields()
    }
}
