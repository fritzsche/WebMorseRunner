import { Calls } from "./call.js"
import { DEFAULT, AudioMessage } from "./defaults.js"
import { Log } from "./log.js"

export class View {
    constructor() {
        this.running = false
        this.ContestNode = null
        this.calls = new Calls()
        this.calls.fetch_calls()
        this.MustAdvance = true
        this.call = document.getElementById('call')
        this.rst = document.getElementById('rst')
        this.nr = document.getElementById('nr')

        this.prev_call = ''
        this.CallSend = false
        this.NrSend = false

        this.log = new Log()
//        log.addEntry()        
    }
    setFocus(id) {
        document.getElementById(id).focus();
    }

    wipeFields() {
        document.getElementById('call').value = ''
        document.getElementById('rst').value = ''
        document.getElementById('nr').value = ''
        this.setFocus('call')

        this.CallSend = false
        this.NrSend = false

    }

    sendMessage(data) {
        if (this.ContestNode) this.ContestNode.port.postMessage(data)
    }


    processEnter() {
        let new_call = this.call.value.toUpperCase()
        this.MustAdvance = false

        // send CQ if call is empty
        if (this.call.value === '') {
            this.sendMessage({
                type: AudioMessage.send_cq
            })
            return
        }
        let C = this.CallSend
        let N = this.NrSend
        let R = this.nr.value !== ''

        if (!C || (!N && !R)) {
            this.CallSend = true
            this.prev_call = new_call
            this.sendMessage({
                type: AudioMessage.send_his,
                data: new_call
            })
        }
        if (!N) {
            this.NrSend = true
            this.sendMessage({
                type: AudioMessage.send_nr
            })
        }
        // send ?            
        if (N && !R)
            this.sendMessage({
                type: AudioMessage.send_qm
            })


        if (R && (C || N)) {
            this.sendMessage({
                type: AudioMessage.send_tu
            })
            this.log.addQso(
                {
                    UTC: '00:00:00',
                    Call: this.Call,
                    RecvNr: String(this.Nr).padStart(3, '0'),
                    RecvRST: String(this.Rst),
                    SendNr: '002',
                    SendRST: '599',
                    Pref: Log.ExtractPrefix(this.Call),
                    Check: 'DUP'
        
                }                
            )
            this.wipeFields()
        }
        else
            this.MustAdvance = true
    }

    processFunctionKey(key) {
        switch (key) {
            case 'F1':
                this.sendMessage({
                    type: AudioMessage.send_cq
                })
                break
            case 'F2':
                this.sendMessage({
                    type: AudioMessage.send_nr
                })
                break
            case 'F3':
                this.sendMessage({
                    type: AudioMessage.send_tu
                })
                break
            case 'F4':
                this.sendMessage({
                    type: AudioMessage.send_my
                })
                break
            case 'F5':
                this.sendMessage({
                    type: AudioMessage.send_his,
                    data: this.Call
                })
                break
            case 'F6':
                this.sendMessage({
                    type: AudioMessage.send_b4,
                })
                break
            case 'F7':
                this.sendMessage({
                    type: AudioMessage.send_qm,
                })
                break
            case 'F8':
                this.sendMessage({
                    type: AudioMessage.send_nil,
                })
                break
            default:
                return false    
        }
        return true

    }

    hideTitle() {
        document.querySelector("#title").style.display = 'none'
    }

    sendButton() {
        const send_buttons = document.querySelectorAll('.send button')
        send_buttons.forEach((button) => {
            button.addEventListener("mousedown", (e) => {
                this.startContest()
                // avoid loosing focus of input fields 
                this.processFunctionKey(e.target.id)
                e.preventDefault()
            })
        })



        document.getElementById('input').addEventListener("keydown", (e) => {
            this.startContest()
            if (this.call.value.toUpperCase() !== this.prev_call) {
                this.prev_call = ''
                this.CallSend = false
            }
            switch (e.code) {
                case 'Enter':
                    this.processEnter()
                    break
                default:
                    if(this.processFunctionKey(e.code)) e.preventDefault()
            }
        })
    }

    get Call() {
        return this.call.value.toUpperCase()
    }

    get Nr() {
        let nr = this.nr.value
        if (nr === '') return 0
        return parseInt(nr)
    }    
    get Rst() {
        let rst = this.rst.value
        if (rst === '') return 599        
        return parseInt(rst)
    }        

    numberFields() {
        var nr_input = document.querySelectorAll('.NR')
        Array.from(nr_input).forEach(input => {
            input.addEventListener("beforeinput", e => {
                const nextVal =
                    e.target.value.substring(0, e.target.selectionStart) +
                    (e.data ?? '') +
                    e.target.value.substring(e.target.selectionEnd)
                if (!/^\d{0,3}$/.test(nextVal)) {
                    e.preventDefault();
                }
                return
            })
        })
    }

    advance() {
        if (!this.MustAdvance) return
        if (this.rst.value === '') this.rst.value = 599

        if (this.call.value.indexOf('?') === -1) {
            this.setFocus('nr')
        }
        this.MustAdvance = false
    }



    async startContest() {
        if (this.running === true) return
        this.hideTitle()
        this.running = true
        this.wipeFields()
        this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: DEFAULT.RATE })
        await this.ctx.audioWorklet.addModule("contest-processor.js");
        this.ContestNode = new AudioWorkletNode(
            this.ctx,
            "contest-processor",
        );
        this.ContestNode.port.onmessage = (e) => {
            console.log(e.data)
            let type = e.data.type

            switch (type) {
                case AudioMessage.request_dx:
                    this.random_call = this.calls.get_random()
                    this.ContestNode.port.postMessage({
                        type: AudioMessage.create_dx,
                        data: this.random_call
                    })
                    break
                case AudioMessage.advance:
                    this.advance()
                    break
                default:
                    console.log("ERROR: Unsupported message")
                    debugger;
            }
        }
        this.ContestNode.connect(this.ctx.destination);
    }



    onLoad() {

      //  console.log(Log.ExtractPrefix("dj1tF/2"))
        this.sendButton()
        this.wipeFields()
        this.numberFields()

        /*    const start_button = document.getElementById("start")
            start_button.onclick = async () => {
                this.startContest()
            }*/

    }



}