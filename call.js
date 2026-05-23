export class Calls {

    static store_key = 'web_morse_runner_calls'

    constructor() {
        this.fileSelect = document.getElementById("fileSelect")
        this.fileElem = document.getElementById("fileElem")
        this.fileSelect.addEventListener(
            "click",
            (e) => {
                //this.fileElem.files = nil
                if (this.fileElem) this.fileElem.click()
                e.preventDefault() // prevent navigation to "#"
            },
            false,
        )
        document.getElementById("reset").addEventListener(
            "click",
            (e) => {
                localStorage.removeItem(Calls.store_key)
                this.fileElem.value = ""
                this.fetch_calls() 
                e.preventDefault() // prevent navigation to "#"
            },
            false,
        )        
        this.fileElem.addEventListener("change",
            (e) => {
                const files = e.target.files
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        const fetched_calls=e.target.result     
                        const calls = this.filter_calls(fetched_calls)
                        if(calls.length > 0) {
                            this.calls = calls
                            localStorage.setItem(Calls.store_key, fetched_calls)
                            this.update_calls()
                        }
                    }
                    reader.readAsText(file)
                }
            }, false)
    }

    filter_calls(calls) {
        return calls.split('\n').filter( l => {
            // ignore lines starting with hash as comments
            return l.substring(0, 1) !== '#'
        }).map(e => { 
            e.trim()
            // strip tabs and line breaks to ensure
            // call signs are just call signs 
            e = e.replace(/[\n\r\t]/gm, "");
            return e.split(',') 
        }
        ).filter(
            (c) => {
                return c.length >= 1 && c[0].length > 2 && c[0].length < 15 
            })
    }

    update_calls() {
        const no_of_calls = document.getElementById("no_of_calls")
        no_of_calls.innerText = this.calls.length        

    }

    async fetch_calls() {
        const localdb__str = localStorage.getItem(Calls.store_key)
        this.calls = new Array()
        if (localdb__str) this.calls = this.filter_calls(localdb__str)
        if (this.calls.length > 0) {
            this.update_calls()
            return
        }
        const fetched_calls = await (await fetch('calls.txt')).text()

        localStorage.setItem(Calls.store_key, fetched_calls)
        this.calls = this.filter_calls(fetched_calls)
        this.update_calls()
    }

    get_random_int(min, max) {
        min = Math.ceil(min)
        max = Math.floor(max)
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    get_random() {
        let random = this.get_random_int(0, this.calls.length)
        let call = this.calls[random]
        return call
    }

    get_call(call) {
        const uc_call = call.toUpperCase()
        return this.calls.find(c => c[0].toUpperCase() === uc_call)
    }
}
