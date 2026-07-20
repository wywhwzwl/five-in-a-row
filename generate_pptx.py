#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
五子棋游戏 PowerPoint 演示文稿生成器（精简版）
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn

# ===================== 色彩体系 =====================
COLOR_BG_DARK    = RGBColor(0x2C, 0x18, 0x10)
COLOR_BG_MID     = RGBColor(0x4A, 0x2C, 0x1A)
COLOR_WOOD       = RGBColor(0xDC, 0xB3, 0x5C)
COLOR_WOOD_DARK  = RGBColor(0xC8, 0x9A, 0x4A)
COLOR_BORDER     = RGBColor(0x3A, 0x24, 0x18)
COLOR_FRAME      = RGBColor(0x8B, 0x6F, 0x47)
COLOR_TEXT_LIGHT = RGBColor(0xF4, 0xE4, 0xBC)
COLOR_TEXT_GOLD  = RGBColor(0xD4, 0xB8, 0x7A)
COLOR_RED        = RGBColor(0xC0, 0x39, 0x2B)
COLOR_RED_BRIGHT = RGBColor(0xE7, 0x4C, 0x3C)
COLOR_BLACK      = RGBColor(0x1A, 0x1A, 0x1A)
COLOR_WHITE      = RGBColor(0xFA, 0xFA, 0xFA)
COLOR_GREEN      = RGBColor(0x2E, 0xCC, 0x71)

# ===================== 演示文稿配置 =====================
prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SLIDE_W = prs.slide_width
SLIDE_H = prs.slide_height

# ===================== 工具函数 =====================
def set_slide_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_rect(slide, x, y, w, h, color, line_color=None):
    rect = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    rect.fill.solid()
    rect.fill.fore_color.rgb = color
    if line_color is None:
        rect.line.fill.background()
    else:
        rect.line.color.rgb = line_color
        rect.line.width = Pt(1.5)
    rect.shadow.inherit = False
    return rect

def add_text(slide, x, y, w, h, text, font_size=18, bold=False,
             color=COLOR_TEXT_LIGHT, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, font_name='Microsoft YaHei'):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.05)
    tf.margin_top = tf.margin_bottom = Inches(0.05)
    tf.vertical_anchor = anchor

    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font_name
    return tb

def add_circle(slide, x, y, size, color):
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, size, size)
    circle.fill.solid()
    circle.fill.fore_color.rgb = color
    circle.line.fill.background()
    circle.shadow.inherit = False
    return circle

def add_piece(slide, cx, cy, size, is_black):
    edge_color = COLOR_BORDER if is_black else RGBColor(0x88, 0x88, 0x88)
    add_circle(slide, cx - size//2, cy - size//2, size, edge_color)
    main_color = COLOR_BLACK if is_black else COLOR_WHITE
    add_circle(slide, cx - size//2 + 1, cy - size//2 + 1, size - 2, main_color)
    hl_x = cx - size//2 + size//4
    hl_y = cy - size//2 + size//4
    hl_size = max(2, size // 3)
    add_circle(slide, hl_x, hl_y, hl_size,
               RGBColor(0x55, 0x55, 0x55) if is_black else RGBColor(0xFF, 0xFF, 0xFF))

def add_board(slide, x, y, cell_size, pieces=None):
    rows, cols = 15, 15
    board_w = cols * cell_size
    board_h = rows * cell_size

    add_rect(slide, x - 4, y - 4, board_w + 8, board_h + 8, COLOR_BORDER)
    add_rect(slide, x, y, board_w, board_h, COLOR_WOOD)

    for i in range(rows + 1):
        line = slide.shapes.add_connector(1,
            x, y + i * cell_size, x + board_w, y + i * cell_size)
        line.line.color.rgb = COLOR_BORDER
        line.line.width = Pt(0.5 if i not in (0, rows) else 1.2)

    for j in range(cols + 1):
        line = slide.shapes.add_connector(1,
            x + j * cell_size, y, x + j * cell_size, y + board_h)
        line.line.color.rgb = COLOR_BORDER
        line.line.width = Pt(0.5 if j not in (0, cols) else 1.2)

    for r, c in [(3, 3), (3, 11), (7, 7), (11, 3), (11, 11)]:
        sx = x + c * cell_size
        sy = y + r * cell_size
        star = slide.shapes.add_shape(MSO_SHAPE.OVAL, sx - 3, sy - 3, 6, 6)
        star.fill.solid()
        star.fill.fore_color.rgb = COLOR_BORDER
        star.line.fill.background()

    if pieces:
        piece_size = int(cell_size * 0.85)
        for r, c, is_black in pieces:
            px = x + c * cell_size
            py = y + r * cell_size
            add_piece(slide, px, py, piece_size, is_black)

def add_footer(slide, page_num, total=13):
    add_rect(slide, 0, SLIDE_H - Inches(0.3), SLIDE_W, Inches(0.3), COLOR_BG_MID)
    add_text(slide, Inches(0.3), SLIDE_H - Inches(0.28), Inches(4), Inches(0.25),
             '🎮 五子棋 · GOMOKU', font_size=10, color=COLOR_TEXT_GOLD)
    add_text(slide, SLIDE_W - Inches(2), SLIDE_H - Inches(0.28), Inches(1.7), Inches(0.25),
             f'{page_num} / {total}', font_size=10, color=COLOR_TEXT_GOLD,
             align=PP_ALIGN.RIGHT)

def add_page_header(slide, title, subtitle):
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.9), COLOR_BG_MID)
    add_text(slide, Inches(0.5), Inches(0.2), Inches(12), Inches(0.5),
             title, font_size=26, bold=True, color=COLOR_WOOD)
    add_text(slide, Inches(0.5), Inches(0.6), Inches(12), Inches(0.3),
             subtitle, font_size=11, color=COLOR_TEXT_GOLD, font_name='Consolas')


# ===================== Slide 1: 封面 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_board(slide, Inches(3.5), Inches(0.5), Inches(0.42),
    pieces=[(7, 7, True), (7, 8, False), (8, 7, False), (8, 8, True)])

add_rect(slide, 0, Inches(3.5), SLIDE_W, Inches(2.5), COLOR_BG_MID)

add_text(slide, Inches(0.5), Inches(3.8), Inches(12.3), Inches(1.0),
         '五 子 棋', font_size=72, bold=True, color=COLOR_WOOD,
         align=PP_ALIGN.CENTER)

add_text(slide, Inches(0.5), Inches(4.8), Inches(12.3), Inches(0.6),
         'F I V E - I N - A - R O W   ·   G O M O K U',
         font_size=20, color=COLOR_TEXT_GOLD, align=PP_ALIGN.CENTER,
         font_name='Consolas')

add_rect(slide, Inches(5.5), Inches(5.5), Inches(2.3), Inches(0.04), COLOR_RED_BRIGHT)

add_text(slide, Inches(0.5), Inches(5.7), Inches(12.3), Inches(0.4),
         '打开网页即可与 AI 对弈',
         font_size=18, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_rect(slide, Inches(5.5), Inches(6.3), Inches(2.3), Inches(0.4), COLOR_RED)
add_text(slide, Inches(5.5), Inches(6.32), Inches(2.3), Inches(0.35),
         'v 1.0 . 0', font_size=14, bold=True, color=COLOR_TEXT_LIGHT,
         align=PP_ALIGN.CENTER)

add_footer(slide, 1)
print('Slide 1 done')


# ===================== Slide 2: 目录 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '目  录', 'CONTENTS')

toc_items = [
    ('01', '一句话概括', '游戏定位与核心卖点'),
    ('02', '核心亮点', '视觉、AI、规则、控制'),
    ('03', '三档 AI 对手', '难度梯度与风格对比'),
    ('04', 'Renju 禁手规则', '专业竞赛级规则'),
    ('05', '30 秒上手', '四步极速开局'),
    ('06', '对比优势', 'vs 市面常见五子棋'),
]

for i, (num, title, desc) in enumerate(toc_items):
    y = Inches(1.6 + i * 0.85)

    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(1), y, Inches(0.65), Inches(0.65))
    circle.fill.solid()
    circle.fill.fore_color.rgb = COLOR_FRAME
    circle.line.color.rgb = COLOR_WOOD
    circle.line.width = Pt(1)
    circle.shadow.inherit = False
    tf = circle.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = num
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = COLOR_WOOD
    r.font.name = 'Consolas'

    add_text(slide, Inches(2), y + Inches(0.05), Inches(4), Inches(0.4),
             title, font_size=22, bold=True, color=COLOR_TEXT_LIGHT)
    add_text(slide, Inches(6), y + Inches(0.12), Inches(7), Inches(0.4),
             desc, font_size=14, color=COLOR_TEXT_GOLD)

add_footer(slide, 2)
print('Slide 2 done')


# ===================== Slide 3: 一句话概括 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '01 · 一句话概括', 'ONE-LINE PITCH')

add_text(slide, Inches(0.5), Inches(1.3), Inches(12.3), Inches(1.2),
         '"', font_size=180, bold=True, color=COLOR_RED,
         align=PP_ALIGN.CENTER, font_name='Georgia')

add_text(slide, Inches(1), Inches(2.5), Inches(11.3), Inches(1.5),
         '打开网页即可与 AI 对弈',
         font_size=54, bold=True, color=COLOR_WOOD, align=PP_ALIGN.CENTER)

add_text(slide, Inches(1), Inches(4.2), Inches(11.3), Inches(0.5),
         '木质典雅棋盘 · 三档 AI 难度 · 专业 Renju 禁手规则',
         font_size=20, color=COLOR_TEXT_GOLD, align=PP_ALIGN.CENTER)

badges = [
    ('🎨', '视觉出众', '立体棋子 + 弹性动画'),
    ('🤖', 'AI 智能', '三档可调，进阶挑战'),
    ('⚖️', '规则专业', '完整 Renju 禁手'),
]

for i, (icon, title, desc) in enumerate(badges):
    x = Inches(1.5 + i * 3.5)
    add_rect(slide, x, Inches(5.3), Inches(3), Inches(1.5), COLOR_BG_MID)
    add_rect(slide, x, Inches(5.3), Inches(3), Inches(0.08), COLOR_WOOD)

    add_text(slide, x, Inches(5.4), Inches(3), Inches(0.5),
             icon, font_size=32, align=PP_ALIGN.CENTER)
    add_text(slide, x, Inches(5.95), Inches(3), Inches(0.4),
             title, font_size=18, bold=True, color=COLOR_WOOD,
             align=PP_ALIGN.CENTER)
    add_text(slide, x, Inches(6.4), Inches(3), Inches(0.35),
             desc, font_size=12, color=COLOR_TEXT_LIGHT,
             align=PP_ALIGN.CENTER)

add_footer(slide, 3)
print('Slide 3 done')


# ===================== Slide 4: 核心亮点 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '02 · 核心亮点', 'CORE FEATURES')

add_text(slide, Inches(0.5), Inches(1.2), Inches(6), Inches(0.4),
         '视觉体验 · VISUAL', font_size=16, bold=True, color=COLOR_WOOD)

add_board(slide, Inches(0.7), Inches(1.7), Inches(0.34),
    pieces=[(7, 7, True), (7, 8, False), (8, 8, True)])

features = [
    ('🎨 视觉体验', '立体棋子、悬停预览、胜利高亮'),
    ('🤖 三档 AI', 'V1.0 随机 / V2.0 防御 / V3.0 评分'),
    ('⚖️ Renju 规则', '长连/双四/双三 完整禁手判定'),
    ('🛠️ 完整控制', '悔棋、重开、棋谱、快捷键'),
]

for i, (title, desc) in enumerate(features):
    y = Inches(1.5 + i * 1.2)
    add_rect(slide, Inches(6.5), y, Inches(6.3), Inches(1.0), COLOR_BG_MID)
    add_rect(slide, Inches(6.5), y, Inches(0.1), Inches(1.0), COLOR_WOOD)
    add_text(slide, Inches(6.8), y + Inches(0.15), Inches(6), Inches(0.4),
             title, font_size=18, bold=True, color=COLOR_WOOD)
    add_text(slide, Inches(6.8), y + Inches(0.55), Inches(6), Inches(0.4),
             desc, font_size=13, color=COLOR_TEXT_LIGHT)

add_rect(slide, Inches(6.5), Inches(6.3), Inches(6.3), Inches(0.6), COLOR_RED)
add_text(slide, Inches(6.5), Inches(6.4), Inches(6.3), Inches(0.4),
         '💡 难度可对局中随时切换，无需重新开始',
         font_size=14, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_footer(slide, 4)
print('Slide 4 done')


# ===================== Slide 5: 三档 AI =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '03 · 三档 AI 对手', 'PROGRESSIVE AI DIFFICULTY')

ai_versions = [
    {
        'version': 'V1.0', 'name': '随机模式', 'difficulty': '★☆☆☆☆',
        'color': COLOR_GREEN, 'desc': '从空位中随机选点',
        'detail': '• 完全随机落子\n• 用于娱乐 / 调试 UI\n• 思考时间 < 1ms',
    },
    {
        'version': 'V2.0', 'name': '防御模式', 'difficulty': '★★★☆☆',
        'color': RGBColor(0xF3, 0x9C, 0x12), 'desc': '扫描玩家活三/冲四',
        'detail': '• 4 级优先级判定\n• 主动封堵玩家威胁\n• 思考时间 ~5ms',
    },
    {
        'version': 'V3.0', 'name': '评分模式', 'difficulty': '★★★★★',
        'color': COLOR_RED, 'desc': '攻防权重综合评分',
        'detail': '• 双端形状评分\n• 主动制造陷阱\n• 思考时间 ~15ms',
    },
]

for i, ai in enumerate(ai_versions):
    x = Inches(0.5 + i * 4.3)
    add_rect(slide, x, Inches(1.4), Inches(4), Inches(5.2), COLOR_BG_MID)
    add_rect(slide, x, Inches(1.4), Inches(4), Inches(0.5), ai['color'])

    add_text(slide, x, Inches(1.45), Inches(4), Inches(0.4),
             ai['version'], font_size=22, bold=True, color=COLOR_TEXT_LIGHT,
             align=PP_ALIGN.CENTER, font_name='Consolas')

    add_text(slide, x, Inches(2.05), Inches(4), Inches(0.5),
             ai['name'], font_size=24, bold=True, color=COLOR_WOOD,
             align=PP_ALIGN.CENTER)

    add_text(slide, x, Inches(2.6), Inches(4), Inches(0.4),
             ai['difficulty'], font_size=18, color=ai['color'],
             align=PP_ALIGN.CENTER)

    add_rect(slide, x + Inches(0.5), Inches(3.15), Inches(3), Inches(0.02),
             ai['color'])

    add_text(slide, x + Inches(0.3), Inches(3.4), Inches(3.4), Inches(0.5),
             ai['desc'], font_size=14, color=COLOR_TEXT_GOLD,
             align=PP_ALIGN.CENTER)

    add_text(slide, x + Inches(0.3), Inches(4.3), Inches(3.4), Inches(2.0),
             ai['detail'], font_size=13, color=COLOR_TEXT_LIGHT)

add_rect(slide, Inches(0.5), Inches(6.8), Inches(12.3), Inches(0.4), COLOR_RED)
add_text(slide, Inches(0.5), Inches(6.82), Inches(12.3), Inches(0.35),
         '🎮 通过下拉框或数字键 1·2·3 实时切换难度',
         font_size=14, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_footer(slide, 5)
print('Slide 5 done')


# ===================== Slide 6: Renju 禁手 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '04 · Renju 禁手规则', 'PROFESSIONAL GAME RULES')

add_rect(slide, Inches(0.5), Inches(1.4), Inches(6), Inches(5.4), COLOR_BG_MID)
add_rect(slide, Inches(0.5), Inches(1.4), Inches(6), Inches(0.08), COLOR_RED)

add_text(slide, Inches(0.7), Inches(1.6), Inches(5.6), Inches(0.4),
         '⚖️ 三类禁手', font_size=18, bold=True, color=COLOR_WOOD)

forbidden_rules = [
    ('🚫 长连禁手', '连六或以上', '黑棋出现 6+ 连续子判负'),
    ('🚫 四四禁手', '双冲四 / 双活四', '同时存在两个四必胜点'),
    ('🚫 三三禁手', '双活三', '同时存在两个活三必胜点'),
]

for i, (name, cond, desc) in enumerate(forbidden_rules):
    y = Inches(2.2 + i * 1.3)
    add_text(slide, Inches(0.7), y, Inches(5.6), Inches(0.4),
             name, font_size=16, bold=True, color=COLOR_RED_BRIGHT)
    add_text(slide, Inches(0.9), y + Inches(0.45), Inches(5.4), Inches(0.35),
             f'条件: {cond}', font_size=13, color=COLOR_WOOD)
    add_text(slide, Inches(0.9), y + Inches(0.78), Inches(5.4), Inches(0.35),
             f'说明: {desc}', font_size=12, color=COLOR_TEXT_GOLD)

add_rect(slide, Inches(0.5), Inches(6.3), Inches(6), Inches(0.4), COLOR_FRAME)
add_text(slide, Inches(0.5), Inches(6.32), Inches(6), Inches(0.35),
         '仅黑棋适用禁手 · 白棋自由五即胜',
         font_size=13, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_text(slide, Inches(7), Inches(1.5), Inches(5.8), Inches(0.4),
         '📐 禁手示例', font_size=18, bold=True, color=COLOR_WOOD)

add_text(slide, Inches(7), Inches(2.0), Inches(5.8), Inches(0.3),
         '三三禁手: 同时形成两个活三', font_size=12, color=COLOR_TEXT_GOLD)
add_board(slide, Inches(7.2), Inches(2.4), Inches(0.3),
    pieces=[(3, 3, True), (3, 5, True), (5, 4, True)])

add_text(slide, Inches(7), Inches(4.4), Inches(5.8), Inches(0.3),
         '长连禁手: 连六或以上', font_size=12, color=COLOR_TEXT_GOLD)
add_board(slide, Inches(7.2), Inches(4.8), Inches(0.3),
    pieces=[(3, 2, True), (3, 3, True), (3, 4, True),
            (3, 5, True), (3, 6, True), (3, 7, True)])

add_footer(slide, 6)
print('Slide 6 done')


# ===================== Slide 7: 控制 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '05 · 完整对局控制', 'FULL GAME CONTROLS')

controls = [
    {'icon': '↶', 'name': '悔棋', 'shortcut': 'Ctrl + Z', 'desc': '撤销玩家+AI 两步'},
    {'icon': '🔄', 'name': '重新开始', 'shortcut': 'Ctrl + R', 'desc': '清空棋盘，棋谱保留'},
    {'icon': '🗑️', 'name': '清空棋谱', 'shortcut': '—', 'desc': '抹去所有历史记录'},
    {'icon': '⚙️', 'name': '难度切换', 'shortcut': '1 / 2 / 3', 'desc': '实时切换 V1.0 / V2.0 / V3.0'},
]

for i, ctrl in enumerate(controls):
    row = i // 2
    col = i % 2
    x = Inches(0.5 + col * 6.3)
    y = Inches(1.5 + row * 2.5)

    add_rect(slide, x, y, Inches(6), Inches(2.2), COLOR_BG_MID)
    add_rect(slide, x, y, Inches(0.15), Inches(2.2), COLOR_WOOD)

    add_circle(slide, x + Inches(0.4), y + Inches(0.5), Inches(1.2), COLOR_FRAME)
    add_text(slide, x + Inches(0.4), y + Inches(0.7), Inches(1.2), Inches(0.8),
             ctrl['icon'], font_size=36, color=COLOR_WOOD, align=PP_ALIGN.CENTER)

    add_text(slide, x + Inches(1.8), y + Inches(0.3), Inches(4), Inches(0.5),
             ctrl['name'], font_size=22, bold=True, color=COLOR_WOOD)

    add_rect(slide, x + Inches(1.8), y + Inches(0.95), Inches(1.5), Inches(0.4), COLOR_FRAME)
    add_text(slide, x + Inches(1.8), y + Inches(0.98), Inches(1.5), Inches(0.35),
             ctrl['shortcut'], font_size=11, bold=True, color=COLOR_WOOD,
             align=PP_ALIGN.CENTER, font_name='Consolas')

    add_text(slide, x + Inches(1.8), y + Inches(1.5), Inches(4), Inches(0.5),
             ctrl['desc'], font_size=14, color=COLOR_TEXT_LIGHT)

add_rect(slide, Inches(0.5), Inches(6.7), Inches(12.3), Inches(0.4), COLOR_RED)
add_text(slide, Inches(0.5), Inches(6.72), Inches(12.3), Inches(0.35),
         '⌨️ 全部操作支持键盘快捷键，无需鼠标也能玩',
         font_size=14, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_footer(slide, 7)
print('Slide 7 done')


# ===================== Slide 8: 30秒上手 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '06 · 30 秒上手', 'GET STARTED IN 30 SECONDS')

steps = [
    ('1', '双击', 'index.html', '浏览器自动打开\n零安装零依赖'),
    ('2', '点击', '棋盘落子', '你的黑棋立即落下\n状态栏实时反馈'),
    ('3', '等待', 'AI 回应', '状态栏显示\n🤖 AI 思考中'),
    ('4', '连五', '胜利', '触发红线高亮\n自动记录到棋谱'),
]

step_w = Inches(2.9)
step_h = Inches(4.5)
gap = Inches(0.15)
total_w = step_w * 4 + gap * 3
start_x = (SLIDE_W - total_w) / 2

for i, (num, action, target, desc) in enumerate(steps):
    x = start_x + i * (step_w + gap)
    y = Inches(1.5)

    add_rect(slide, x, y, step_w, step_h, COLOR_BG_MID)

    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL,
        x + step_w/2 - Inches(0.5), y - Inches(0.4), Inches(1), Inches(1))
    circle.fill.solid()
    circle.fill.fore_color.rgb = COLOR_RED
    circle.line.color.rgb = COLOR_WOOD
    circle.line.width = Pt(3)
    circle.shadow.inherit = False
    tf = circle.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = num
    r.font.size = Pt(36)
    r.font.bold = True
    r.font.color.rgb = COLOR_TEXT_LIGHT
    r.font.name = 'Consolas'

    add_text(slide, x, y + Inches(0.8), step_w, Inches(0.5),
             action, font_size=28, bold=True, color=COLOR_WOOD,
             align=PP_ALIGN.CENTER)

    add_rect(slide, x + Inches(1), y + Inches(1.45), step_w - Inches(2),
             Inches(0.03), COLOR_WOOD)

    add_text(slide, x, y + Inches(1.65), step_w, Inches(0.4),
             target, font_size=16, bold=True, color=COLOR_TEXT_GOLD,
             align=PP_ALIGN.CENTER, font_name='Consolas')

    add_text(slide, x + Inches(0.3), y + Inches(2.3), step_w - Inches(0.6),
             Inches(1.8), desc, font_size=13, color=COLOR_TEXT_LIGHT,
             align=PP_ALIGN.CENTER)

    if i < 3:
        arrow = slide.shapes.add_shape(
            MSO_SHAPE.RIGHT_ARROW,
            x + step_w + Inches(-0.05),
            y + step_h/2 - Inches(0.15),
            gap + Inches(0.1), Inches(0.3))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = COLOR_WOOD
        arrow.line.fill.background()
        arrow.shadow.inherit = False

add_rect(slide, Inches(0.5), Inches(6.3), Inches(12.3), Inches(0.6), COLOR_GREEN)
add_text(slide, Inches(0.5), Inches(6.32), Inches(12.3), Inches(0.55),
         '✅ 无需注册 · 无需联网 · 无需学习成本',
         font_size=18, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_footer(slide, 8)
print('Slide 8 done')


# ===================== Slide 9: 棋盘规格 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '07 · 棋盘规格', 'BOARD SPECIFICATIONS')

add_text(slide, Inches(0.5), Inches(1.3), Inches(6), Inches(0.4),
         '📐 技术规格', font_size=18, bold=True, color=COLOR_WOOD)

specs = [
    ('棋盘尺寸', '15 × 15 标准'),
    ('格点间距', '40 像素'),
    ('边框留白', '30 像素'),
    ('星标位置', '5 个（天元 + 四小目）'),
    ('渲染精度', '高 DPI 适配（2x/3x 视网膜屏）'),
    ('动画时长', '200ms 弹性缓动'),
]

for i, (name, value) in enumerate(specs):
    y = Inches(1.8 + i * 0.55)
    add_rect(slide, Inches(0.5), y, Inches(6), Inches(0.45), COLOR_BG_MID)
    add_text(slide, Inches(0.7), y + Inches(0.08), Inches(2.5), Inches(0.3),
             name, font_size=13, color=COLOR_TEXT_GOLD)
    add_text(slide, Inches(3.2), y + Inches(0.08), Inches(3.2), Inches(0.3),
             value, font_size=14, bold=True, color=COLOR_TEXT_LIGHT)

add_text(slide, Inches(7), Inches(1.3), Inches(6), Inches(0.4),
         '🎯 标准 15×15 棋盘', font_size=18, bold=True, color=COLOR_WOOD)

add_board(slide, Inches(7.5), Inches(1.8), Inches(0.32),
    pieces=[
        (3, 3, True), (3, 11, True),
        (11, 3, True), (11, 11, True),
        (7, 7, True),
        (7, 6, False), (7, 8, False), (6, 7, False), (8, 7, False),
    ])

add_footer(slide, 9)
print('Slide 9 done')


# ===================== Slide 10: 对比优势 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '08 · 为什么选择这一款', 'WHY CHOOSE US')

table_y = Inches(1.4)
col_widths = [Inches(3.5), Inches(4.5), Inches(4.3)]
col_x = [Inches(0.5), Inches(0.5) + col_widths[0], Inches(0.5) + col_widths[0] + col_widths[1]]

headers = ['对比维度', '市面常见', '本作']
for i, h in enumerate(headers):
    add_rect(slide, col_x[i], table_y, col_widths[i], Inches(0.5),
             COLOR_FRAME if i == 2 else COLOR_BG_MID)
    add_text(slide, col_x[i], table_y + Inches(0.12), col_widths[i], Inches(0.3),
             h, font_size=14, bold=True, color=COLOR_WOOD, align=PP_ALIGN.CENTER)

rows = [
    ('安装要求', '需下载 App', '零安装 双击即用'),
    ('广告骚扰', '通常有开屏广告', '纯净无广告'),
    ('AI 智能度', '大多固定难度', '三档可调 渐进升级'),
    ('规则支持', '多为自由规则', '完整 Renju 禁手'),
    ('复盘能力', '普遍缺失', '完整棋谱面板'),
    ('离线可用', '多需联网', '100% 本地运行'),
    ('数据隐私', '可能上传云端', '零数据外传'),
]

for i, (dim, other, ours) in enumerate(rows):
    y = table_y + Inches(0.5 + i * 0.65)

    add_rect(slide, col_x[0], y, col_widths[0], Inches(0.6), COLOR_BG_MID)
    add_text(slide, col_x[0], y + Inches(0.18), col_widths[0], Inches(0.3),
             dim, font_size=13, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

    add_rect(slide, col_x[1], y, col_widths[1], Inches(0.6), RGBColor(0x35, 0x20, 0x18))
    add_text(slide, col_x[1], y + Inches(0.18), col_widths[1], Inches(0.3),
             other, font_size=12, color=COLOR_TEXT_GOLD, align=PP_ALIGN.CENTER)

    add_rect(slide, col_x[2], y, col_widths[2], Inches(0.6), COLOR_GREEN)
    add_text(slide, col_x[2], y + Inches(0.18), col_widths[2], Inches(0.3),
             '✓ ' + ours, font_size=12, bold=True, color=COLOR_TEXT_LIGHT,
             align=PP_ALIGN.CENTER)

add_footer(slide, 10)
print('Slide 10 done')


# ===================== Slide 11: 适用场景 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '09 · 适用场景', 'USE CASES')

scenarios = [
    ('🎓', '教学演示', 'Renju 规则、禁手判定可视化教学'),
    ('👨‍👩‍👧', '亲子互动', '与孩子一起挑战 AI，锻炼逻辑思维'),
    ('🧠', '碎片化休闲', '午休、通勤时一局，3-5 分钟可完'),
    ('🏆', '进阶挑战', '研究 AI 评分算法，不断精进棋艺'),
    ('💻', '开发者参考', '纯前端实现的高质量游戏代码范例'),
    ('🎁', '礼物馈赠', '无需安装的轻量娱乐，老少皆宜'),
]

for i, (icon, title, desc) in enumerate(scenarios):
    row = i // 3
    col = i % 3
    x = Inches(0.5 + col * 4.3)
    y = Inches(1.4 + row * 2.8)

    add_rect(slide, x, y, Inches(4), Inches(2.5), COLOR_BG_MID)
    add_rect(slide, x, y, Inches(0.12), Inches(2.5), COLOR_WOOD)

    add_text(slide, x, y + Inches(0.3), Inches(4), Inches(0.9),
             icon, font_size=52, align=PP_ALIGN.CENTER)

    add_text(slide, x, y + Inches(1.3), Inches(4), Inches(0.5),
             title, font_size=22, bold=True, color=COLOR_WOOD, align=PP_ALIGN.CENTER)

    add_text(slide, x + Inches(0.2), y + Inches(1.85), Inches(3.6), Inches(0.6),
             desc, font_size=13, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_footer(slide, 11)
print('Slide 11 done')


# ===================== Slide 12: 界面预览 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_page_header(slide, '10 · 界面预览', 'INTERFACE PREVIEW')

add_board(slide, Inches(0.7), Inches(1.5), Inches(0.32),
    pieces=[
        (3, 3, True), (3, 4, True), (3, 5, True),
        (7, 7, True),
        (5, 5, False), (5, 6, False), (5, 7, False),
        (8, 8, False),
        (10, 10, True), (10, 11, False),
    ])

add_text(slide, Inches(6.5), Inches(1.3), Inches(6.3), Inches(0.4),
         '🖥️ 界面元素', font_size=18, bold=True, color=COLOR_WOOD)

add_rect(slide, Inches(6.5), Inches(1.8), Inches(6.3), Inches(0.5), COLOR_BG_MID)
add_rect(slide, Inches(6.5), Inches(1.8), Inches(0.08), Inches(0.5), COLOR_WOOD)
add_text(slide, Inches(6.7), Inches(1.9), Inches(6), Inches(0.35),
         '🤖 AI 思考中 (V3.0)…',
         font_size=14, color=COLOR_TEXT_LIGHT)

add_rect(slide, Inches(6.5), Inches(2.5), Inches(6.3), Inches(3.3), COLOR_BG_MID)
add_rect(slide, Inches(6.5), Inches(2.5), Inches(6.3), Inches(0.4), COLOR_FRAME)
add_text(slide, Inches(6.7), Inches(2.55), Inches(3), Inches(0.3),
         '📜 棋谱', font_size=13, bold=True, color=COLOR_WOOD)
add_text(slide, Inches(11), Inches(2.55), Inches(1.7), Inches(0.3),
         '8 手', font_size=11, color=COLOR_TEXT_GOLD, align=PP_ALIGN.RIGHT)

moves = [
    ('1', '●', '(4,4)'),
    ('2', '○', '(6,6)'),
    ('3', '●', '(4,5)'),
    ('4', '○', '(6,7)'),
    ('5', '●', '(4,6)'),
    ('6', '○', '(6,8)'),
    ('7', '●', '(8,8)'),
    ('8', '○', '(11,11)'),
]

for i, (num, mark, pos) in enumerate(moves):
    y = Inches(3.0 + i * 0.32)
    color = COLOR_BLACK if mark == '●' else COLOR_TEXT_LIGHT
    add_text(slide, Inches(6.7), y, Inches(0.5), Inches(0.25),
             num, font_size=11, color=COLOR_TEXT_GOLD)
    add_text(slide, Inches(7.3), y, Inches(0.5), Inches(0.25),
             mark, font_size=14, bold=True, color=color, font_name='Consolas')
    add_text(slide, Inches(8), y, Inches(2), Inches(0.25),
             pos, font_size=11, color=COLOR_TEXT_LIGHT, font_name='Consolas')

btns = ['↶ 悔棋', '🔄 重开', '🗑️ 清空']
for i, btn in enumerate(btns):
    x = Inches(6.5 + i * 2.15)
    is_primary = i == 1
    color = COLOR_RED if is_primary else COLOR_FRAME
    add_rect(slide, x, Inches(6.05), Inches(2), Inches(0.5), color)
    add_text(slide, x, Inches(6.13), Inches(2), Inches(0.35),
             btn, font_size=12, bold=True, color=COLOR_TEXT_LIGHT,
             align=PP_ALIGN.CENTER)

add_rect(slide, Inches(6.5), Inches(6.7), Inches(6.3), Inches(0.4), COLOR_BG_MID)
add_text(slide, Inches(6.7), Inches(6.74), Inches(6), Inches(0.32),
         '⚙️ AI 难度: V3.0 (评分)',
         font_size=12, bold=True, color=COLOR_WOOD)

add_footer(slide, 12)
print('Slide 12 done')


# ===================== Slide 13: 结语 =====================
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide, COLOR_BG_DARK)

add_board(slide, Inches(4.5), Inches(0.5), Inches(0.34),
    pieces=[
        (7, 7, True), (7, 8, False),
        (6, 7, True), (8, 7, False),
        (7, 6, False), (7, 9, True),
        (5, 5, True), (9, 9, False),
        (5, 9, False), (9, 5, True),
    ])

add_rect(slide, Inches(0.5), Inches(3.5), Inches(12.3), Inches(2.8), COLOR_BG_DARK)

add_text(slide, Inches(0.5), Inches(3.7), Inches(12.3), Inches(1.2),
         '享受每一局对弈',
         font_size=64, bold=True, color=COLOR_WOOD, align=PP_ALIGN.CENTER)

add_text(slide, Inches(0.5), Inches(4.9), Inches(12.3), Inches(0.6),
         '棋 乐 无 穷',
         font_size=32, color=COLOR_TEXT_GOLD, align=PP_ALIGN.CENTER)

add_rect(slide, Inches(5.5), Inches(5.6), Inches(2.3), Inches(0.04), COLOR_RED_BRIGHT)

add_text(slide, Inches(0.5), Inches(5.8), Inches(12.3), Inches(0.4),
         '🎮 现在就打开 index.html 开始你的第一局',
         font_size=16, bold=True, color=COLOR_TEXT_LIGHT, align=PP_ALIGN.CENTER)

add_footer(slide, 13)
print('Slide 13 done')


# ===================== 保存 =====================
output_path = '五子棋游戏-用户推广.pptx'
prs.save(output_path)
print(f'\n✅ PowerPoint 创建成功: {output_path}')
print(f'📊 共 {len(prs.slides)} 张幻灯片')

import os
size = os.path.getsize(output_path)
if size < 1024:
    print(f'📁 文件大小: {size} B')
elif size < 1024 * 1024:
    print(f'📁 文件大小: {size / 1024:.1f} KB')
else:
    print(f'📁 文件大小: {size / (1024 * 1024):.2f} MB')