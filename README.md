# 画像背景除去システム

AIを使用して画像の背景を自動的に除去し、新しい背景色を適用できるWebアプリケーションです。
<img width="1337" height="630" alt="image" src="https://github.com/user-attachments/assets/e24c54c8-29f7-4a1c-8102-d6dcc878beae" />

## 機能

- **自動背景除去**: rembgライブラリを使用したAI による高精度な背景除去
- **WebUI**: 直感的で使いやすいWebインターフェース
- **ドラッグ&ドロップ**: ファイルを簡単にアップロード
- **背景色変更**: 透明背景に任意の色を適用
- **プレビュー機能**: 処理前後の画像を並べて確認
- **複数フォーマット対応**: PNG、JPEG、GIF、BMPに対応

## セットアップ

### 必要な環境

- Python 3.7以上
- pip

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd color-2-alpha
```

2. 仮想環境を作成・アクティベート（推奨）
```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# または
.venv\Scripts\activate     # Windows
```

3. 依存パッケージをインストール
```bash
pip install -r requirements.txt
```

## 使用方法

1. アプリケーションを起動
```bash
python app.py
```

2. ブラウザで `http://localhost:5000` にアクセス

3. 画像をアップロード
   - ドラッグ&ドロップ、またはクリックしてファイルを選択
   - 対応形式: PNG、JPEG、GIF、BMP（最大16MB）

4. 自動的に背景除去処理が実行される

5. 必要に応じて背景色を設定・適用

6. 処理済み画像をダウンロード
   - 透明背景版（PNG）
   - 背景色付き版（JPEG）

## プロジェクト構造

```
color-2-alpha/
├── app.py                 # メインアプリケーション
├── requirements.txt       # 依存パッケージ
├── README.md             # このファイル
├── uploads/              # アップロード画像保存フォルダ
├── processed/            # 処理済み画像保存フォルダ
├── templates/
│   └── index.html        # メインページテンプレート
└── static/
    ├── css/
    │   └── style.css     # スタイルシート
    └── js/
        └── app.js        # JavaScript

```

## 使用技術

- **Backend**: Flask (Python)
- **AI処理**: rembg (背景除去)
- **画像処理**: PIL (Pillow), OpenCV
- **Frontend**: HTML5, CSS3, JavaScript
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome

## 注意事項

- 初回起動時、rembgが必要なAIモデルを自動ダウンロードするため時間がかかる場合があります
- GPU環境では `pip install rembg[gpu]` でGPU版をインストールすることで高速化できます
- アップロードされたファイルは `uploads/` と `processed/` フォルダに保存されます

## ライセンス

MIT License

## 貢献

バグ報告や機能改善の提案は、GitHubのIssueまたはPull Requestでお願いします。
