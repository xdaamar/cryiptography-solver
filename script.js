/* =====================================================
   CTF CRYPTO SOLVER — script.js (FIXED & ENHANCED v2)
   ===================================================== */

// ============================================================
// ROUTING — switchPage: Fixed, tidak pakai window.event
// ============================================================
function switchPage(pageId, clickedEl) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Hapus active dari semua nav-item
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Tampilkan halaman target
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    // Tandai nav-item yang diklik sebagai aktif
    if (clickedEl) clickedEl.classList.add('active');
}

// ============================================================
// CLIPBOARD HELPER
// ============================================================
async function pasteFromClipboard(targetId) {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(targetId).value = text;
        // Trigger autoDecode jika ini untuk decoder
        if (targetId === 'dec-input') autoDecode();
    } catch (e) {
        alert('Tidak bisa membaca clipboard. Gunakan Ctrl+V secara manual.');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Disalin ke clipboard!');
    }).catch(() => {
        alert('Gagal menyalin.');
    });
}

function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = `
            position:fixed; bottom:30px; right:30px; z-index:9999;
            background:#161b22; border:1px solid #30363d; color:#00ff87;
            padding:12px 20px; border-radius:8px; font-size:0.85rem;
            font-family:'JetBrains Mono',monospace; box-shadow:0 4px 20px rgba(0,0,0,0.5);
            transition: opacity 0.3s; opacity:1;
        `;
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ============================================================
// HELPER: Buat result card
// ============================================================
function createResultCard(title, content, isHighlight = false) {
    const isFlagLike = content.toLowerCase().includes('flag') ||
                       content.toLowerCase().includes('pico') ||
                       content.includes('{');

    const div = document.createElement('div');
    div.className = 'result-card';
    div.innerHTML = `
        <div class="result-card-title">
            <span class="dot"></span>
            ${title}
            ${isFlagLike ? '<span style="color:var(--primary);margin-left:auto;">⭐ Possible FLAG!</span>' : ''}
        </div>
        <div class="result-content ${isHighlight || isFlagLike ? 'highlight' : ''}">${escapeHtml(content)}</div>
        <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(content)})">📋 Copy</button>
    `;
    return div;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function addResultToContainer(containerId, title, content) {
    const container = document.getElementById(containerId);
    container.appendChild(createResultCard(title, content));
}

// ============================================================
// A1Z26 DECODER
// ============================================================
function decodeA1Z26(str) {
    // Harus mengandung angka 1-26 yang dipisah karakter non-angka
    const nums = str.match(/\d+/g);
    if (!nums || nums.length < 2) return null;
    const valid = nums.every(n => {
        const v = parseInt(n);
        return v >= 1 && v <= 26;
    });
    if (!valid) return null;
    return nums.map(n => String.fromCharCode(parseInt(n) + 64)).join('');
}

// ============================================================
// BINARY DECODER
// ============================================================
function decodeBinary(str) {
    const clean = str.trim().replace(/\s+/g, ' ');
    // Harus terlihat seperti byte biner (kelompok 8-bit)
    const groups = clean.split(' ');
    if (groups.length < 2) return null;
    const validBinary = groups.every(g => /^[01]{8}$/.test(g));
    if (!validBinary) return null;
    try {
        const result = groups.map(b => String.fromCharCode(parseInt(b, 2))).join('');
        if (/[a-zA-Z0-9]/.test(result)) return result;
    } catch(e) {}
    return null;
}

// ============================================================
// ROT13 DECODER
// ============================================================
function decodeROT13(str) {
    return str.replace(/[a-zA-Z]/g, c => {
        const b = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
    });
}

// ============================================================
// AUTO DECODER — Deteksi & Decode Otomatis
// ============================================================
function autoDecode() {
    const input = document.getElementById('dec-input').value.trim();
    const results = document.getElementById('dec-results');
    results.innerHTML = '';

    if (!input || input.length < 2) return;

    let found = 0;

    // 1. Binary (prioritas tinggi, pattern sangat spesifik)
    const bin = decodeBinary(input);
    if (bin) { addResultToContainer('dec-results', '🔢 Binary Decoder', bin); found++; }

    // 2. A1Z26 (angka 1-26)
    const a1z26 = decodeA1Z26(input);
    if (a1z26 && a1z26.length > 1) { addResultToContainer('dec-results', '🔤 A1Z26 Decoder', a1z26); found++; }

    // 3. Base64
    if (/^[A-Za-z0-9+/\-_]*={0,2}$/.test(input) && input.length >= 4 && input.length % 4 === 0) {
        try {
            let b64 = atob(input);
            if (/[a-zA-Z0-9]/.test(b64) && b64.trim().length > 0) {
                addResultToContainer('dec-results', '📦 Base64 Decoder', b64);
                found++;
            }
        } catch(e) {}
    }

    // 4. Hex
    const cleanHex = input.replace(/\s|0x/g, '').replace(/,/g, '');
    if (/^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length % 2 === 0 && cleanHex.length >= 4) {
        try {
            let res = '';
            for (let i = 0; i < cleanHex.length; i += 2) {
                res += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
            }
            if (/[a-zA-Z0-9]/.test(res)) {
                addResultToContainer('dec-results', '🔡 Hex Decoder', res);
                found++;
            }
        } catch(e) {}
    }

    // 5. ROT13
    const rot13Result = decodeROT13(input);
    if (rot13Result !== input && /[a-zA-Z]/.test(input)) {
        addResultToContainer('dec-results', '🔁 ROT13 Decoder', rot13Result);
        found++;
    }

    // 6. Morse Code (auto-detect)
    if (/^[.\- /]+$/.test(input) && input.includes('.')) {
        try {
            const morseResult = morseToText(input);
            if (morseResult && morseResult.trim()) {
                addResultToContainer('dec-results', '📡 Morse Code Decoder', morseResult);
                found++;
            }
        } catch(e) {}
    }

    // 7. Caesar Brute Force
    if (/[a-zA-Z]/.test(input)) {
        const caesarResults = [];
        for (let s = 1; s < 26; s++) {
            const d = applyCaesar(input, s, 'decode');
            const isFlagLike = d.toLowerCase().includes('pico') ||
                               d.toLowerCase().includes('flag') ||
                               d.includes('{') ||
                               d.toLowerCase().includes('ctf');
            caesarResults.push({ shift: s, text: d, flag: isFlagLike });
        }
        // Tampilkan yang mengandung flag keyword dulu
        const flagHits = caesarResults.filter(r => r.flag);
        if (flagHits.length > 0) {
            flagHits.forEach(r => {
                addResultToContainer('dec-results', `🔄 Caesar Shift ${r.shift} ⭐`, r.text);
                found++;
            });
        } else {
            // Tampilkan semua dalam satu card
            const allCaesar = caesarResults.map(r => `Shift ${String(r.shift).padStart(2,' ')}: ${r.text}`).join('\n');
            addResultToContainer('dec-results', '🔄 Caesar Brute Force (Shift 1-25)', allCaesar);
            found++;
        }
    }

    // 8. Hash Identification
    identifyHash(input, 'dec-results');

    if (found === 0) {
        results.innerHTML = `
            <div class="result-card" style="border-color: var(--border-bright);">
                <div style="color:var(--text-muted); text-align:center; padding:10px;">
                    🔍 Tidak ada format yang cocok terdeteksi otomatis.<br>
                    <small>Coba gunakan tool spesifik di sidebar (Vigenere, Caesar, Morse).</small>
                </div>
            </div>`;
    }
}

// ============================================================
// CAESAR SOLVER PAGE
// ============================================================
function applyCaesar(str, shift, mode) {
    const s = mode === 'encode' ? shift : (26 - shift);
    return str.replace(/[a-zA-Z]/g, c => {
        const b = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - b + s) % 26) + b);
    });
}

function solveCaesar() {
    const input = document.getElementById('caesar-input').value;
    const shiftVal = parseInt(document.getElementById('caesar-shift').value) || 0;
    const mode = document.getElementById('caesar-mode').value;
    const results = document.getElementById('caesar-results');
    results.innerHTML = '';

    if (!input.trim()) {
        results.innerHTML = '<p style="color:var(--text-muted);">Masukkan teks terlebih dahulu.</p>';
        return;
    }

    if (shiftVal > 0 && shiftVal <= 25) {
        // Shift spesifik
        const result = applyCaesar(input, shiftVal, mode);
        addResultToContainer('caesar-results', `Caesar Shift ${shiftVal} (${mode})`, result);
    } else {
        // Brute force semua shift
        for (let s = 1; s < 26; s++) {
            const result = applyCaesar(input, s, mode);
            addResultToContainer('caesar-results', `Shift ${s}`, result);
        }
    }
}

// ============================================================
// VIGENERE CIPHER
// ============================================================
function solveVigenere() {
    const input = document.getElementById('vig-input').value;
    const key = document.getElementById('vig-key').value.toUpperCase().replace(/[^A-Z]/g, '');
    const mode = document.getElementById('vig-mode').value;
    const results = document.getElementById('vig-results');
    results.innerHTML = '';

    if (!input.trim()) {
        results.innerHTML = '<p style="color:var(--text-muted);">Masukkan teks terlebih dahulu.</p>';
        return;
    }
    if (!key) {
        results.innerHTML = '<p style="color:var(--danger);">⚠️ Masukkan kunci (key) Vigenere terlebih dahulu.</p>';
        return;
    }

    let result = '';
    let keyIdx = 0;

    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (/[a-zA-Z]/.test(c)) {
            const isUpper = c <= 'Z';
            const base = isUpper ? 65 : 97;
            const charCode = c.charCodeAt(0) - base;
            const keyCode = key[keyIdx % key.length].charCodeAt(0) - 65;
            let shifted;
            if (mode === 'decode') {
                shifted = (charCode - keyCode + 26) % 26;
            } else {
                shifted = (charCode + keyCode) % 26;
            }
            result += String.fromCharCode(shifted + base);
            keyIdx++;
        } else {
            result += c;
        }
    }

    addResultToContainer('vig-results', `Vigenere ${mode === 'decode' ? 'Decoded' : 'Encoded'} (Key: ${key})`, result);
}

// ============================================================
// MORSE CODE
// ============================================================
const MORSE_MAP = {
    'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---',
    'K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-',
    'U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
    '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',
    ':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','_':'..--.-','"':'.-..-.','$':'...-..-','@':'.--.-.',
    ' ': '/'
};

const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k,v]) => [v, k]));

function textToMorse(text) {
    return text.toUpperCase().split('').map(c => {
        return MORSE_MAP[c] || '?';
    }).join(' ');
}

function morseToText(morse) {
    // Normalisasi: ganti | atau newline dengan /
    const normalized = morse.trim().replace(/\|/g, '/').replace(/\n/g, ' / ');
    return normalized.split('/').map(word => {
        return word.trim().split(' ').map(code => {
            const code_clean = code.trim();
            if (!code_clean) return '';
            return REVERSE_MORSE[code_clean] || '?';
        }).join('');
    }).join(' ').trim();
}

function decodeMorse() {
    const input = document.getElementById('morse-input').value;
    const results = document.getElementById('morse-results');
    results.innerHTML = '';
    if (!input.trim()) return;
    const decoded = morseToText(input);
    addResultToContainer('morse-results', '📡 Morse Decoded', decoded);
}

function encodeMorse() {
    const input = document.getElementById('morse-input').value;
    const results = document.getElementById('morse-results');
    results.innerHTML = '';
    if (!input.trim()) return;
    const encoded = textToMorse(input);
    addResultToContainer('morse-results', '📨 Morse Encoded', encoded);
}

// ============================================================
// RSA BATCH GCD SOLVER
// ============================================================
function gcd(a, b) {
    while (b > 0n) { let t = b; b = a % b; a = t; }
    return a;
}

function modInverse(e, phi) {
    let m0 = phi;
    let x0 = 0n, x1 = 1n;
    if (phi === 1n) return 0n;
    while (e > 1n) {
        const q = e / phi;
        let t = phi;
        phi = e % phi;
        e = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }
    return x1 < 0n ? x1 + m0 : x1;
}

function bigIntPow(base, exp, mod) {
    let res = 1n;
    base %= mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % mod;
        base = (base * base) % mod;
        exp >>= 1n;
    }
    return res;
}

function bigIntToString(m) {
    let hex = m.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

function solveRSA() {
    const resultBox = document.getElementById('rsa-result');
    try {
        const n1Str = document.getElementById('rsa-n1').value.trim();
        const n2Str = document.getElementById('rsa-n2').value.trim();
        const eStr  = document.getElementById('rsa-e').value.trim();
        const cStr  = document.getElementById('rsa-c').value.trim();

        if (!n1Str || !n2Str || !eStr || !cStr) {
            throw new Error('Semua field harus diisi!');
        }

        const n1 = BigInt(n1Str);
        const n2 = BigInt(n2Str);
        const e  = BigInt(eStr);
        const c  = BigInt(cStr);

        const p = gcd(n1, n2);
        if (p <= 1n || p === n1) {
            resultBox.style.display = 'block';
            resultBox.style.borderLeftColor = 'var(--danger)';
            resultBox.innerHTML = '❌ GCD = 1. N1 dan N2 tidak berbagi faktor prima — Tidak dapat di-crack dengan metode ini.';
            return;
        }

        const q   = n1 / p;
        const phi = (p - 1n) * (q - 1n);
        const d   = modInverse(e, phi);
        const m   = bigIntPow(c, d, n1);
        const flag = bigIntToString(m);

        resultBox.style.display = 'block';
        resultBox.style.borderLeftColor = 'var(--primary)';
        resultBox.innerHTML = `
            <div style="color:var(--text-muted); font-size:0.78rem; margin-bottom:8px;">RSA BATCH GCD RESULT</div>
            <div style="margin-bottom:8px;"><span style="color:var(--text-muted);">p =</span> <span style="color:var(--accent);">${p}</span></div>
            <div style="margin-bottom:8px;"><span style="color:var(--text-muted);">q =</span> <span style="color:var(--accent);">${q}</span></div>
            <div style="margin-bottom:8px;"><span style="color:var(--text-muted);">d =</span> <span style="color:var(--accent);">${d}</span></div>
            <div style="margin-top:16px; padding:12px; background:rgba(0,255,135,0.05); border:1px solid var(--primary); border-radius:6px;">
                <span style="color:var(--primary); font-weight:700;">[+] FLAG: ${escapeHtml(flag)}</span>
            </div>
        `;
    } catch(err) {
        resultBox.style.display = 'block';
        resultBox.style.borderLeftColor = 'var(--danger)';
        resultBox.innerHTML = `⚠️ Error: ${escapeHtml(err.message)}`;
    }
}

// ============================================================
// HASH CRACKER (Streaming — CryptoJS)
// ============================================================
let crackStopped = false;

function stopCracking() {
    crackStopped = true;
    document.getElementById('stop-btn').style.display = 'none';
}

async function crackHash() {
    const fileInput   = document.getElementById('wordlist-file');
    const targetHash  = document.getElementById('target-hash').value.trim().toLowerCase();
    const hashType    = document.getElementById('hash-type').value;
    const status      = document.getElementById('crack-status');
    const resultBox   = document.getElementById('crack-result');

    // Validasi
    if (!targetHash) {
        alert('Masukkan hash target terlebih dahulu!');
        return;
    }
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Pilih file wordlist (.txt) terlebih dahulu!');
        return;
    }

    // Cek apakah CryptoJS tersedia
    if (typeof CryptoJS === 'undefined') {
        status.style.display = 'block';
        status.className = 'status-box error';
        status.textContent = '❌ Library CryptoJS gagal dimuat. Periksa koneksi internet.';
        return;
    }

    crackStopped = false;
    document.getElementById('stop-btn').style.display = 'inline-flex';
    status.style.display = 'block';
    status.className = 'status-box';
    status.textContent = '🕒 Memulai pencarian...';
    resultBox.style.display = 'none';

    const file = fileInput.files[0];
    const stream = file.stream();
    const reader = stream.getReader();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    let partialLine = '';
    let count = 0;
    let found = false;

    // Pilih fungsi hash dari CryptoJS
    const hashFn = {
        'MD5':    (pw) => CryptoJS.MD5(pw).toString(),
        'SHA1':   (pw) => CryptoJS.SHA1(pw).toString(),
        'SHA256': (pw) => CryptoJS.SHA256(pw).toString(),
    }[hashType];

    const startTime = Date.now();

    try {
        while (!crackStopped) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = textDecoder.decode(value, { stream: true });
            const lines = (partialLine + chunk).split(/\r?\n/);
            partialLine = lines.pop(); // baris yang belum selesai

            for (const password of lines) {
                if (crackStopped) break;
                count++;

                const hash = hashFn(password);
                if (hash === targetHash) {
                    found = true;
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                    resultBox.style.display = 'block';
                    resultBox.innerHTML = `
                        <div style="color:var(--primary); font-size:1.1rem; font-weight:700; margin-bottom:12px;">🎯 MATCH FOUND!</div>
                        <div style="margin-bottom:6px;"><span style="color:var(--text-muted);">Password:</span> <span style="color:var(--primary);">${escapeHtml(password)}</span></div>
                        <div style="margin-bottom:6px;"><span style="color:var(--text-muted);">Hash (${hashType}):</span> <span style="color:var(--accent);">${targetHash}</span></div>
                        <div style="color:var(--text-muted); font-size:0.8rem;">Ditemukan setelah ${count.toLocaleString()} baris dalam ${elapsed} detik.</div>
                    `;
                    status.className = 'status-box done';
                    status.textContent = '✅ Cracking Selesai!';
                    document.getElementById('stop-btn').style.display = 'none';
                    break;
                }

                // Update UI setiap 50.000 baris (tidak terlalu sering agar tidak lag)
                if (count % 50000 === 0) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    status.textContent = `🕒 Memproses... ${count.toLocaleString()} kata dicek (${elapsed}s)`;
                    // Yield ke browser agar tidak freeze
                    await new Promise(r => setTimeout(r, 0));
                }
            }
            if (found) break;
        }

        if (!found && !crackStopped) {
            status.className = 'status-box error';
            status.textContent = `❌ Password tidak ditemukan. Total dicek: ${count.toLocaleString()} kata.`;
            document.getElementById('stop-btn').style.display = 'none';
        } else if (crackStopped) {
            status.className = 'status-box error';
            status.textContent = `⏹️ Dihentikan. Total dicek: ${count.toLocaleString()} kata.`;
        }
    } catch (err) {
        status.className = 'status-box error';
        status.textContent = `⚠️ Error membaca file: ${err.message}`;
        document.getElementById('stop-btn').style.display = 'none';
        console.error(err);
    }
}

// ============================================================
// HASH IDENTIFIER
// ============================================================
function identifyHash(str, containerId = null) {
    const s = str.trim();
    const isHex = /^[0-9a-fA-F]+$/.test(s);
    if (!isHex) return;

    let type = null;
    if (s.length === 32)  type = 'MD5 (128-bit)';
    else if (s.length === 40)  type = 'SHA-1 (160-bit)';
    else if (s.length === 56)  type = 'SHA-224 (224-bit)';
    else if (s.length === 64)  type = 'SHA-256 (256-bit)';
    else if (s.length === 96)  type = 'SHA-384 (384-bit)';
    else if (s.length === 128) type = 'SHA-512 (512-bit)';

    if (type && containerId) {
        addResultToContainer(containerId, `#️⃣ Hash Identifier`, `Terdeteksi: ${type}\nPanjang: ${s.length} karakter hex`);
    }
    return type;
}

function quickIdentifyHash(val) {
    const result = document.getElementById('hash-identify-result');
    const s = val.trim();
    if (!s) { result.innerHTML = ''; return; }
    const type = identifyHash(s);
    if (type) {
        result.innerHTML = `<div style="margin-top:10px; padding:10px 14px; background:var(--primary-glow); border:1px solid rgba(0,255,135,0.3); border-radius:6px; font-family:'JetBrains Mono',monospace; font-size:0.85rem; color:var(--primary);">✅ Terdeteksi: <strong>${type}</strong></div>`;
    } else if (/^[0-9a-fA-F]+$/.test(s)) {
        result.innerHTML = `<div style="margin-top:10px; padding:10px 14px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:6px; font-size:0.85rem; color:var(--danger);">❓ Panjang hex tidak cocok dengan tipe hash yang dikenal (panjang: ${s.length}).</div>`;
    } else {
        result.innerHTML = `<div style="margin-top:10px; padding:10px 14px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:6px; font-size:0.85rem; color:var(--danger);">❌ Bukan format hex yang valid.</div>`;
    }
}