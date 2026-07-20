/**
 * renderer.js — Canvas 渲染层
 *
 * 协议约束：
 *  1. 分层解耦：本文件仅负责"画"，不持有游戏规则/胜负判定
 *  2. 像素级精确：所有坐标换算均动态读取 getBoundingClientRect()
 *  3. 不可变数据：render() 接收外部传入的 board 快照，永不直接修改
 *
 * 公开 API：
 *  - Renderer.init(canvasEl, config)
 *  - Renderer.render(board, options)         // options: { hover:{r,c}, lastMove, winLine }
 *  - Renderer.getCellFromEvent(mouseEvent)   // 像素→棋盘坐标
 *  - Renderer.animateDrop(row, col, player)  // 落子缩放动画
 */
const Renderer = (() => {
  let canvas, ctx, cfg;
  let dpr = 1;                        // 高 DPI 缩放因子
  let animFrameId = null;             // requestAnimationFrame 句柄
  let hoverCell = null;               // 当前悬停的格子 {r, c}
  let boardSnapshot = null;           // 最近一次渲染的棋盘快照（深拷贝）
  let renderOptions = {};             // 最近一次渲染选项
  let clickHandler = null;            // 外部注册的点击回调

  // ===== 私有工具 =====
  const cellToPixel = (row, col) => ({
    x: cfg.PADDING + col * cfg.CELL_SIZE,
    y: cfg.PADDING + row * cfg.CELL_SIZE
  });

  /**
   * 像素级精确：动态读取 BoundingRect 换算棋盘坐标
   * 解决协议铁律 #2 提到的"边框偏移魔数"问题
   */
  const pixelToCell = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    // Bug 修复：原代码误用 scaleX = canvas.width / rect.width = dpr
    // 导致 CSS 像素被乘以 dpr 转设备像素，与 PADDING/CELL_SIZE(均为 CSS 像素常量)错乱
    // 正确逻辑：ctx.scale(dpr,dpr) 已统一绘图坐标系为 CSS 像素，mouse event 坐标也是 CSS 像素
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const col = Math.round((px - cfg.PADDING) / cfg.CELL_SIZE);
    const row = Math.round((py - cfg.PADDING) / cfg.CELL_SIZE);

    if (row < 0 || row >= cfg.BOARD_SIZE || col < 0 || col >= cfg.BOARD_SIZE) {
      return null;
    }
    return { row, col };
  };

  // ===== 绘制：木质背景 =====
  const drawWoodenBackground = () => {
    const { CANVAS_SIZE, COLORS, VISUAL } = cfg;
    // 1) 渐变底色
    const grad = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    grad.addColorStop(0, COLORS.BOARD_BG);
    grad.addColorStop(1, COLORS.BOARD_BG_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2) 木纹纹理（细密横纹）
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = COLORS.BOARD_BG_GRAIN;
    ctx.lineWidth = 1;
    for (let y = 0; y < CANVAS_SIZE; y += VISUAL.WOOD_GRAIN_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y * 0.05) * 2);
      ctx.lineTo(CANVAS_SIZE, y + Math.cos(y * 0.05) * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  // ===== 绘制：网格线 =====
  const drawGrid = () => {
    const { PADDING, CELL_SIZE, GRID_COUNT, COLORS } = cfg;
    ctx.strokeStyle = COLORS.LINE;
    ctx.lineWidth = 1;

    // 横线
    for (let i = 0; i <= GRID_COUNT; i++) {
      const y = PADDING + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + GRID_COUNT * CELL_SIZE, y);
      ctx.stroke();
    }
    // 竖线
    for (let i = 0; i <= GRID_COUNT; i++) {
      const x = PADDING + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + GRID_COUNT * CELL_SIZE);
      ctx.stroke();
    }

    // 边框加粗
    ctx.lineWidth = 2;
    ctx.strokeRect(
      PADDING, PADDING,
      GRID_COUNT * CELL_SIZE, GRID_COUNT * CELL_SIZE
    );
  };

  // ===== 绘制：星标（天元+四小目） =====
  const drawStarPoints = () => {
    const { STAR_POINTS, COLORS, VISUAL } = cfg;
    ctx.fillStyle = COLORS.STAR;
    for (const [row, col] of STAR_POINTS) {
      const { x, y } = cellToPixel(row, col);
      ctx.beginPath();
      ctx.arc(x, y, VISUAL.STAR_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ===== 绘制：棋子（径向渐变立体感） =====
  const drawPiece = (row, col, player, scale = 1) => {
    if (!player) return;
    const { COLORS, CELL_SIZE, VISUAL } = cfg;
    const { x, y } = cellToPixel(row, col);
    const radius = (CELL_SIZE / 2 - VISUAL.PIECE_PADDING) * scale;
    if (radius <= 0) return;

    // 径向渐变：内亮外暗，制造立体感
    const grad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );

    if (player === 1) {
      // 黑棋：中心偏灰、外缘深黑
      grad.addColorStop(0, COLORS.BLACK_PIECE_OUTER);
      grad.addColorStop(1, COLORS.BLACK_PIECE_INNER);
    } else {
      // 白棋：中心纯白、外缘灰
      grad.addColorStop(0, COLORS.WHITE_PIECE_INNER);
      grad.addColorStop(1, COLORS.WHITE_PIECE_OUTER);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 边缘描边增强立体
    ctx.strokeStyle = player === 1 ? COLORS.PIECE_STROKE_BLACK : COLORS.PIECE_STROKE_WHITE;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 高光点（左上）
    if (scale > 0.5) {
      ctx.fillStyle = player === 1
        ? COLORS.PIECE_HIGHLIGHT_BLACK
        : COLORS.PIECE_HIGHLIGHT_WHITE;
      ctx.beginPath();
      ctx.arc(
        x - radius * VISUAL.PIECE_HIGHLIGHT_OFFSET,
        y - radius * VISUAL.PIECE_HIGHLIGHT_OFFSET,
        radius * VISUAL.PIECE_HIGHLIGHT_SIZE,
        0, Math.PI * 2
      );
      ctx.fill();
    }
  };

  // ===== 绘制：悬停预览指示器 =====
  const drawHoverIndicator = () => {
    if (!hoverCell || !boardSnapshot) return;
    const { row, col } = hoverCell;
    // 已有棋子则不画预览
    if (boardSnapshot[row][col] !== 0) return;

    const { x, y } = cellToPixel(row, col);
    const { COLORS, CELL_SIZE, VISUAL } = cfg;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = COLORS.HOVER;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - VISUAL.HOVER_INNER_OFFSET, 0, Math.PI * 2);
    ctx.fill();

    // 四角小方块提示
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLORS.HOVER_CORNER;
    const s = VISUAL.HOVER_CORNER_SIZE;
    const off = CELL_SIZE / 2 - VISUAL.HOVER_CORNER_GAP;
    ctx.fillRect(x - off - s, y - off - s, s, s);
    ctx.fillRect(x + off,     y - off - s, s, s);
    ctx.fillRect(x - off - s, y + off,     s, s);
    ctx.fillRect(x + off,     y + off,     s, s);
    ctx.restore();
  };

  // ===== 绘制：最后一手标记 + 胜利连线 =====
  const drawOverlays = () => {
    if (!boardSnapshot) return;
    const { lastMove, winLine } = renderOptions;

    // 最后落子红点
    if (lastMove) {
      const { x, y } = cellToPixel(lastMove.row, lastMove.col);
      ctx.save();
      // P0 修复：消除硬编码色值，复用 COLORS.WIN_LINE
      ctx.strokeStyle = cfg.COLORS.LAST_MOVE_MARK;
      ctx.lineWidth = cfg.LAST_MOVE_MARK_WIDTH;
      ctx.beginPath();
      ctx.arc(x, y, cfg.LAST_MOVE_MARK_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 胜利连线高亮
    if (winLine && winLine.length >= 2) {
      const { COLORS, VISUAL } = cfg;
      ctx.save();
      ctx.strokeStyle = COLORS.WIN_LINE;
      ctx.lineWidth = VISUAL.WIN_LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.globalAlpha = VISUAL.WIN_LINE_ALPHA;
      ctx.beginPath();
      const start = cellToPixel(winLine[0].row, winLine[0].col);
      const end = cellToPixel(winLine[winLine.length - 1].row, winLine[winLine.length - 1].col);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  // ===== 全量重绘（离屏友好） =====
  const renderAll = () => {
    if (!boardSnapshot) return;
    ctx.clearRect(0, 0, cfg.CANVAS_SIZE, cfg.CANVAS_SIZE);
    drawWoodenBackground();
    drawGrid();
    drawStarPoints();
    drawOverlays();

    // 绘制所有棋子（按落子顺序以便动画时单独处理最后一颗）
    for (let r = 0; r < cfg.BOARD_SIZE; r++) {
      for (let c = 0; c < cfg.BOARD_SIZE; c++) {
        if (boardSnapshot[r][c] !== 0) {
          drawPiece(r, c, boardSnapshot[r][c], 1);
        }
      }
    }

    drawHoverIndicator();
  };

  // ===== 落子缩放动画（0 → 1 弹性） =====
  // P0 修复：visibilitychange 取消 animFrameId 后 Promise 永远不 resolve 导致死锁
  // 增加 cancelled 标记，停止时主动 resolve
  const animateDrop = (row, col, player, duration = cfg.ANIMATION.PIECE_DROP_MS) => {
    return new Promise(resolve => {
      let cancelled = false;
      const start = performance.now();
      const overshoot = cfg.ANIMATION.OVERSHOOT;
      const ease = (t) => {
        // 弹性缓动：1 - (1-t)^3 + 轻微过冲
        const u = 1 - Math.pow(1 - t, 3);
        return u + Math.sin(u * Math.PI * 2) * overshoot;
      };

      const cleanup = () => {
        cancelled = true;
        animFrameId = null;
        resolve();   // 关键：取消时也 resolve，避免 await 永久挂起
      };

      const step = (now) => {
        if (cancelled) return;
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const scale = Math.max(0, ease(t));

        // 只重绘该棋子所在层
        renderAll();
        drawPiece(row, col, player, scale);

        if (t < 1) {
          animFrameId = requestAnimationFrame(step);
        } else {
          animFrameId = null;
          resolve();
        }
      };
      animFrameId = requestAnimationFrame(step);

      // 提供外部取消钩子（由 visibilitychange 与 destroy 调用）
      Renderer._cancelAnim = cleanup;
    });
  };

  // ===== 事件绑定（协议要求：AbortController 防止泄漏） =====
  const bindEvents = () => {
    const controller = new AbortController();

    canvas.addEventListener('mousemove', (e) => {
      const cell = pixelToCell(e.clientX, e.clientY);
      if (!cell) {
        if (hoverCell) { hoverCell = null; renderAll(); }
        return;
      }
      // 仅当悬停变化时重绘（节流）
      if (!hoverCell || hoverCell.row !== cell.row || hoverCell.col !== cell.col) {
        hoverCell = cell;
        renderAll();
      }
    }, { signal: controller.signal });

    canvas.addEventListener('mouseleave', () => {
      if (hoverCell) {
        hoverCell = null;
        renderAll();
      }
    }, { signal: controller.signal });

    canvas.addEventListener('click', (e) => {
      const cell = pixelToCell(e.clientX, e.clientY);
      if (cell && clickHandler) {
        clickHandler(cell.row, cell.col);
      }
    }, { signal: controller.signal });

    // 协议审计点：页面隐藏时停止动画循环（同一 AbortController 统一管理）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && animFrameId) {
        cancelAnimationFrame(animFrameId);
        // P0 修复：取消时主动调用 cleanup，避免 animateDrop Promise 死锁
        if (Renderer._cancelAnim) Renderer._cancelAnim();
      }
    }, { signal: controller.signal });

    // 暴露 controller 供卸载使用（协议审计点：内存泄漏检查）
    Renderer._abortController = controller;
  };

  // ===== 公开 API =====
  return {
    init(canvasEl, config = window.CONFIG) {
      canvas = canvasEl;
      cfg = config;
      ctx = canvas.getContext('2d');
      dpr = window.devicePixelRatio || 1;

      // 高 DPI 适配：物理像素 vs 逻辑像素
      canvas.width = cfg.CANVAS_SIZE * dpr;
      canvas.height = cfg.CANVAS_SIZE * dpr;
      canvas.style.width = cfg.CANVAS_SIZE + 'px';
      canvas.style.height = cfg.CANVAS_SIZE + 'px';
      ctx.scale(dpr, dpr);

      bindEvents();
      renderAll();
    },

    render(board, options = {}) {
      // 协议铁律 #1：深拷贝快照，渲染层绝不修改原始 board
      boardSnapshot = structuredClone(board);
      renderOptions = options;
      renderAll();
    },

    getCellFromEvent(mouseEvent) {
      return pixelToCell(mouseEvent.clientX, mouseEvent.clientY);
    },

    animateDrop,

    onCellClick(handler) {
      clickHandler = handler;
    },

    // 协议审计点：供测试与卸载使用
    destroy() {
      if (Renderer._abortController) {
        Renderer._abortController.abort();
      }
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        if (Renderer._cancelAnim) Renderer._cancelAnim();
      }
    },

    // 调试用
    _internals: { renderAll, cellToPixel, pixelToCell }
  };
})();

window.Renderer = Renderer;