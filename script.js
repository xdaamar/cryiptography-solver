// --- ROUTING LOGIC ---
// Fungsi untuk berpindah halaman via sidebar
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Menandai menu aktif di sidebar
    if (window.event) {
        window.event.currentTarget.classList.add('active');
    }
}

// --- A1Z26 DECODER (Kasus "The Numbers") ---
function decodeA1Z26(str) {
    let nums = str.match(/\d+/g);
    if (!nums) return null;
    return nums.map(n => {
        let val = parseInt(n);
        return (val >= 1 && val <= 26) ? String.fromCharCode(val + 64) : '?';
    }).join('');
}

// --- RSA BATCH GCD SOLVER (Kasus 1) ---
function gcd(a, b) {
    while (b > 0n) { a %= b; [a, b] = [b, a]; }
    return a;
}

function modInverse(e, phi) {
    let m0 = phi, t, q;
    let x0 = 0n, x1 = 1n;
    while (e > 1n) {
        q = e / phi;
        t = phi; phi = e % phi; e = t;
        t = x0; x0 = x1 - q * x0; x1 = t;
    }
    return x1 < 0n ? x1 + m0 : x1;
}

function bigIntPow(base, exp, mod) {
    let res = 1n;
    base %= mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % mod;
        base = (base * base) % mod;
        exp /= 2n;
    }
    return res;
}

function solveRSA() {
    try {
        const n1 = BigInt(document.getElementById('rsa-n1').value.trim());
        const n2 = BigInt(document.getElementById('rsa-n2').value.trim());
        const e = BigInt(document.getElementById('rsa-e').value.trim());
        const c = BigInt(document.getElementById('rsa-c').value.trim());

        // Cari faktor prima yang sama
        let p = gcd(n1, n2);
        if (p <= 1n) {
            alert("GCD adalah 1. N1 dan N2 tidak berbagi faktor!");
            return;
        }

        let q = n1 / p;
        let phi = (p - 1n) * (q - 1n);
        let d = modInverse(e, phi);
        let m = bigIntPow(c, d, n1);

        // Ubah BigInt ke String (Flag)
        let hex = m.toString(16);
        if (hex.length % 2 !== 0) hex = '0' + hex;
        let flag = "";
        for (let i = 0; i < hex.length; i += 2) {
            flag += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        
        const resultBox = document.getElementById('rsa-result');
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<strong>[+] FLAG DITEMUKAN:</strong> ${flag}`;
    } catch(err) {
        alert("Error RSA: Masukkan angka yang valid! " + err.message);
    }
}

// --- HASH CRACKER (STREAMING MODE) (Kasus 2) ---
async function crackHash() {
    const fileInput = document.getElementById('wordlist-file');
    const targetHash = document.getElementById('target-hash').value.trim().toLowerCase();
    const status = document.getElementById('crack-status');
    const resultBox = document.getElementById('crack-result');

    if (!fileInput.files[0] || !targetHash) {
        alert("Pilih file rockyou.txt dan masukkan hash target!");
        return;
    }

    status.innerHTML = "🕒 Memulai pencarian... (Ini mungkin memakan waktu)";
    resultBox.style.display = 'none';

    const file = fileInput.files[0];
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let partialLine = '';
    let count = 0;
    let found = false;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = (partialLine + chunk).split(/\r?\n/);
            partialLine = lines.pop(); // Simpan baris yang terpotong

            for (const password of lines) {
                count++;
                // Gunakan CryptoJS untuk MD5
                let hash = CryptoJS.MD5(password).toString();
                
                if (hash === targetHash) {
                    resultBox.style.display = 'block';
                    resultBox.innerHTML = `<strong>[+] MATCH FOUND!</strong><br>Password: <span style="color:#00ff41">${password}</span><br><small>Ditemukan setelah ${count.toLocaleString()} baris.</small>`;
                    status.innerHTML = "✅ Cracking Selesai!";
                    found = true;
                    break;
                }

                // Update status setiap 100 ribu baris agar tidak lag
                if (count % 100000 === 0) {
                    status.innerHTML = `🕒 Memproses... Sudah mengecek ${count.toLocaleString()} baris.`;
                }
            }
            if (found) break;
        }

        if (!found) status.innerHTML = "❌ Password tidak ditemukan di wordlist.";
    } catch (e) {
        status.innerHTML = "⚠️ Error membaca file!";
        console.error(e);
    }
}

// --- AUTO DECODER LOGIC ---
function autoDecode() {
    const input = document.getElementById('dec-input').value.trim();
    const results = document.getElementById('dec-results');
    results.innerHTML = "";

    if (!input) return;

    // 1. Cek A1Z26 (Urutan Angka)
    let a1z26 = decodeA1Z26(input);
    if (a1z26 && a1z26.length > 1) addResult('A1Z26 Decoder', a1z26);

    // 2. Cek Base64
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(input) && input.length % 4 === 0) {
        try {
            let b64 = atob(input);
            if (/[a-zA-Z0-9]/.test(b64)) addResult('Base64 Decoder', b64);
        } catch(e) {}
    }

    // 3. Cek Hex
    let cleanHex = input.replace(/\s/g, '');
    if (/^[0-9a-fA-F]+$/.test(cleanHex) && cleanHex.length % 2 === 0) {
        try {
            let res = '';
            for (let i = 0; i < cleanHex.length; i += 2) res += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
            if (/[a-zA-Z0-9]/.test(res)) addResult('Hex Decoder', res);
        } catch(e) {}
    }

    // 4. Caesar Brute Force (Auto-detect flag)
    let caesar = caesarBrute(input);
    if (caesar) addResult('Caesar Shifts (Potential Flags)', caesar);

    // 5. Hash Identification
    identifyHash(input);
}

// --- MODULES HELPER ---
function addResult(title, text) {
    const res = document.getElementById('dec-results');
    res.innerHTML += `
        <div class="card">
            <span style="color:#58a6ff; font-weight:bold;">[ ${title} ]</span>
            <div class="result-box">${text}</div>
        </div>`;
}

function caesarBrute(str) {
    let out = '';
    let found = false;
    for (let s = 1; s < 26; s++) {
        let d = str.replace(/[a-zA-Z]/g, c => {
            let b = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - b - s + 26) % 26) + b);
        });
        // Highlight jika mengandung kata kunci CTF
        if (d.toLowerCase().includes('pico') || d.toLowerCase().includes('flag') || d.includes('{')) {
            out += `<strong>⭐ Shift ${s}: ${d}</strong><br>`;
            found = true;
        }
    }
    return found ? out : null;
}

function identifyHash(str) {
    const len = str.trim().length;
    const isHex = /^[0-9a-fA-F]+$/.test(str.trim());
    if (!isHex) return;
    if (len === 32) addResult('Hash Info', 'Deteksi: MD5');
    else if (len === 40) addResult('Hash Info', 'Deteksi: SHA-1');
    else if (len === 64) addResult('Hash Info', 'Deteksi: SHA-256');
}