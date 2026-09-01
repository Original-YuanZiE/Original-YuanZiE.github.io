---
title: "欢迎来到我的博客"
date: "2025-09-01"
tags: ["博客", "示例", "Markdown"]
summary: "这是一篇示例文章，展示了博客的 Markdown 渲染效果，包括标题、列表、表格、代码块、引用等常见元素。"
---

# 欢迎来到我的博客

这是第一篇示例文章，用于展示博客的 Markdown 渲染能力。如果你能看到这篇文章，说明博客已经成功运行！

## 文本样式

这是一段普通文本。你可以使用 **粗体**、*斜体*、~~删除线~~ 以及 `行内代码` 等样式。

> 这是一段引用文字。Markdown 让写作变得简单而优雅。

## 列表

### 无序列表

- 第一项
- 第二项
  - 嵌套项目 A
  - 嵌套项目 B
- 第三项

### 有序列表

1. 步骤一：准备环境
2. 步骤二：编写内容
3. 步骤三：发布文章

## 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown 渲染 | ✅ 已完成 | 支持 GFM 语法 |
| 代码高亮 | ✅ 已完成 | 基于 highlight.js |
| 深色主题 | ✅ 已完成 | 跟随系统自动切换 |
| 响应式布局 | ✅ 已完成 | 移动端自适应 |

## 代码块

JavaScript 示例：

```javascript
function greet(name) {
  console.log(`你好，${name}！欢迎访问我的博客。`);
}

greet('世界');
```

Python 示例：

```python
def fibonacci(n):
    """生成斐波那契数列"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for num in fibonacci(10):
    print(num)
```

CSS 示例：

```css
.card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

## 图片

SVG 图片：

![示例 SVG 图片](Assets/sample.svg)

PNG 图片：

![示例 PNG 图片](Assets/sample.png)

## 数学公式（纯文本表示）

欧拉公式：e^(iπ) + 1 = 0

二次方程求根公式：x = (-b ± √(b²-4ac)) / 2a

## 分隔线

---

## 链接

访问 [GitHub](https://github.com) 了解更多开源项目。

## 结语

这篇示例文章展示了常见的 Markdown 元素。你可以参考 `Posts/hello-world/main.md` 的格式来编写自己的文章。

每篇文章放在 `Posts/` 目录下的独立文件夹中，包含一个 `main.md` 主文件和一个 `Assets/` 资源文件夹。记得在 `Posts/index.json` 中添加文章索引条目！
