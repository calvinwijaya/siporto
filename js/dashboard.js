const URL_GAS_CHECKER = "https://script.google.com/macros/s/AKfycbzym0Ekk3PTMdvforKNkubVTxflDNDwqNF3jpOMwpFShL9j-tVRBd6FiSdnCDrimyOkcQ/exec"
const ADMIN_EMAILS = ["calvin.wijaya@mail.ugm.ac.id", "cecep.pratama@ugm.ac.id"];

Chart.register({
    id: 'centerTextPlugin',
    beforeDraw: function(chart) {
        if (chart.config.options.elements && chart.config.options.elements.center) {
            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            if (!chartArea) return;
            
            const centerConfig = chart.config.options.elements.center;
            ctx.save();
            ctx.font = centerConfig.font || 'bold 24px sans-serif';
            ctx.fillStyle = centerConfig.color || '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Kalkulasi titik tengah yang selalu presisi terhadap donat
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            ctx.fillText(centerConfig.text, centerX, centerY);
            ctx.restore();
        }
    }
});

// Variabel Global & Chart Instances
let globalData = null;
let activeSemester = "";
let activeJenjang = "S1"; 
let searchKeyword = "";
let isSortAscending = true;

// 8 Instance Chart
let myChartPersonal = null; 
let myChartPersonalS1 = null, myChartPersonalS2 = null, myChartPersonalS3 = null;
let myChartGlobal = null;
let myChartGlobalS1 = null, myChartGlobalS2 = null, myChartGlobalS3 = null;

let currentDataState = {
    personalBelum: [], personalSudah: [], adminBelum: [], adminSudah: []
};

const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) {
    window.location.href = 'index.html';
} else {
    document.getElementById("userNama").textContent = user.nama;
    if (ADMIN_EMAILS.includes(user.email)) {
        document.getElementById("adminSection").style.display = "block";
    }
    initDashboard(user.email);
}

// --- EVENT LISTENERS ---
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    searchKeyword = e.target.value.toLowerCase().trim();
    renderTables(); 
});

document.getElementById('btnSort').addEventListener('click', () => {
    isSortAscending = !isSortAscending; 
    document.querySelector('#btnSort i').className = isSortAscending ? 'bi bi-sort-alpha-down' : 'bi bi-sort-alpha-up';
    renderTables();
});

document.getElementById('btnRefresh').addEventListener('click', () => {
    document.getElementById('loadingOverlay').style.display = "flex";
    initDashboard(user.email); 
});

document.querySelectorAll('input[name="jenjangFilter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        activeJenjang = e.target.value;
        renderTables(); 
    });
});

async function initDashboard(emailUser) {
    try {
        const response = await fetch(`${URL_GAS_CHECKER}?email=${encodeURIComponent(emailUser)}`);
        globalData = await response.json(); 
        document.getElementById('loadingOverlay').style.display = "none";

        const semesterArray = Object.keys(globalData.globalStats).sort().reverse(); 
        const selectEl = document.getElementById("filterSemester");
        selectEl.innerHTML = ""; 
        
        if(semesterArray.length === 0) {
            selectEl.innerHTML = `<option value="">Tidak ada data semester</option>`;
            return;
        }

        semesterArray.forEach(sem => selectEl.innerHTML += `<option value="${sem}">${sem}</option>`);

        const newSelectEl = selectEl.cloneNode(true);
        selectEl.parentNode.replaceChild(newSelectEl, selectEl);
        newSelectEl.addEventListener('change', function() {
            processDataForSemester(this.value);
        });

        activeSemester = semesterArray[0];
        processDataForSemester(activeSemester);

    } catch (error) {
        console.error("Kesalahan jaringan:", error);
        document.getElementById('loadingOverlay').style.display = "none";
        Swal.fire("Error", "Gagal memuat data dari server.", "error");
    }
}

function processDataForSemester(selectedSemester) {
    activeSemester = selectedSemester;
    document.querySelectorAll(".judulSemesterText").forEach(el => el.textContent = selectedSemester);

    currentDataState = { personalBelum: [], personalSudah: [], adminBelum: [], adminSudah: [] };
    
    // Objek rekap statistik per jenjang
    let statPersonal = { S1: { sudah: 0, belum: 0 }, S2: { sudah: 0, belum: 0 }, S3: { sudah: 0, belum: 0 } };
    let statGlobal = { S1: { sudah: 0, belum: 0 }, S2: { sudah: 0, belum: 0 }, S3: { sudah: 0, belum: 0 } };

    // 1. PROSES DATA PERSONAL
    const mkSemesterIni = globalData.mkDiampu.filter(mk => mk.semesterAsli === selectedSemester);
    mkSemesterIni.forEach(mk => {
        const nC = String(mk.namaMK).toLowerCase().trim();
        const sC = String(mk.semesterKonversi).toLowerCase().trim();
        
        const kelasSelesai = globalData.mkSudahDinilai.filter(s => s.namaMK_clean === nC && s.semester_clean === sC && s.jenjang === mk.jenjang);
        const adaReguler = kelasSelesai.some(k => String(k.kelas).toUpperCase().trim() !== "IUP");

        if (adaReguler) {
            mk.kelasText = kelasSelesai.map(k => k.kelas).join(", ");
            currentDataState.personalSudah.push(mk);
            if(statPersonal[mk.jenjang]) statPersonal[mk.jenjang].sudah++;
        } else {
            currentDataState.personalBelum.push(mk);
            if(statPersonal[mk.jenjang]) statPersonal[mk.jenjang].belum++;
        }
    });

    // 2. PROSES DATA ADMIN (GLOBAL)
    const globalMKSemesterIni = globalData.globalMKList.filter(mk => mk.semesterAsli === selectedSemester);
    globalMKSemesterIni.forEach(mk => {
        const nC = mk.namaMK_clean;
        const sC = String(mk.semesterKonversi).toLowerCase().trim();
        
        const kelasSelesai = globalData.globalSudahDinilaiList.filter(s => s.namaMK_clean === nC && s.semester_clean === sC && s.jenjang === mk.jenjang);
        const adaReguler = kelasSelesai.some(k => String(k.kelas).toUpperCase().trim() !== "IUP");

        if (adaReguler) {
            mk.kelasText = kelasSelesai.map(k => k.kelas).join(", ");
            currentDataState.adminSudah.push(mk);
            if(statGlobal[mk.jenjang]) statGlobal[mk.jenjang].sudah++;
        } else {
            currentDataState.adminBelum.push(mk);
            if(statGlobal[mk.jenjang]) statGlobal[mk.jenjang].belum++;
        }
    });

    // 3. RENDER CHARTS
    let jmlSudahGlobal = currentDataState.adminSudah.length;
    let jmlBelumGlobal = currentDataState.adminBelum.length;
    
    updateCharts(
        currentDataState.personalSudah.length, currentDataState.personalBelum.length, 
        jmlSudahGlobal, jmlBelumGlobal, 
        statPersonal, statGlobal
    );

    // 4. RENDER TABELS
    renderTables();
}

function renderTables() {
    const applyFilterSort = (arr) => {
        let filtered = arr.filter(mk => 
            mk.jenjang === activeJenjang && 
            String(mk.namaMK).toLowerCase().includes(searchKeyword)
        );
        filtered.sort((a, b) => {
            let nameA = String(a.namaMK).toLowerCase();
            let nameB = String(b.namaMK).toLowerCase();
            if (nameA < nameB) return isSortAscending ? -1 : 1;
            if (nameA > nameB) return isSortAscending ? 1 : -1;
            return 0;
        });
        return filtered;
    };

    // Render Personal
    const pBelum = applyFilterSort(currentDataState.personalBelum);
    const tbPBelum = document.getElementById("tableBelumUpload");
    tbPBelum.innerHTML = pBelum.length === 0 ? 
        (searchKeyword ? `<tr><td colspan="4" class="text-center text-muted py-3">Pencarian tidak ditemukan di ${activeJenjang}.</td></tr>` : `<tr><td colspan="4" class="text-center text-success py-3"><strong>Luar Biasa!</strong> Semua mata kuliah ${activeJenjang} Anda telah diupload.</td></tr>`) 
        : pBelum.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td></tr>`).join("");

    const pSudah = applyFilterSort(currentDataState.personalSudah);
    const tbPSudah = document.getElementById("tableSudahUpload");
    tbPSudah.innerHTML = pSudah.length === 0 ? 
        (searchKeyword ? `<tr><td colspan="5" class="text-center text-muted py-3">Pencarian tidak ditemukan di ${activeJenjang}.</td></tr>` : `<tr><td colspan="5" class="text-center text-muted py-3">Belum ada portofolio ${activeJenjang} yang Anda selesaikan di semester ini.</td></tr>`) 
        : pSudah.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td><td class="text-center"><span class="badge bg-success">Kelas: ${mk.kelasText}</span></td></tr>`).join("");

    // Render Admin
    if (ADMIN_EMAILS.includes(user.email)) {
        const aBelum = applyFilterSort(currentDataState.adminBelum);
        const tbABelum = document.getElementById("tableAdminBelum");
        tbABelum.innerHTML = aBelum.length === 0 ? 
            (searchKeyword ? `<tr><td colspan="5" class="text-center text-muted py-3">Pencarian tidak ditemukan di ${activeJenjang}.</td></tr>` : `<tr><td colspan="5" class="text-center text-success py-3"><strong>Luar Biasa!</strong> Semua mata kuliah ${activeJenjang} departemen telah diupload.</td></tr>`) 
            : aBelum.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td><td>${mk.dosenPengampu}</td></tr>`).join("");

        const aSudah = applyFilterSort(currentDataState.adminSudah);
        const tbASudah = document.getElementById("tableAdminSudah");
        tbASudah.innerHTML = aSudah.length === 0 ? 
            (searchKeyword ? `<tr><td colspan="5" class="text-center text-muted py-3">Pencarian tidak ditemukan di ${activeJenjang}.</td></tr>` : `<tr><td colspan="5" class="text-center text-muted py-3">Belum ada portofolio ${activeJenjang} departemen yang selesai di semester ini.</td></tr>`) 
            : aSudah.map((mk, i) => `<tr><td class="text-center">${i + 1}</td><td>${mk.semesterAsli}</td><td>${mk.kodeMK}</td><td class="fw-semibold">${mk.namaMK}</td><td class="text-center"><span class="badge bg-success">Kelas: ${mk.kelasText}</span></td></tr>`).join("");
    }
}

function updateCharts(sudahPersonal, belumPersonal, sudahGlobal, belumGlobal, statPersonal, statGlobal) {
    // 1. Chart Personal Utama
    const tP = sudahPersonal + belumPersonal;
    const pctP = tP > 0 ? `${Math.round((sudahPersonal / tP) * 100)}%` : "0%";
    
    if (myChartPersonal) myChartPersonal.destroy();
    myChartPersonal = new Chart(document.getElementById('chartPersonal'), {
        type: 'doughnut', 
        data: { labels: ['Sudah Upload', 'Belum Upload'], datasets: [{ data: [sudahPersonal, belumPersonal], backgroundColor: ['#198754', '#e9ecef'], borderWidth: 0 }] },
        options: { 
            responsive: true, maintainAspectRatio: false, cutout: '75%', 
            plugins: { legend: { position: 'bottom', labels: {boxWidth: 12} } },
            // Memanggil Plugin Teks
            elements: { center: { text: pctP, color: '#198754', font: 'bold 28px sans-serif' } }
        }
    });

    // HELPER: Mini Chart (Dengan Legenda & Teks Tengah)
    const createMiniChart = (id, inst, s, b, color, labelS = 'Sudah Upload', labelB = 'Belum Upload') => {
        const t = s + b;
        const pct = t > 0 ? `${Math.round((s / t) * 100)}%` : "0%";
        
        if (inst) inst.destroy();
        return new Chart(document.getElementById(id), {
            type: 'doughnut', 
            data: { labels: [labelS, labelB], datasets: [{ data: [s, b], backgroundColor: [color, '#e9ecef'], borderWidth: 0 }] },
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '70%', 
                plugins: { legend: { position: 'right', labels: {boxWidth: 10, font: {size: 11}} } },
                // Memanggil Plugin Teks
                elements: { center: { text: pct, color: color, font: 'bold 16px sans-serif' } }
            }
        });
    };

    // 2. Mini Charts Personal
    myChartPersonalS1 = createMiniChart('chartPersonalS1', myChartPersonalS1, statPersonal.S1.sudah, statPersonal.S1.belum, '#6f42c1');
    myChartPersonalS2 = createMiniChart('chartPersonalS2', myChartPersonalS2, statPersonal.S2.sudah, statPersonal.S2.belum, '#fd7e14');
    myChartPersonalS3 = createMiniChart('chartPersonalS3', myChartPersonalS3, statPersonal.S3.sudah, statPersonal.S3.belum, '#20c997');

    // 3. Chart Global Utama (Khusus Admin)
    if (document.getElementById('chartGlobal')) {
        const tG = sudahGlobal + belumGlobal;
        const pctG = tG > 0 ? `${Math.round((sudahGlobal / tG) * 100)}%` : "0%";
        
        if (myChartGlobal) myChartGlobal.destroy();
        myChartGlobal = new Chart(document.getElementById('chartGlobal'), {
            type: 'doughnut', 
            data: { labels: ['Total Uploaded', 'Sisa MK Departemen'], datasets: [{ data: [sudahGlobal, belumGlobal], backgroundColor: ['#0d6efd', '#e9ecef'], borderWidth: 0 }] },
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '75%', 
                plugins: { legend: { position: 'bottom', labels: {boxWidth: 12} } },
                // Memanggil Plugin Teks
                elements: { center: { text: pctG, color: '#0d6efd', font: 'bold 28px sans-serif' } }
            }
        });

        // 4. Mini Charts Global
        myChartGlobalS1 = createMiniChart('chartGlobalS1', myChartGlobalS1, statGlobal.S1.sudah, statGlobal.S1.belum, '#6f42c1');
        myChartGlobalS2 = createMiniChart('chartGlobalS2', myChartGlobalS2, statGlobal.S2.sudah, statGlobal.S2.belum, '#fd7e14');
        myChartGlobalS3 = createMiniChart('chartGlobalS3', myChartGlobalS3, statGlobal.S3.sudah, statGlobal.S3.belum, '#20c997');
    }
}

document.getElementById('toggleSidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');

    // Tutup semua submenu ketika sidebar dicollapse
    if (sidebar.classList.contains('collapsed')) {
        document.querySelectorAll('.sidebar .collapse.show').forEach(el => {
            const bsCollapse = bootstrap.Collapse.getInstance(el);
            if (bsCollapse) {
                bsCollapse.hide();
            } else {
                new bootstrap.Collapse(el, { toggle: false }).hide();
            }
        });
    }
});

function loadPage(eventOrPage, pagePath, key) {
    let finalPage, finalKey;

    if (typeof eventOrPage === 'object' && eventOrPage !== null) {
        if (eventOrPage.preventDefault) eventOrPage.preventDefault();
        finalPage = pagePath;
        finalKey = key;
    } else {
        finalPage = eventOrPage;
        finalKey = pagePath;
    }

    if (!finalPage || !finalKey || finalKey === "undefined") return;

    fetch(finalPage)
        .then(res => {
            if (!res.ok) throw new Error("Gagal mengambil file");
            return res.text();
        })
        .then(html => {
            document.getElementById("mainContent").innerHTML = html;

            const newUrl = window.location.origin + window.location.pathname + `?page=${finalKey}`;
            history.pushState({ page: finalPage, key: finalKey }, "", newUrl);

            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'))
            const activeLink = document.querySelector(`a[onclick*="'${finalKey}'"]`);
            if (activeLink) activeLink.classList.add('active');

            if (finalKey === 'buatporto') {
                loadScript('buatporto/buatPorto.js');
            } if (finalKey === 'rekapporto') {
                loadScript('rekapporto/rekapPorto.js');
            } if (finalKey === 'rekapmahasiswa') {
                loadScript('rekapmahasiswa/rekapMahasiswa.js');
            } if (finalKey === 'timeseriesProdi') {
                loadScript('timeseries/timeSeriesProdi.js');
            } if (finalKey === 'timeseriesMK') {
                loadScript('timeseries/timeSeriesMK.js');
            }
        })
        .catch(err => {
            console.error(err);
            document.getElementById("mainContent").innerHTML = 
                "<p class='text-danger'>Gagal memuat halaman.</p>";
        });
}

function loadScript(src) {
    const oldScript = document.querySelector(`script[src="${src}"]`);
    if (oldScript) {
        oldScript.remove(); // Hapus script lama jika ada
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
}

// Menangani kondisi ketika user menekan tombol 'Back' atau 'Forward' di browser
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        loadPage(event.state.page, event.state.key);
    } else {
        window.location.href = window.location.pathname; 
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const pageKey = params.get("page");

    const routes = {
        'buatporto': 'buatporto/buatPorto.html',
        'rekapporto': 'rekapporto/rekapPorto.html',
        'rekapmahasiswa': 'rekapmahasiswa/rekapMahasiswa.html',
        'timeseriesProdi': 'timeseries/timeSeriesProdi.html',
        'timeseriesMK': 'timeseries/timeSeriesMK.html'
    };

    if (pageKey && routes[pageKey]) {
        loadPage(routes[pageKey], pageKey);
    }
});

document.getElementById("btnLogout").addEventListener("click", (e) => {
    e.preventDefault();

    Swal.fire({
        title: 'Keluar dari Sistem?',
        text: "Anda harus login kembali untuk mengakses data penilaian.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', // Bootstrap Danger color
        cancelButtonColor: '#6c757d', // Bootstrap Secondary color
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            performLogout();
        }
    });
});

function performLogout() {
    try {
        const userRaw = sessionStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        const email = user?.email;

        if (window.google?.accounts?.id) {
            google.accounts.id.disableAutoSelect();
            if (email) {
                google.accounts.id.revoke(email, () => {
                    console.log("Google session revoked");
                });
            }
        }
    } catch (err) {
        console.warn("Logout cleanup error:", err);
    }

    sessionStorage.clear();
    localStorage.clear();
    
    // Optional: Show a quick success message before redirecting
    Swal.fire({
        title: 'Berhasil Keluar',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        window.location.href = "index.html";
    });
}