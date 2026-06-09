export function float32ToInt16(f32Array) {
    const i16 = new Int16Array(f32Array.length)
    for (let i = 0; i < f32Array.length; i++) {
        i16[i] = Math.max(-32768, Math.min(32767, Math.round(f32Array[i] * 32767)))
    }
    return i16
}

export function buildWavBuffer(chunks, totalSamples, sampleRate = 11025) {
    const dataBytes = totalSamples * 2
    const buf = new ArrayBuffer(44 + dataBytes)
    const view = new DataView(buf)
    const str = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
    str(0,  'RIFF')
    view.setUint32(4,  36 + dataBytes,    true)
    str(8,  'WAVE')
    str(12, 'fmt ')
    view.setUint32(16, 16,               true)
    view.setUint16(20, 1,                true)  // PCM
    view.setUint16(22, 1,                true)  // mono
    view.setUint32(24, sampleRate,        true)
    view.setUint32(28, sampleRate * 2,    true)  // byte rate = sampleRate * 1ch * 2 bytes
    view.setUint16(32, 2,                true)  // block align
    view.setUint16(34, 16,               true)  // bits per sample
    str(36, 'data')
    view.setUint32(40, dataBytes,         true)
    let offset = 44
    for (const chunk of chunks) {
        new Int16Array(buf, offset, chunk.length).set(chunk)
        offset += chunk.byteLength
    }
    return buf
}

export function recFilename(callSign, now = new Date()) {
    const pad = n => String(n).padStart(2, '0')
    const d = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`
    const t = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
    const call = (callSign || 'REC').replace(/\//g, '-')
    return `morse_${call}_${d}_${t}Z.wav`
}

export function formatRecStatus(totalSamples, sampleRate = 11025) {
    const secs = Math.round(totalSamples / sampleRate)
    const mins = Math.floor(secs / 60)
    const s    = secs % 60
    const mb   = (totalSamples * 2 / 1048576).toFixed(1)
    const pad  = n => String(n).padStart(2, '0')
    return `REC ${pad(mins)}:${pad(s)} (${mb} MB)`
}
