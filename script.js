const MORSE_CODE = {".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z","-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",".....":"5","-....":"6","--...":"7","---..":"8","----.":"9","--..--":",","-.-.-.":";","---...":":","-....-":"-",".-.-.-":".","..--..":"?","-..-.":"/","-.--.":"(","-.--.-":")",".----.":"'","-....-":"-",".--.-.":"@","...-..-":"$","--...-":"&"};

function processAll() {
    const input = document.getElementById('input-text').value.trim();
    const key = document.getElementById('cipher-key').value.trim();
    const output = document.getElementById('analysis-results');
    output.innerHTML = '';

    if (!input) {
        document.getElementById('freq-analysis-area').style.display = 'none';
        return;
    }

    identifyHash(input);

    if (/^[A-Za-z0-9+/]*={0,2}$/.test(input) && input.length % 4 === 0) {
        try { addResult('Base64', atob(input)); } catch(e){}
    }

    decodeHex(input);
    decodeBinary(input);

    decodeMorse(input);

    addResult('Caesar (All Shifts)', caesarBrute(input));

    if (key) {
        addResult('Vigenere Decrypted', vigenereDecode(input, key));

    runFrequencyAnalysis(input);
}

// --- MODULES ---

function addResult(type, content) {
    const div = document.createElement('div');
    div.className = 'result-card';
    div.innerHTML = `<span class="badge">${type}</span>
        <div id="res-${type}" style="white-space: pre-wrap;">${content}</div>
        <button class="copy-btn" onclick="copyToClipboard('res-${type}')">Copy</button>`;
    document.getElementById('analysis-results').appendChild(div);
}

function decodeHex(str) {
    try {
        let clean = str.replace(/\s/g, '');
        let res = '';
        for (let i = 0; i < clean.length; i += 2) res += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
        if(/[a-zA-Z0-9]/.test(res)) addResult('Hex Decoder', res);
    } catch(e){}
}

function decodeBinary(str) {
    try {
        let clean = str.replace(/\s/g, '');
        if (!/^[01]+$/.test(clean)) return;
        let res = '';
        for (let i = 0; i < clean.length; i += 8) res += String.fromCharCode(parseInt(clean.substr(i, 8), 2));
        addResult('Binary Decoder', res);
    } catch(e){}
}

function decodeMorse(str) {
    if (!/^[.\-\s/]+$/.test(str)) return;
    let decoded = str.split(' / ').map(word => 
        word.split(' ').map(char => MORSE_CODE[char] || '?').join('')
    ).join(' ');
    addResult('Morse Code', decoded);
}

function caesarBrute(str) {
    let out = '';
    for (let s = 1; s < 26; s++) {
        let d = str.replace(/[a-zA-Z]/g, c => {
            let b = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - b - s + 26) % 26) + b);
        });
        if (d.toLowerCase().includes('pico') || d.toLowerCase().includes('flag')) 
            out += `<strong>⭐ Shift ${s}: ${d}</strong><br>`;
        else out += `Shift ${s}: ${d}<br>`;
    }
    return out;
}

function vigenereDecode(text, key) {
    let res = '', j = 0;
    key = key.toLowerCase();
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (/[a-zA-Z]/.test(c)) {
            let b = c <= 'Z' ? 65 : 97;
            let k = key[j % key.length].charCodeAt(0) - 97;
            res += String.fromCharCode(((c.charCodeAt(0) - b - k + 26) % 26) + b);
            j++;
        } else res += c;
    }
    return res;
}

function identifyHash(str) {
    const len = str.length;
    const isHex = /^[0-9a-fA-F]+$/.test(str);
    if (!isHex) return;
    if (len === 32) addResult('Hash Info', 'Type: MD5');
    else if (len === 40) addResult('Hash Info', 'Type: SHA-1');
    else if (len === 64) addResult('Hash Info', 'Type: SHA-256');
}

function runFrequencyAnalysis(str) {
    const area = document.getElementById('freq-analysis-area');
    const container = document.getElementById('freq-bars');
    area.style.display = 'block';
    container.innerHTML = '';
    
    let counts = {};
    let clean = str.toUpperCase().replace(/[^A-Z]/g, '');
    for (let char of clean) counts[char] = (counts[char] || 0) + 1;
    
    let max = Math.max(...Object.values(counts));
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(char => {
        let count = counts[char] || 0;
        let height = (count / max) * 100 || 0;
        const bar = document.createElement('div');
        bar.className = 'freq-bar';
        bar.style.height = height + '%';
        bar.setAttribute('data-label', `${char}: ${count}`);
        container.appendChild(bar);
    });
}

function copyToClipboard(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
}

function showSection(name) {
    document.getElementById('decoder-section').style.display = name === 'decoder' ? 'block' : 'none';
    document.getElementById('cheatsheet-section').style.display = name === 'cheatsheet' ? 'block' : 'none';
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}}