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
    }

    log(msg) {
        console.log(msg)
       // this._log.push(msg)
    }
}
