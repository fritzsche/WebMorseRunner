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
        this._lines = []
        this._element = document.getElementById('transcript_content')
    }

    clear() {
        this._lines = []
        this._element.value = ''
    }

    log(msg) {
        console.log(msg)
        this._lines.push(msg)
        this._element.value = this._lines.join('\n')
        this._element.scrollTop = this._element.scrollHeight
       // this._log.push(msg)
    }
}
