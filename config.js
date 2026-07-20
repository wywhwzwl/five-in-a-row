/**
 * config.js — 不可变常量配置
 * 协议铁律 #3: 魔法数字替换 — 所有尺寸/颜色/权重集中于此
 * 任何业务模块均应通过此对象读取，禁止硬编码
 */
const CONFIG = Object.freeze({
  // ===== 棋盘几何 =====
  BOARD_SIZE: 15,           // 标准 15×15 棋盘
  CELL_SIZE: 40,            // 每格像素
  PADDING: 30,              // 边框偏移（用于星标与坐标换算）
  // 计算后的派生量（不可变）
  CANVAS_SIZE: 30 + 40 * 14 + 30,  // = 620px (PADDING + 14 格 + PADDING)
  GRID_COUNT: 14,           // 线条数（15 个交叉点需要 14 条线段）

  // ===== 视觉色板（木质典雅风） =====
  COLORS: {
    BOARD_BG: '#dcb35c',        // 木质主色
    BOARD_BG_DARK: '#c89a4a',   // 木纹阴影
    BOARD_BG_GRAIN: '#8b6f47',  // 木纹纹理
    LINE: '#3a2418',            // 棋盘线
    STAR: '#2a1a10',            // 星标点
    HOVER: 'rgba(80, 200, 120, 0.45)',     // 悬停预览绿
    HOVER_CORNER: '#2ecc71',    // 悬停四角定位块
    BLACK_PIECE_INNER: '#000',
    BLACK_PIECE_OUTER: '#555',
    WHITE_PIECE_INNER: '#fff',
    WHITE_PIECE_OUTER: '#ccc',
    PIECE_STROKE_BLACK: '#000',
    PIECE_STROKE_WHITE: '#888',
    PIECE_HIGHLIGHT_BLACK: 'rgba(255,255,255,0.25)',
    PIECE_HIGHLIGHT_WHITE: 'rgba(255,255,255,0.6)',
    WIN_LINE: '#e74c3c',        // 胜利连线高亮
    LAST_MOVE_MARK: '#e74c3c',  // 最后一手红圈标记
  },

  // ===== 视觉尺寸（视觉细节常量，P0/P1 修复后集中管理） =====
  VISUAL: {
    STAR_RADIUS: 4,             // 星标半径
    PIECE_PADDING: 2,           // 棋子距格子边缘
    PIECE_HIGHLIGHT_OFFSET: 0.35,   // 高光点位置偏移系数
    PIECE_HIGHLIGHT_SIZE: 0.18,     // 高光点大小系数
    WOOD_GRAIN_SPACING: 4,      // 木纹间距
    HOVER_INNER_OFFSET: 3,      // hover 圆内缩
    HOVER_CORNER_SIZE: 4,       // hover 四角方块边长
    HOVER_CORNER_GAP: 2,        // hover 四角方块距边缘
    LAST_MOVE_MARK_RADIUS: 6,   // 最后一手标记半径
    LAST_MOVE_MARK_WIDTH: 2,    // 最后一手标记线宽
    WIN_LINE_WIDTH: 4,          // 胜利线宽
    WIN_LINE_ALPHA: 0.85,       // 胜利线透明度
  },

  // ===== 星标位置（天元 + 四个小目） =====
  // 标准棋盘: 天元(7,7), 小目(3,3)(3,11)(11,3)(11,11)
  STAR_POINTS: [
    [3, 3], [3, 11], [7, 7],
    [11, 3], [11, 11]
  ],

  // ===== 动画时长（毫秒） =====
  ANIMATION: {
    PIECE_DROP_MS: 200,        // 棋子落子缩放动画
    HOVER_FADE_MS: 120,        // 悬停指示器淡入淡出
    OVERSHOOT: 0.05,           // 弹性曲线过冲幅度
    AI_THINK_DELAY_MS: 50,     // AI 让出主线程延迟
  },

  // ===== 游戏规则 =====
  RULES: {
    FORBIDDEN_FOR_BLACK: true, // 黑棋禁手（协议阶段 0 用户确认）
    EXACT_FIVE_WIN: true,      // 黑棋需恰好五胜（长连判负）
    FREE_FIVE_FOR_WHITE: true, // 白棋无禁手，连五即胜
  },

  // ===== AI V3.0 评分权重 =====
  AI_WEIGHTS: {
    ONE_OPEN: 10,
    TWO_OPEN: 100,
    THREE_OPEN: 1000,
    FOUR_OPEN: 10000,
    FIVE: 1000000,
    DEFENSE_MULTIPLIER: 1.1,   // 防守权重略高于进攻
  }
});

// 暴露到全局（纯 HTML/JS 项目无模块系统，需手动挂载）
window.CONFIG = CONFIG;