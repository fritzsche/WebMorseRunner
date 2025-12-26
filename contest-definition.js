import { AudioMessage, DEFAULT, RunMode, StationMessage } from "./defaults.js"
import { Log } from "./log.js"

const exchangeId = {
    nr: 'nr',
    rst: 'rst',
    exchange1: 'exchange1'
}

const Exchange = {
    NR: {
        id: exchangeId.nr,
        text: "Nr.",
        length: 3,
        log: "NR",
        numeric: true,
    },
    RST: {
        id: exchangeId.rst,
        text: "RST",
        length: 3,
        log: "Rst",
        numeric: true,
    },
    NAME: {
        id: exchangeId.exchange1,
        text: 'Name',
        log: "NAME",
        length: 6,
    },
    DOK: {
        id: exchangeId.exchange1,
        text: 'DOK',
        length: 3,
        log: "DOK",
        uppercase: true
    }
}

const stdKey = {
    F1: { label: "CQ", send: StationMessage.CQ },
    F2: { label: "<#>", send: StationMessage.NR },
    F3: { label: "TU", send: StationMessage.TU },
    F4: { label: "<my>", send: StationMessage.MyCall },
    F5: { label: "<his>", send: StationMessage.HisCall },
    F6: { label: "B4", send: StationMessage.B4 },
    F7: { label: "?", send: StationMessage.Qm },
    F8: { label: "NIL", send: StationMessage.Nil },
}


const cwaKey = Object.assign({}, stdKey, {
    F2: { label: "<DOK>", send: StationMessage.NR },
})

const awtKey = Object.assign({}, stdKey, {
   F2: { label: "<Name>", send: StationMessage.NR },
})


const contest_def = [
    {
        id: 'single',
        name: "Single Call",
        runmode: RunMode.Single,
        exchange: [Exchange.RST, Exchange.NR],
        key: stdKey,
    },
    {
        id: 'pileup',
        name: "Pileup",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.NR],
        key: stdKey,
    },
    {
        id: 'wpx',
        name: "WPX-Competition",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.NR],
        key: stdKey,
    },    
    {
        id: 'hst',
        name: "HST mode",
        runmode: RunMode.Hst,
        exchange: [Exchange.RST, Exchange.NR],
        key: stdKey,
    },    
    {
        id: 'cwa',
        name: "DARC CWA",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.DOK],
        exchange_msg: '<rst><1>',            
        key: cwaKey,
        my_exchange: 'My DOK',        
        contest_messages: {         
            NrQm: 'DOK?',
        }
    },
    {
        id: 'awt',
        name: "A1Club AWT",
        runmode: RunMode.Pileup,
        exchange: [Exchange.RST, Exchange.NAME],
        exchange_msg: '<rst><1>',
        key: awtKey,
        my_exchange: 'My Name',
        contest_messages: {
            CQ: 'CQ AWT <my>',
            NrQm: 'NAME?',
        }
    }
]

export class ContestDefinition {

    constructor() {
        // singleton 
        if (ContestDefinition._instance) {
            return ContestDefinition._instance
        }
        ContestDefinition._instance = this                     
        ContestDefinition.initView()
    }
    // load the contest definition 
    static initView() {
        const contestSelect = document.querySelector("#mode")
        contest_def.forEach(d => {
            const selectOption = document.createElement("option")
            selectOption.value = d.id
            const label = document.createTextNode(d.name)
            selectOption.appendChild(label)
            contestSelect.appendChild(selectOption)
        })
    }

    static getRunMode(id) {
        const contest = this.getContest(id)
        if (!contest) return RunMode.Single
        return contest.runmode
    }

    static getContest(id) {
        if(!id) return this.getContest('single')
        const contest = contest_def.find(e => e.id === id)
        if(!id) return this.getContest('single')
        return contest    
    }

    updateConfig(conf) {
        this._config = conf
        this._contest = ContestDefinition.getContest(this._config.contest_id)
        this.updatePileupFields()
        this.updateFunctionKeys()
        this.updateExchangeFields()

        if (this._contest.my_exchange) {
            const exchange1_label = this._contest.my_exchange
            const div_myexchange1 = document.querySelector("#myexchange1")
            div_myexchange1.classList.remove("hidden")
            const label_myexchange1 = document.querySelector("#myexchange1 label")
            label_myexchange1.innerText = exchange1_label
            const input_myexchange1 = document.querySelector("#myexchange1 input")
            if (!this._config.contest[this._contest.id].exchange1)
                input_myexchange1.value = ''
            else input_myexchange1.value = this._config.contest[this._contest.id].exchange1
        } else {
            const div_myexchange1 = document.querySelector("#myexchange1")
            div_myexchange1.classList.add("hidden")
        }

    }
    // Create the field for the exchange.
    // In a standard contest this is RST and NR
    updateExchangeFields() {
        const exchange = document.querySelector("#exchange")
        exchange.innerHTML = ''
        this._contest.exchange.forEach(ex => {
            const div = document.createElement("div")
            const label = document.createElement("label")
            label.for = ex.id
            label.innerText = ex.text
            div.appendChild(label)
            const input = document.createElement("input")
            input.id = ex.id
            if (ex.numeric) input.classList.add("NR")
            if (ex.uppercase) input.style = "text-transform: uppercase"
            input.maxLength = ex.length
            input.size = ex.length
            input.type = "text"
            input.value = ""
            input.name = ex.id
            input.autocomplete = "off"
            div.appendChild(input)
            exchange.appendChild(div)
        })
        this.numberFields()
        this.wipeExchangeFields()
    }

    wipeExchangeFields() {
        // if this gets called in the initialization the contest data is not yet available.
        // so we not yet need to wipe the fields.
        if (this._contest) this._contest.exchange.forEach(ex => {
            document.getElementById(ex.id).value = ""
        })
    }

    // this is a callback that ensures only numeric fields can be used.
    // It's attached to respective exchange fields like RST and NR.
    numberFields() {
        var nr_input = document.querySelectorAll(".NR")
        Array.from(nr_input).forEach((input) => {
            input.addEventListener("beforeinput", (e) => {
                const nextVal =
                    e.target.value.substring(0, e.target.selectionStart) +
                    (e.data ?? "") +
                    e.target.value.substring(e.target.selectionEnd)
                if (!/^\d{0,3}$/.test(nextVal)) {
                    e.preventDefault()
                }
                return
            })
        })
    }

    // returns the last exchange field. This is used
    // to have the tap-navigation (after the last exchange field)
    // to return back to the call field.
    getLastExchangeField() {
        const exchange = this._contest.exchange
        return exchange[exchange.length - 1]
    }

    // update the text for the function keys
    updateFunctionKeys() {
        const contest = ContestDefinition.getContest(this._config.contest_id)
        for (const [key, value] of Object.entries(contest.key)) {
            const button = document.getElementById(key)
            button.innerText = `${key} ${value.label}`
        }
    }



    // get the first exchange field (not RST) and check if it does not 
    // have a value
    isExchangeEdited() {
       // get current contest
       const contest = ContestDefinition.getContest(this._config.contest_id)
       // get the main exchange field (not RST)
       const exchange = contest.exchange.find( e => {
          return e.id !== exchangeId.rst 
       })
       const nr_dom = document.getElementById(exchange.id)
        
       return nr_dom.value !== ""
       
    }

    // get the next field of the sequence: call --> exchange1 --> exchange2 -->...
    // if the last exchange field is provided as input the method will return the call
    // fields
    getNextField(field) {
        const exchange = this._contest.exchange
        if (field === 'call') return exchange[0].id
        const field_idx = exchange.findIndex(ex => { return ex.id === field })
        if (field_idx === exchange.length - 1) return 'call'
        return exchange[field_idx + 1].id
    }

    composeExchange() {
        let result = ""
        this._contest.exchange.forEach(ex => {
            switch (ex.id) {
                case exchangeId.rst:
                    const rst_dom = document.getElementById("rst")
                    let rst = rst_dom.value
                    if (rst === '') rst = '599'
                    if (rst === '599') rst = '5NN'
                    result += rst
                    break
                case exchangeId.exchange1:
                    const my_exchange_dom = document.getElementById("my_exchange1")
                    let exchange = my_exchange_dom.value
                    result += exchange
                    break
            }

        })

        return result
    }

    getExchange() {
        let result = []
        this._contest.exchange.forEach(ex => {
            switch (ex.id) {
                case exchangeId.rst:
                    const rst_dom = document.getElementById("rst")
                    let rst = rst_dom.value
                    if (rst === '') rst = '599'                    
                    result.push( rst )
                    break
                case exchangeId.nr:
                    const nr_dom = document.getElementById(exchangeId.nr)
                    let nr_exchange = String(nr_dom.value).padStart(3, '0')  
                    result.push(nr_exchange)
                    break                    
                case exchangeId.exchange1:
                    let my_exchange_dom = document.getElementById(exchangeId.exchange1)

                    let exchange = my_exchange_dom.value.trim().toUpperCase()                    
                    result.push(exchange)
                    break
            }

        })

        return result
    }    

   // get my own exchange
    getMyExchange() {
        let result = []
        this._contest.exchange.forEach(ex => {
            switch (ex.id) {
                case exchangeId.rst:
                    // we always give 599                   
                    result.push( '599' )
                    break
                case exchangeId.nr:
                    const log = new Log()
                    let nr_exchange = String(log.NR).padStart(3, '0')  
                    result.push(nr_exchange)
                    break                    
                case exchangeId.exchange1:
                    const my_exchange_dom = document.getElementById("my_exchange1")
                    let exchange = my_exchange_dom.value
                    result.push(exchange)
                    break
            }
        })
        return result
    }    

    checkExchange(his,my) {
        let result = Log.Check.OK
        for(let i = 0; i<this._contest.exchange.length;i++) {
            const ex = this._contest.exchange[i]
            const his_ex = his[i].trim().toLowerCase()
            const my_ex = my[i].trim().toLowerCase()
            if (his_ex !== my_ex) result = ex.log
        }
         return result

    }


    updatePileupFields() {
/*        document.querySelectorAll(".pileup_only").forEach(
            (e) => {
                if (this._config.runmode === RunMode.Pileup) {
                    e.classList.remove("pileup_hidden")
                } else e.classList.add("pileup_hidden")
            },
        )
            */
    }

}