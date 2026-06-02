import { Config } from "./config.js"

export class ExpertConfig {
    constructor() {
        this._config = Config._instance
        this.modal = document.getElementById("expert_modal")
        this.closeBtn = document.getElementById("close_expert")
        this.gearBtn = document.getElementById("expert_config")

        this.dxWpmType = document.getElementById("dx_wpm_type")
        this.minWpmInput = document.getElementById("dx_min_wpm")
        this.maxWpmInput = document.getElementById("dx_max_wpm")

        this.init()
    }

    init() {
        // Note: setDefaultWpmValues() called by view.js after config is initialized

        // Open modal on gear button click
        this.gearBtn.addEventListener("click", () => {
            this.open()
        })

        // Close on X button click
        this.closeBtn.addEventListener("click", () => {
            this.close()
        })

        // Close on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !this.modal.classList.contains("hidden")) {
                this.close()
            }
        })

        // Enable/disable WPM inputs based on DX WPM type
        this.dxWpmType.addEventListener("change", () => {
            this.updateWpmInputs()
            this._config.update()
        })

        // Update expert config when max_dx changes
        document.getElementById("max_dx").addEventListener("change", () => {
            this._config.update()
        })

        // Update expert config when inputs change
        this.minWpmInput.addEventListener("input", () => {
            this._config.update()
        })
        this.maxWpmInput.addEventListener("input", () => {
            this._config.update()
        })

        // Initialize WPM input states based on current config
        this.updateWpmInputs()
    }

    open() {
        this.modal.classList.remove("hidden")
    }

    close() {
        this.modal.classList.add("hidden")
    }

    hide() {
        this.gearBtn.classList.add("contest-hidden")
    }

    show() {
        this.gearBtn.classList.remove("contest-hidden")
    }

    setDefaultWpmValues() {
        // Returns true if any defaults were set (for persistence tracking)
        let defaultsSet = false

        // Guard: ensure config is ready
        if (!this._config || !this._config._config) {
            return false
        }

        // Only set initial defaults if values are null (first run after update)
        // Once saved values exist in localStorage, they will be loaded and NOT overwritten
        if (this._config._config.dx_min_wpm == null) {
            const userWpm = parseInt(this._config._config.wpm) || 20
            const minWpm = Math.max(10, userWpm - 5)
            this.minWpmInput.value = minWpm
            this._config._config.dx_min_wpm = minWpm
            defaultsSet = true
        }
        if (this._config._config.dx_max_wpm == null) {
            const userWpm = parseInt(this._config._config.wpm) || 20
            const maxWpm = userWpm
            this.maxWpmInput.value = maxWpm
            this._config._config.dx_max_wpm = maxWpm
            defaultsSet = true
        }
        return defaultsSet
    }

    updateWpmInputs() {
        if (this.dxWpmType.value === "individual") {
            this.minWpmInput.disabled = false
            this.maxWpmInput.disabled = false
        } else {
            this.minWpmInput.disabled = true
            this.maxWpmInput.disabled = true
        }
    }
}