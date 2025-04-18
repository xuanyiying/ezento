# 转换 SVG 到 PNG 的说明

如果你需要将SVG头像转换为PNG格式，可以使用以下几种方法：

## 方法一：使用浏览器

1. 在浏览器中打开 `avatar-preview.html` 文件
2. 右键点击SVG图像
3. 选择"保存图片为..."选项
4. 保存为PNG格式

## 方法二：使用命令行工具

如果安装了Node.js，可以使用以下工具：

```bash
# 安装svg2png
npm install -g svg2png

# 转换文件
svg2png assistant-avatar.svg -o assistant-avatar.png -w 200 -h 200
```

## 方法三：使用在线转换工具

可以使用以下在线工具之一：

1. [SVG to PNG Converter](https://svgtopng.com/)
2. [CloudConvert](https://cloudconvert.com/svg-to-png)
3. [EZGIF](https://ezgif.com/svg-to-png)

## 其他尺寸

建议准备以下尺寸的PNG头像：

- 40x40 (聊天界面小头像)
- 120x120 (中等尺寸显示)
- 200x200 (高分辨率显示)

将处理好的PNG文件放在相同目录下即可。
