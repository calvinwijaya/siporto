// config.js
// Gunakan var atau tempelkan ke window agar aman diakses antar file
window.jenjangCPLData = {
    'S1': {
        cplList: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
        piMap: {
            'a': ['a1', 'a2', 'a3'], 
            'b': ['b1', 'b2', 'b3', 'b4'], 
            'c': ['c1', 'c2', 'c3', 'c4', 'c5'],
            'd': ['d1', 'd2', 'd3'], 
            'e': ['e1', 'e2', 'e3', 'e4'], 
            'f': ['f1', 'f2'],
            'g': ['g1', 'g2', 'g3', 'g4', 'g5'], 
            'h': ['h1', 'h2'], 
            'i': ['i1', 'i2'],
            'j': ['j1', 'j2'], 
            'k': ['k1', 'k2', 'k3', 'k4']
        }
    },
    'S2': {
        cplList: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        piMap: {
            'a': ['a1', 'a2', 'a3'], 
            'b': ['b1', 'b2', 'b3', 'b4'], 
            'c': ['c1', 'c2', 'c3'],
            'd': ['d1', 'd2', 'd3', 'd4', 'd5'], 
            'e': ['e1', 'e2'], 
            'f': ['f1', 'f2', 'f3', 'f4'],
            'g': ['g1', 'g2', 'g3', 'g4', 'g5'], 
            'h': ['h1', 'h2', 'h3', 'h4']
        }
    },
    'S3': {
        cplList: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        piMap: {
            'a': ['a1', 'a2'], 
            'b': ['b1', 'b2'],
            'c': ['c1', 'c2', 'c3'],
            'd': ['d1', 'd2', 'd3', 'd4'], 
            'e': ['e1', 'e2', 'e3', 'e4'], 
            'f': ['f1', 'f2', 'f3'],
            'g': ['g1', 'g2', 'g3'], 
            'h': ['h1', 'h2', 'h3', 'h4']
        }
    }
};

// Tambahkan juga fungsi helper global di sini agar tidak perlu mengulang di file lain
window.getCPLKeysForJenjang = function(jenjang) {
    const config = window.jenjangCPLData[jenjang] || window.jenjangCPLData['S1'];
    return [...config.cplList];
};

window.getPIKeysForJenjang = function(jenjang) {
    const config = window.jenjangCPLData[jenjang] || window.jenjangCPLData['S1'];
    const keys = [];
    config.cplList.forEach(cpl => {
        (config.piMap[cpl] || []).forEach(pi => {
            if (!keys.includes(pi)) keys.push(pi);
        });
    });
    return keys;
};

function getRowValueCaseInsensitive(row, key) {
    if (!row) return "";
    const searchKey = String(key).trim().toLowerCase();
    for (const k of Object.keys(row)) {
        if (String(k).trim().toLowerCase() === searchKey) return row[k];
    }
    return "";
}

window.mkList = [];
window.selectedJenjang = null;
window.selectedCPL = new Set();
window.assessmentCount = 0;
window.mahasiswaList = [];