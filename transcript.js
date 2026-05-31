export class Transcript {
    constructor() {
        // singleton 
        if (Transcript._instance) {
            return Transcript._instance
        }
        Transcript._instance = this
        this.init()
    }

    init() {
        this._startTime = 0
        this._log = []
        this._element = document.getElementById('transcript_content')
    }

    log(msg) {
        console.log(msg)
        const line = document.createElement('div')
        line.textContent = msg
        this._element.appendChild(line)
        this._element.scrollTop = this._element.scrollHeight
       // this._log.push(msg)
    }
}
