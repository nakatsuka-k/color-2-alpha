import os
import cv2
import numpy as np
from flask import Flask, request, render_template, send_file, flash, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from rembg import remove
from PIL import Image
import uuid
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# アップロードと処理済みファイルの保存ディレクトリ
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}

# ディレクトリが存在しない場合は作成
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def allowed_file(filename):
    """許可されたファイル拡張子かどうかをチェック"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def remove_background(input_image_path, output_image_path):
    """背景を除去する関数"""
    try:
        input_image = Image.open(input_image_path)
        output_image = remove(input_image)
        output_image.save(output_image_path)
        return True
    except Exception as e:
        print(f"Error in remove_background: {e}")
        return False

def apply_background_color(rgba_image_path, output_path, bg_color=(255, 255, 255)):
    """指定された背景色を適用する関数"""
    try:
        # RGBA画像を読み込み
        rgba_image = cv2.imread(rgba_image_path, cv2.IMREAD_UNCHANGED)
        if rgba_image is None:
            return False
        
        # アルファチャネルを取得
        if rgba_image.shape[2] == 4:
            alpha_channel = rgba_image[:, :, 3]
            rgb_image = rgba_image[:, :, :3]
        else:
            return False
        
        # 背景色の画像を作成
        background = np.full_like(rgb_image, bg_color, dtype=np.uint8)
        
        # アルファブレンディング
        alpha_norm = alpha_channel.astype(float) / 255.0
        alpha_norm = alpha_norm[:, :, np.newaxis]
        
        result = (rgb_image * alpha_norm + background * (1 - alpha_norm)).astype(np.uint8)
        
        cv2.imwrite(output_path, result)
        return True
    except Exception as e:
        print(f"Error in apply_background_color: {e}")
        return False

@app.route('/')
def index():
    """メインページ"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """ファイルアップロード処理"""
    if 'file' not in request.files:
        return jsonify({'error': 'ファイルが選択されていません'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'ファイルが選択されていません'}), 400
    
    if file and allowed_file(file.filename):
        # 安全なファイル名を生成
        filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 拡張子を取得
        file_ext = filename.rsplit('.', 1)[1].lower()
        original_filename = f"{timestamp}_{unique_id}_original.{file_ext}"
        processed_filename = f"{timestamp}_{unique_id}_processed.png"
        
        # ファイルを保存
        original_path = os.path.join(UPLOAD_FOLDER, original_filename)
        processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
        
        file.save(original_path)
        
        # 背景除去処理
        if remove_background(original_path, processed_path):
            return jsonify({
                'success': True,
                'original_filename': original_filename,
                'processed_filename': processed_filename,
                'message': '背景除去が完了しました'
            })
        else:
            return jsonify({'error': '背景除去処理に失敗しました'}), 500
    
    return jsonify({'error': '許可されていないファイル形式です'}), 400

@app.route('/apply_background', methods=['POST'])
def apply_background():
    """背景色適用処理"""
    data = request.get_json()
    processed_filename = data.get('processed_filename')
    bg_color_hex = data.get('bg_color', '#ffffff')
    
    if not processed_filename:
        return jsonify({'error': '処理済みファイル名が指定されていません'}), 400
    
    # HEX色をRGBに変換
    try:
        bg_color_hex = bg_color_hex.lstrip('#')
        bg_color = tuple(int(bg_color_hex[i:i+2], 16) for i in (0, 2, 4))
        # OpenCVはBGR順なので変換
        bg_color = (bg_color[2], bg_color[1], bg_color[0])
    except:
        bg_color = (255, 255, 255)  # デフォルトは白
    
    # ファイルパスを生成
    processed_path = os.path.join(PROCESSED_FOLDER, processed_filename)
    
    # 新しいファイル名を生成
    base_name = processed_filename.rsplit('.', 1)[0]
    final_filename = f"{base_name}_final.jpg"
    final_path = os.path.join(PROCESSED_FOLDER, final_filename)
    
    # 背景色適用
    if apply_background_color(processed_path, final_path, bg_color):
        return jsonify({
            'success': True,
            'final_filename': final_filename,
            'message': '背景色の適用が完了しました'
        })
    else:
        return jsonify({'error': '背景色の適用に失敗しました'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    """ファイルダウンロード"""
    # セキュリティチェック
    filename = secure_filename(filename)
    
    # まずprocessedフォルダをチェック
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    
    # 次にuploadsフォルダをチェック
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    
    return "ファイルが見つかりません", 404

@app.route('/preview/<filename>')
def preview_file(filename):
    """ファイルプレビュー"""
    filename = secure_filename(filename)
    
    # まずprocessedフォルダをチェック
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path)
    
    # 次にuploadsフォルダをチェック
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path)
    
    return "ファイルが見つかりません", 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
