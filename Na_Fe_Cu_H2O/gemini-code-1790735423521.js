// --- ĐỐI TƯỢNG QUẢN LÝ TRẠNG THÁI THÍ NGHIỆM ---
const state = {
    selectedMetal: null, // 'Na', 'Fe', 'Cu'
    isRunning: false,
    isCompleted: false,
    results: {
        Na: { completed: false, obs: '', react: '' },
        Fe: { completed: false, obs: '', react: '' },
        Cu: { completed: false, obs: '', react: '' }
    },
    journalLogs: []
};

// Dữ liệu thí nghiệm cố định
const metalData = {
    Na: {
        name: 'Natri',
        formula: 'Na',
        colorClass: 'metal-Na-style',
        obsText: 'Mẫu Natri nóng chảy thành giọt tròn, nổi và nóng chảy chạy nhanh trên mặt nước, có bọt khí thoát ra mãnh liệt. Dung dịch chuyển sang màu hồng do tạo bazơ NaOH.',
        equation: '2Na + 2H₂O → 2NaOH + H₂↑',
        reactText: 'Có phản ứng mãnh liệt',
        tableObs: 'Nóng chảy thành giọt tròn, chạy trên mặt nước, có bọt khí \(H_2\), dung dịch hóa hồng.',
        tableReact: 'Có (Mãnh liệt)'
    },
    Fe: {
        name: 'Sắt',
        formula: 'Fe',
        colorClass: 'metal-Fe-style',
        obsText: 'Mảnh Sắt chìm xuống đáy cốc. Ở điều kiện thường, hầu như không có hiện tượng gì rõ rệt, không có bọt khí thoát ra.',
        equation: 'Ở điều kiện thường: Không phản ứng rõ rệt.\n(Lưu ý: Ở nhiệt độ cao, Fe phản ứng với hơi nước: 3Fe + 4H₂O ⎯t°→ Fe₃O₄ + 4H₂↑)',
        reactText: 'Không phản ứng ở điều kiện thường',
        tableObs: 'Chìm xuống đáy cốc, không có bọt khí, không đổi màu dung dịch.',
        tableReact: 'Không đáng kể'
    },
    Cu: {
        name: 'Đồng',
        formula: 'Cu',
        colorClass: 'metal-Cu-style',
        obsText: 'Mảnh Đồng chìm xuống đáy cốc. Không có bọt khí, không có bất kỳ hiện tượng phản ứng nào xảy ra.',
        equation: 'Cu + H₂O → Không phản ứng (kể cả ở nhiệt độ cao)',
        reactText: 'Không phản ứng',
        tableObs: 'Chìm xuống đáy cốc, giữ nguyên màu sắc, không có hiện tượng.',
        tableReact: 'Không'
    }
};

// Khởi tạo Audio Synthesizer (Âm thanh giả lập thuần JS)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'bubble') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'hiss') {
            // Tiếng xèo xèo của Na
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {
        // Bỏ qua nếu trình duyệt chặn audio
    }
}

// --- CÁC HÀM XỬ LÝ CHỌN KIM LOẠI ---
function selectMetal(metal) {
    if (state.isRunning) return;

    state.selectedMetal = metal;

    // Cập nhật giao diện nút
    document.querySelectorAll('.btn-metal').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`btn-select-${metal.toLowerCase()}`).classList.add('selected');

    // Hiển thị kim loại trên kẹp
    const heldMetal = document.getElementById('held-metal');
    heldMetal.className = 'held-metal-piece ' + metalData[metal].colorClass;
    heldMetal.style.display = 'block';

    // Đưa kẹp xuống vị trí chuẩn bị
    const tongs = document.getElementById('tongs');
    tongs.style.top = '10px';

    // Bật nút thả
    document.getElementById('btn-drop').disabled = false;

    // Cập nhật trạng thái
    updateStatus('Đang chuẩn bị', 'status-idle');
    document.getElementById('observation-text').innerText = `Đã gắp mẫu ${metalData[metal].name}. Sẵn sàng thả vào nước.`;
}

// --- HÀM BẮT ĐẦU THẢ KIM LOẠI ---
function dropMetal() {
    if (!state.selectedMetal || state.isRunning) return;

    state.isRunning = true;
    document.getElementById('btn-drop').disabled = true;
    document.querySelectorAll('.btn-metal').forEach(b => b.disabled = true);
    updateStatus('Đang tiến hành thí nghiệm...', 'status-running');

    const metal = state.selectedMetal;
    const tongs = document.getElementById('tongs');
    const heldMetal = document.getElementById('held-metal');
    const simMetal = document.getElementById('sim-metal');

    // Thả kẹp gắp xuống
    tongs.style.top = '70px';

    setTimeout(() => {
        // Giọt kim loại rơi vào nước
        heldMetal.style.display = 'none';
        tongs.style.top = '-60px'; // Thu kẹp lên

        simMetal.className = 'sim-metal-piece ' + metalData[metal].colorClass;
        simMetal.style.display = 'block';

        if (metal === 'Na') {
            runNaSimulation();
        } else if (metal === 'Fe') {
            runFeSimulation();
        } else if (metal === 'Cu') {
            runCuSimulation();
        }
    }, 800);
}

// --- MÔ PHỎNG NATRI (Na) ---
function runNaSimulation() {
    const simMetal = document.getElementById('sim-metal');
    const water = document.getElementById('water-liquid');
    const flame = document.getElementById('na-flame');
    const bubbleContainer = document.getElementById('bubble-container');

    // Na nổi trên mặt nước
    simMetal.style.top = '58px';
    simMetal.style.left = '70px';
    simMetal.style.borderRadius = '50%'; // Nóng chảy thành giọt tròn

    let step = 0;
    const interval = setInterval(() => {
        step++;
        
        // Na chạy ngẫu nhiên trên mặt nước
        const randomX = 20 + Math.random() * 110;
        simMetal.style.left = `${randomX}px`;

        // Ngọn lửa nhỏ đi kèm
        flame.style.display = 'block';
        flame.style.left = `${randomX + 2}px`;
        flame.style.top = '52px';

        // Tạo bọt khí H2
        createBubble(bubbleContainer, randomX + 4, 60);
        playSound('hiss');

        // Dung dịch chuyển dần sang hồng (NaOH)
        if (step === 10) {
            water.classList.add('alkaline');
        }

        // Natri tan dần
        const size = Math.max(0, 16 - step);
        simMetal.style.width = `${size}px`;
        simMetal.style.height = `${size}px`;

        if (step >= 15) {
            clearInterval(interval);
            simMetal.style.display = 'none';
            flame.style.display = 'none';
            finishExperiment('Na');
        }
    }, 300);
}

// --- MÔ PHỎNG SẮT (Fe) ---
function runFeSimulation() {
    const simMetal = document.getElementById('sim-metal');

    // Fe chìm xuống đáy
    simMetal.style.left = '72px';
    simMetal.style.top = '58px';
    simMetal.style.transition = 'top 1s cubic-bezier(0.5, 0, 0.5, 1)';

    setTimeout(() => {
        simMetal.style.top = '145px'; // Chìm dưới đáy
    }, 100);

    setTimeout(() => {
        finishExperiment('Fe');
    }, 1500);
}

// --- MÔ PHỎNG ĐỒNG (Cu) ---
function runCuSimulation() {
    const simMetal = document.getElementById('sim-metal');

    // Cu chìm xuống đáy
    simMetal.style.left = '72px';
    simMetal.style.top = '58px';
    simMetal.style.transition = 'top 1s cubic-bezier(0.5, 0, 0.5, 1)';

    setTimeout(() => {
        simMetal.style.top = '145px';
    }, 100);

    setTimeout(() => {
        finishExperiment('Cu');
    }, 1500);
}

// --- TẠO BỌT KHÍ CSS ---
function createBubble(container, xPos, yPos) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = Math.random() * 6 + 4;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${xPos}px`;
    bubble.style.top = `${yPos}px`;
    container.appendChild(bubble);

    playSound('bubble');

    setTimeout(() => {
        bubble.remove();
    }, 1000);
}

// --- HOÀN THÀNH THÍ NGHIỆM ---
function finishExperiment(metal) {
    state.isRunning = false;
    state.isCompleted = true;

    updateStatus('Đã hoàn thành', 'status-completed');

    // Hiển thị hiện tượng
    const data = metalData[metal];
    document.getElementById('observation-text').innerText = data.obsText;

    // Cập nhật bảng kết quả
    document.getElementById(`res-${metal.toLowerCase()}-obs`).innerText = data.tableObs;
    document.getElementById(`res-${metal.toLowerCase()}-react`).innerText = data.tableReact;

    // Cập nhật phương trình
    document.getElementById('equation-content').innerText = data.equation;

    // Mở lại các nút
    document.querySelectorAll('.btn-metal').forEach(b => b.disabled = false);
}

// --- CẬP NHẬT TRẠNG THÁI ---
function updateStatus(text, className) {
    const statusElem = document.getElementById('status-text');
    statusElem.innerText = text;
    statusElem.className = `status-value ${className}`;
}

// --- HIỂN THỊ / ẨN PHƯƠNG TRÌNH ---
function toggleEquation() {
    const eqBox = document.getElementById('equation-box');
    eqBox.classList.toggle('hidden');
}

// --- LÀM LẠI THÍ NGHIỆM (RESET) ---
function resetExperiment() {
    state.selectedMetal = null;
    state.isRunning = false;
    state.isCompleted = false;

    // Reset giao diện nút
    document.querySelectorAll('.btn-metal').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    document.getElementById('btn-drop').disabled = true;

    // Reset kẹp và mẫu
    const tongs = document.getElementById('tongs');
    tongs.style.top = '-60px';
    document.getElementById('held-metal').style.display = 'none';

    // Reset cốc thí nghiệm
    const simMetal = document.getElementById('sim-metal');
    simMetal.style.display = 'none';
    simMetal.style.transition = 'none';

    document.getElementById('na-flame').style.display = 'none';
    document.getElementById('water-liquid').classList.remove('alkaline');
    document.getElementById('bubble-container').innerHTML = '';

    // Reset quan sát
    document.getElementById('observation-text').innerText = 'Vui lòng chọn kim loại và nhấn "THẢ KIM LOẠI VÀO NƯỚC" để tiến hành thí nghiệm.';
    document.getElementById('equation-box').classList.add('hidden');

    updateStatus('Đang chuẩn bị', 'status-idle');
}

// --- XỬ LÝ NHẬT KÝ THÍ NGHIỆM ---
function saveJournal(e) {
    e.preventDefault();

    const metal = document.getElementById('j-metal').value;
    const reaction = document.getElementById('j-reaction').value;
    const obs = document.getElementById('j-obs').value;
    const eq = document.getElementById('j-eq').value;

    if (!metal || !reaction || !obs) return;

    const logItem = {
        metal,
        reaction,
        obs,
        eq,
        time: new Date().toLocaleTimeString()
    };

    state.journalLogs.unshift(logItem);
    renderLogs();

    // Reset form
    document.getElementById('journal-form').reset();
}

function renderLogs() {
    const logsList = document.getElementById('logs-list');
    if (state.journalLogs.length === 0) {
        logsList.innerHTML = '