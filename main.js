import { DEFAULT } from "./defaults.js"
window.onload = () => {
    const button = document.getElementById("start")
    button.onclick = async () => {
        let ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: DEFAULT.RATE })
        await ctx.audioWorklet.addModule("contest-processor.js");
        const ContestNode = new AudioWorkletNode(
            ctx,
            "contest-processor",
          );
          ContestNode.connect(ctx.destination);
    }
}
