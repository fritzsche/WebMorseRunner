export class Config {

    static store_key = '_WebMorseKey'

    constructor(callback) {
        this._my_call = document.querySelector("#my_call")
        this._volume = document.querySelector("#volume")
        this._wpm = document.querySelector("#wpm")
        this._pitch = document.querySelector("#pitch")
        this._time = document.querySelector("#time")
        this._qsk = document.querySelector("#qsk")
        this._bandwidth = document.querySelector("#bandwidth")
        this._rit = document.querySelector("#rit")

        this._callback = callback

        this.all = document.querySelectorAll(".watch").forEach(
            d => d.addEventListener('input', e => {
                this.update()
            }))

        this._config = {
            my_call: 'DJ1TF',
            volume: 0.75,
            wpm: 30,
            pitch: 500,
            rx_bandwidth: 300,
            time: 10,
            qsk: false,
            rit: 0,
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

    store() {
        localStorage.setItem(Config.store_key, JSON.stringify(this._config))
    }
    load() {
        let config_str = localStorage.getItem(Config.store_key)
        if (config_str) {
            let conf = JSON.parse(config_str)
            if (conf) this._config = conf
        }
    }

    update_dom() {
        this._my_call.value = this._config.my_call
        this._volume.value = this._config.volume
        this._wpm.value = this._config.wpm
        this._pitch.value = this._config.pitch
        this._time.value = this._config.time
        this._qsk.checked = this._config.qsk
        this._bandwidth.value = this._config.rx_bandwidth
        this._rit.value = this._config.rit
    }

    read_dom() {
        this._config.my_call = this._my_call.value.toUpperCase()
        this._config.volume = this._volume.value
        this._config.wpm = this._wpm.value
        this._config.pitch = this._pitch.value
        this._config.time = this._time.value
        this._config.qsk = this._qsk.checked
        this._config.rx_bandwidth = this._bandwidth.value
        this._config.rit = this._rit.value
    }



}