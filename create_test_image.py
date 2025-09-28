#!/usr/bin/env python3
"""
テスト用の簡単なサンプル画像を作成するスクリプト
"""

from PIL import Image, ImageDraw
import os

def create_test_image():
    """テスト用の画像を作成"""
    # 画像サイズ
    width, height = 400, 300
    
    # 白背景の画像を作成
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # カラフルな円を描画
    draw.ellipse([50, 50, 150, 150], fill='red', outline='darkred', width=3)
    draw.ellipse([200, 100, 350, 250], fill='blue', outline='darkblue', width=3)
    draw.ellipse([100, 150, 200, 250], fill='green', outline='darkgreen', width=3)
    
    # テキストを追加
    draw.text((160, 50), 'TEST IMAGE', fill='black')
    
    # 保存
    test_image_path = 'test_sample.jpg'
    image.save(test_image_path)
    print(f"テスト画像を作成しました: {test_image_path}")
    return test_image_path

if __name__ == '__main__':
    create_test_image()
