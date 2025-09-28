// グローバル変数
let currentFiles = {
    original: null,
    processed: null,
    final: null
};

// DOM要素の取得
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const backgroundSettings = document.getElementById('backgroundSettings');
const downloadSection = document.getElementById('downloadSection');
const bgColorPicker = document.getElementById('bgColorPicker');
const applyBgBtn = document.getElementById('applyBgBtn');
const downloadTransparentBtn = document.getElementById('downloadTransparentBtn');
const downloadFinalBtn = document.getElementById('downloadFinalBtn');
const originalPreview = document.getElementById('originalPreview');
const processedPreview = document.getElementById('processedPreview');
const alertArea = document.getElementById('alertArea');

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupColorPresets();
});

function setupEventListeners() {
    // ファイル入力関連
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // 背景色関連
    applyBgBtn.addEventListener('click', applyBackgroundColor);
    bgColorPicker.addEventListener('change', updateColorPreview);
    
    // ダウンロード関連
    downloadTransparentBtn.addEventListener('click', () => downloadFile('transparent'));
    downloadFinalBtn.addEventListener('click', () => downloadFile('final'));
}

function setupColorPresets() {
    const colorPresets = document.querySelectorAll('.color-preset');
    colorPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            const color = this.dataset.color;
            bgColorPicker.value = color;
            updateActivePreset(this);
        });
    });
}

function updateActivePreset(activeElement) {
    document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
    activeElement.classList.add('active');
}

// ドラッグ&ドロップ処理
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// ファイル処理
function processFile(file) {
    // ファイル形式チェック
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('許可されていないファイル形式です。PNG、JPEG、GIF、BMPファイルを選択してください。', 'danger');
        return;
    }
    
    // ファイルサイズチェック (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showAlert('ファイルサイズが大きすぎます。16MB以下のファイルを選択してください。', 'danger');
        return;
    }
    
    // プレビュー表示
    showOriginalPreview(file);
    
    // アップロード実行
    uploadFile(file);
}

function showOriginalPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        originalPreview.innerHTML = `<img src="${e.target.result}" alt="Original Image" class="fade-in">`;
    };
    reader.readAsDataURL(file);
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // UI更新
    showProgress(true);
    updateProgress(10, 'ファイルをアップロード中...');
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentFiles.original = data.original_filename;
            currentFiles.processed = data.processed_filename;
            
            updateProgress(80, '背景除去処理中...');
            
            // 処理済み画像のプレビュー表示
            setTimeout(() => {
                showProcessedPreview(data.processed_filename);
                updateProgress(100, '完了！');
                
                setTimeout(() => {
                    showProgress(false);
                    showBackgroundSettings();
                    showDownloadSection();
                }, 500);
            }, 1000);
            
            showAlert(data.message, 'success');
        } else {
            showProgress(false);
            showAlert(data.error || 'アップロードに失敗しました', 'danger');
        }
    })
    .catch(error => {
        showProgress(false);
        showAlert('ネットワークエラーが発生しました', 'danger');
        console.error('Error:', error);
    });
}

function showProcessedPreview(filename) {
    const imageUrl = `/preview/${filename}`;
    processedPreview.innerHTML = `<img src="${imageUrl}" alt="Processed Image" class="fade-in">`;
}

function applyBackgroundColor() {
    if (!currentFiles.processed) {
        showAlert('処理済み画像がありません', 'warning');
        return;
    }
    
    const bgColor = bgColorPicker.value;
    
    applyBgBtn.disabled = true;
    applyBgBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>適用中...';
    
    fetch('/apply_background', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            processed_filename: currentFiles.processed,
            bg_color: bgColor
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentFiles.final = data.final_filename;
            
            // 処理後画像を更新
            const imageUrl = `/preview/${data.final_filename}`;
            processedPreview.innerHTML = `<img src="${imageUrl}" alt="Final Image" class="fade-in">`;
            
            // 最終版ダウンロードボタンを表示
            downloadFinalBtn.classList.remove('d-none');
            
            showAlert(data.message, 'success');
        } else {
            showAlert(data.error || '背景色の適用に失敗しました', 'danger');
        }
    })
    .catch(error => {
        showAlert('ネットワークエラーが発生しました', 'danger');
        console.error('Error:', error);
    })
    .finally(() => {
        applyBgBtn.disabled = false;
        applyBgBtn.innerHTML = '適用';
    });
}

function downloadFile(type) {
    let filename;
    if (type === 'transparent' && currentFiles.processed) {
        filename = currentFiles.processed;
    } else if (type === 'final' && currentFiles.final) {
        filename = currentFiles.final;
    } else {
        showAlert('ダウンロードするファイルがありません', 'warning');
        return;
    }
    
    // ダウンロードリンクを作成して実行
    const link = document.createElement('a');
    link.href = `/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('ダウンロードを開始しました', 'info');
}

// UI制御関数
function showProgress(show) {
    progressSection.classList.toggle('d-none', !show);
}

function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = text;
}

function showBackgroundSettings() {
    backgroundSettings.classList.remove('d-none');
    backgroundSettings.classList.add('fade-in');
}

function showDownloadSection() {
    downloadSection.classList.remove('d-none');
    downloadSection.classList.add('fade-in');
}

function updateColorPreview() {
    // カラープリセットの選択状態をリセット
    document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
}

function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertArea.innerHTML = alertHtml;
    
    // 自動で消す（成功・情報メッセージの場合）
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            const alert = alertArea.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ページリロード時の確認
window.addEventListener('beforeunload', function(e) {
    if (currentFiles.processed || currentFiles.final) {
        e.preventDefault();
        e.returnValue = '';
    }
});
