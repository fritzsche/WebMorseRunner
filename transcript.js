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
        this._element.value += msg + '\n'
        this._element.scrollTop = this._element.scrollHeight
       // this._log.push(msg)
    }
}
