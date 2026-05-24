import { DEFAULT, RunMode } from "./defaults.js"
import { ContestDefinition } from "./contest-definition.js"


export class Config {
    static store_key = "_WebMorseKey";

    constructor(callback) {
        // singleton 
        if (Config._instance) {
            return Config._instance
        }
        Config._instance = this
        this._my_call = document.querySelector("#my_call")
        this._volume = document.querySelector("#volume")
        this._wpm = document.querySelector("#wpm")
        this._dx_min_wpm = document.querySelector("#dx_min_wpm")
        this._dx_max_wpm = document.querySelector("#dx_max_wpm")
        this._pitch = document.querySelector("#pitch")
        this._time = document.querySelector("#time")
        this._qsk = document.querySelector("#qsk")
        this._bandwidth = document.querySelector("#bandwidth")
        this._rit = document.querySelector("#rit")
        this._contest_id = document.querySelector("#mode")
        this._activity = document.querySelector("#activity")
        this._exchange1 = document.querySelector("#my_exchange1")
        this._exchange2 = document.querySelector("#my_exchange2")

        // condx
        this._qrn = document.querySelector("#qrn")
        this._qrm = document.querySelector("#qrm")
        this._qsb = document.querySelector("#qsb")
        this._flutter = document.querySelector("#flutter")
        this._lids = document.querySelector("#lids")

        this._callback = callback

        this.all = document.querySelectorAll(".watch").forEach(
            (d) =>
                d.addEventListener("input", (e) => {
                    if (e.target === this._wpm) this.updateDefaultDxWpm()
                    this.update()
                }),
        )

        this._config = {
            my_call: "DJ1TF",
            volume: 0.75,
            wpm: 30,
            dx_min_wpm: 28,
            dx_max_wpm: 35,
            pitch: 500,
            rx_bandwidth: 300,
            time: 10,
            qsk: false,
            rit: 0,
            contest_id: 'single',
            runmode: RunMode.Single,
            activity: 2,
            // condx
            qrn: false,
            qrm: false,
            qsb: false,
            flutter: false,
            lids: false,
            contest: {},
        }
        this.load()
    }

    update() {
        this.read_dom()
        this.store()
        this._callback(this._config)
    }

    updateRIT(x) {
        let rit = Number(this._rit.value)
        this._rit.value = String(rit + x)
        this.update()
    }

    updateBW(x) {
        const bw = Number(this._bandwidth.value)
        const newBW = bw + x
        if (newBW >= 100 && newBW <= 600) {
            this._bandwidth.value = String(newBW)
        }
        this.update()
    }

    updateWPM(x) {
        const wpm = Number(this._wpm.value)
        const newWPM = wpm + x
        if (newWPM >= 10 && newWPM <= 60) {
            this._wpm.value = String(newWPM)
            this.setDefaultDxWpm()
            this.update()
        }
    }

    setDefaultDxWpm() {
        const wpm = Number(this._wpm.value)
        this._dx_min_wpm.value = String(Math.max(10, wpm - 2))
        this._dx_max_wpm.value = String(Math.min(60, wpm + 5))
    }

    updateDefaultDxWpm() {
        const oldWpm = Number(this._config.wpm)
        const minWasDefault = Number(this._dx_min_wpm.value) === Math.max(10, oldWpm - 2)
        const maxWasDefault = Number(this._dx_max_wpm.value) === Math.min(60, oldWpm + 5)
        if (minWasDefault && maxWasDefault) this.setDefaultDxWpm()
    }

    store() {
        localStorage.setItem(Config.store_key, JSON.stringify(this._config))
    }
    load() {
        let config_str = localStorage.getItem(Config.store_key)
        if (config_str) {
            let conf = JSON.parse(config_str)
            if (conf) {
                this._config = Object.assign({}, this._config, conf)
                this._callback(this._config)
            }
        }
    }


    update_dom() {
        this._my_call.value = this._config.my_call
        this._volume.value = this._config.volume
        this._wpm.value = this._config.wpm
        if (this._config.dx_min_wpm === undefined) this._config.dx_min_wpm = Math.max(10, Number(this._config.wpm) - 2)
        if (this._config.dx_max_wpm === undefined) this._config.dx_max_wpm = Math.min(60, Number(this._config.wpm) + 5)
        this._dx_min_wpm.value = this._config.dx_min_wpm
        this._dx_max_wpm.value = this._config.dx_max_wpm
        this._pitch.value = this._config.pitch
        this._time.value = this._config.time
        this._qsk.checked = this._config.qsk
        this._bandwidth.value = this._config.rx_bandwidth
        this._rit.value = this._config.rit
        const contest_id = String(this._config.contest_id)
        this._contest_id.value = contest_id
        this._activity.value = String(this._config.activity)
        // condx
        this._qrn.checked = this._config.qrn
        this._qrm.checked = this._config.qrm
        this._qsb.checked = this._config.qsb
        this._flutter.checked = this._config.flutter
        this._lids.checked = this._config.lids
        if (contest_id) {
            if (this._config.contest && this._config.contest[contest_id] && this._config.contest[contest_id].exchange1)
                this._exchange1.value = this._config.contest[contest_id].exchange1
            if (this._config.contest && this._config.contest[contest_id] && this._config.contest[contest_id].exchange2)
                this._exchange2.value = this._config.contest[contest_id].exchange2
        }
    }

    read_dom() {
        this._config.my_call = this._my_call.value.toUpperCase()
        this._config.volume = this._volume.value
        this._config.wpm = parseInt(this._wpm.value)
        this._config.dx_min_wpm = parseInt(this._dx_min_wpm.value)
        this._config.dx_max_wpm = parseInt(this._dx_max_wpm.value)
        if (!this._config.dx_min_wpm) this._config.dx_min_wpm = Math.max(10, Number(this._config.wpm) - 2)
        if (!this._config.dx_max_wpm) this._config.dx_max_wpm = Math.min(60, Number(this._config.wpm) + 5)
        if (this._config.dx_min_wpm > this._config.dx_max_wpm) {
            const dx_min_wpm = this._config.dx_max_wpm
            this._config.dx_max_wpm = this._config.dx_min_wpm
            this._config.dx_min_wpm = dx_min_wpm
        }
        this._config.pitch = this._pitch.value
        this._config.time = this._time.value
        this._config.qsk = this._qsk.checked
        this._config.rx_bandwidth = this._bandwidth.value
        this._config.rit = this._rit.value
        const old_contest_id = this._config.contest_id
        const contest_id = this._contest_id.value
        this._config.contest_id = contest_id
        this._config.runmode = ContestDefinition.getRunMode(this._config.contest_id)
        this._config.active_contest = ContestDefinition.getContest(contest_id)
        this._config.activity = parseInt(this._activity.value)

        const exchange1 = this._exchange1.value
        const exchange2 = this._exchange2.value
        if (!this._config.contest[contest_id]) this._config.contest[contest_id] = {}
        if (old_contest_id === contest_id) this._config.contest[contest_id]["exchange1"] = exchange1
        if (old_contest_id === contest_id) this._config.contest[contest_id]["exchange2"] = exchange2

        this._config.qrn = this._qrn.checked
        this._config.qrm = this._qrm.checked
        this._config.qsb = this._qsb.checked
        this._config.flutter = this._flutter.checked
        this._config.lids = this._lids.checked

        if (!this._config.activity) this._config.activity = 2
    }
}
