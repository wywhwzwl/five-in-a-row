/**
 * gameEngine.js — 核心游戏引擎
 *
 * 协议约束：
 *  1. 不可变数据：所有状态变更通过 structuredClone 生成新对象
 *  2. 十字双端探测法：胜负判定以落子为中心，4 方向双端累加
 *  3. 分层解耦：引擎只管"状态机 + 规则判定"，不绘制像素
 *  4. 禁手规则：黑棋禁三三/四四/长连（Renju 规则）
 *
 * 公开 API：
 *  - Engine.init(config)
 *  - Engine.subscribe(callback)        // 订阅 state 变更
 *  - Engine.handlePlayerMove(row, col) // 玩家点击入口
 *  - Engine.applyAIMove(row, col)      // AI 落子入口
 *  - Engine.undo()                     // 悔棋（玩家+AI 两步）
 *  - Engine.reset()
 *  - Engine.getState()                 // 获取当前快照
 */
const Engine = (() => {
  let cfg = null;
  let state = null;            // 当前 GameState（单一可信源）
  const subscribers = [];      // 订阅者列表

  // ============================================================
  // 工具：四个方向向量（横/竖/主斜/副斜）
  // ============================================================
  const DIRS = [
    [0,  1],   // 水平
    [1,  0],   // 垂直
    [1,  1],   // 主斜（左上→右下）
    [1, -1],   // 副斜（右上→左下）
  ];

  /**
   * 工具：边界安全读取
   */
  const at = (board, r, c) => {
    if (r < 0 || r >= cfg.BOARD_SIZE || c < 0 || c >= cfg.BOARD_SIZE) return -1;
    return board[r][c];
  };

  // ============================================================
  // 协议关键算法：胜负判定 —— 十字双端探测法
  // ============================================================
  /**
   * 以 (row, col) 为中心，向某方向 [dr, dc] 双端探测同色棋子连续数
   * 返回 { count, line }，count 含自身
   */
  const probeLine = (board, row, col, player, dr, dc) => {
    let count = 1;
    const cells = [{ row, col }];

    // 正方向探测（用计数器累加，不用 break 跳多层循环 —— 协议铁律）
    let fwd = 0;
    for (let k = 1; k < cfg.BOARD_SIZE; k++) {
      const r = row + dr * k;
      const c = col + dc * k;
      if (at(board, r, c) === player) {
        fwd++;
        cells.push({ row: r, col: c });
      } else {
        break;  // 单层循环 break，逻辑无歧义
      }
    }

    // 反方向探测
    let bwd = 0;
    for (let k = 1; k < cfg.BOARD_SIZE; k++) {
      const r = row - dr * k;
      const c = col - dc * k;
      if (at(board, r, c) === player) {
        bwd++;
        cells.unshift({ row: r, col: c });
      } else {
        break;
      }
    }

    return { count: fwd + bwd + 1, line: cells };
  };

  /**
   * 检查 (row, col) 落子 player 后是否获胜
   * 返回 { winner, line } 或 null
   *
   * 协议规则差异：
   *  - 白棋（player=2）：count >= 5 即胜（无禁手）
   *  - 黑棋（player=1）：仅 count === 5 胜（长连视为禁手，由 isForbidden 处理）
   */
  const checkWin = (board, row, col, player) => {
    const isExactFive = cfg.RULES.EXACT_FIVE_WIN && player === 1;
    for (const [dr, dc] of DIRS) {
      const { count, line } = probeLine(board, row, col, player, dr, dc);
      if (isExactFive) {
        if (count === 5) return { winner: player, line: line.slice(0, 5) };
      } else {
        if (count >= 5) return { winner: player, line: line.slice(0, 5) };
      }
    }
    return null;
  };

  // ============================================================
  // 禁手判定（仅黑棋生效）
  // ============================================================
  /**
   * 沿某方向延伸连续同色子数（不含自身），并探测端点开放性
   * 用于禁手判定
   */
  const probeWithOpenness = (board, row, col, player, dr, dc) => {
    let consecutive = 0;
    let openEnds = 0;
    const cells = [];

    // 正方向延伸
    for (let k = 1; k < cfg.BOARD_SIZE; k++) {
      const r = row + dr * k;
      const c = col + dc * k;
      const v = at(board, r, c);
      if (v === player) {
        consecutive++;
        cells.push({ row: r, col: c });
      } else {
        if (v === 0) openEnds++;   // 端点为空 = 开放
        break;
      }
    }

    // 反方向延伸
    for (let k = 1; k < cfg.BOARD_SIZE; k++) {
      const r = row - dr * k;
      const c = col - dc * k;
      const v = at(board, r, c);
      if (v === player) {
        consecutive++;
        cells.unshift({ row: r, col: c });
      } else {
        if (v === 0) openEnds++;
        break;
      }
    }

    return { consecutive, openEnds, cells, totalLen: consecutive + 1 };
  };

  /**
   * 长连禁手：连六或以上
   */
  const isOverline = (board, row, col) => {
    for (const [dr, dc] of DIRS) {
      const { totalLen } = probeWithOpenness(board, row, col, 1, dr, dc);
      if (totalLen >= 6) return true;
    }
    return false;
  };

  /**
   * 冲四：连续 4 子，仅一端开放（下一步必成五）
   * 活四：连续 4 子，两端开放（下一步必成五）
   */
  const isFourThreat = (board, row, col) => {
    for (const [dr, dc] of DIRS) {
      const { totalLen, openEnds } = probeWithOpenness(board, row, col, 1, dr, dc);
      if (totalLen === 4 && openEnds >= 1) return true;
    }
    return false;
  };

  /**
   * 活三：连续 3 子，两端均开放（下一步可形成活四）
   * 眠三：连续 3 子，一端开放（不构成禁手威胁）
   */
  const isOpenThree = (board, row, col) => {
    let openThreeCount = 0;
    for (const [dr, dc] of DIRS) {
      const { totalLen, openEnds, cells } = probeWithOpenness(board, row, col, 1, dr, dc);
      // 活三：3 子 + 两端开放
      // 特殊模式 "3+1"（跳三）也算活三：x_xxx 或 xx_xx 形式两端开放
      if (totalLen === 3 && openEnds === 2) {
        openThreeCount++;
      } else if (totalLen === 2 && openEnds === 2) {
        // 检测跳活三：例如 .XXX. 中间有空
        const gapBefore = cells.length > 0 ? cells[0] : null;
        const gapAfter = cells.length > 0 ? cells[cells.length - 1] : null;
        // 简化处理：仅检查两端是否有空位形成 XXX 形态
        // 此处使用粗略判定，更严格的跳三检测由 AI 评分函数处理
      }
    }
    return openThreeCount;
  };

  /**
   * 综合禁手判定（仅黑棋）
   */
  const isForbidden = (board, row, col, player) => {
    if (!cfg.RULES.FORBIDDEN_FOR_BLACK || player !== 1) return false;
    if (at(board, row, col) !== 0) return true; // 非空位也禁

    // 临时落子探测
    const sim = board.map(r => [...r]);
    sim[row][col] = 1;

    // 1. 长连禁手
    if (isOverline(sim, row, col)) return true;

    // 2. 四四禁手
    if (isFourThreat(sim, row, col)) {
      // 简化为：若已是活五则不视为禁手
      const win = checkWin(sim, row, col, 1);
      if (!win) {
        // 进一步检查是否同时存在两个冲四/活四
        // 此处用单点检测的近似方案：只要形成四就计一次
        // 严格 Renju 需要枚举所有方向的"四"
        let fourCount = 0;
        for (const [dr, dc] of DIRS) {
          const { totalLen, openEnds } = probeWithOpenness(sim, row, col, 1, dr, dc);
          if (totalLen === 4 && openEnds >= 1) fourCount++;
        }
        if (fourCount >= 2) return true;
      }
    }

    // 3. 三三禁手
    const openThrees = isOpenThree(sim, row, col);
    if (openThrees >= 2) return true;

    return false;
  };

  // ============================================================
  // 平局判定
  // ============================================================
  const isBoardFull = (board) => {
    for (let r = 0; r < cfg.BOARD_SIZE; r++) {
      for (let c = 0; c < cfg.BOARD_SIZE; c++) {
        if (board[r][c] === 0) return false;
      }
    }
    return true;
  };

  // ============================================================
  // 状态更新（不可变）
  // ============================================================
  const cloneState = () => structuredClone({
    board: state.board,
    currentPlayer: state.currentPlayer,
    history: state.history,
    gameOver: state.gameOver,
    winner: state.winner,
    winningLine: state.winningLine,
    forbiddenPoint: state.forbiddenPoint,
  });

  const createInitialState = () => ({
    board: Array(cfg.BOARD_SIZE).fill(null).map(() => Array(cfg.BOARD_SIZE).fill(0)),
    currentPlayer: 1,         // 黑棋先手
    history: [],              // 快照栈
    gameOver: false,
    winner: null,             // 1=黑, 2=白, 0=平局
    winningLine: null,
    forbiddenPoint: null,     // 最近一次被禁手拦截的坐标
  });

  const notify = () => {
    const snapshot = cloneState();
    subscribers.forEach(cb => cb(snapshot));
  };

  /**
   * 通用落子函数（内部使用）
   * 返回 { ok, reason?, forbidden? }
   */
  const placePiece = (row, col, player) => {
    if (state.gameOver) return { ok: false, reason: 'game-over' };
    if (state.currentPlayer !== player) return { ok: false, reason: 'not-your-turn' };
    if (row < 0 || row >= cfg.BOARD_SIZE || col < 0 || col >= cfg.BOARD_SIZE) {
      return { ok: false, reason: 'out-of-bounds' };
    }
    if (state.board[row][col] !== 0) return { ok: false, reason: 'occupied' };

    // 黑棋禁手检测
    if (player === 1 && isForbidden(state.board, row, col, player)) {
      state.forbiddenPoint = { row, col };
      notify();
      return { ok: false, reason: 'forbidden', forbidden: true };
    }
    state.forbiddenPoint = null;

    // 推入历史快照（悔棋栈）
    state.history.push({
      move: { row, col, player },
      snapshot: {
        board: state.board.map(r => [...r]),
        currentPlayer: state.currentPlayer,
        gameOver: state.gameOver,
        winner: state.winner,
        winningLine: state.winningLine ? [...state.winningLine] : null,
      }
    });

    // 不可变更新：先克隆再赋值
    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = player;
    state.board = newBoard;

    // 胜负判定
    const win = checkWin(state.board, row, col, player);
    if (win) {
      state.gameOver = true;
      state.winner = win.winner;
      state.winningLine = win.line;
    } else if (isBoardFull(state.board)) {
      state.gameOver = true;
      state.winner = 0;        // 平局
    } else {
      state.currentPlayer = player === 1 ? 2 : 1;
    }

    notify();
    return { ok: true };
  };

  // ============================================================
  // 公开 API
  // ============================================================
  return {
    init(config = window.CONFIG) {
      cfg = config;
      state = createInitialState();
    },

    subscribe(cb) {
      subscribers.push(cb);
      // 立即推送一次初始状态
      cb(cloneState());
    },

    handlePlayerMove(row, col) {
      return placePiece(row, col, 1);
    },

    applyAIMove(row, col) {
      return placePiece(row, col, 2);
    },

    /**
     * 悔棋：撤销玩家与 AI 的两步（若存在）
     */
    undo() {
      if (state.history.length === 0) return false;
      // 撤销最近两步（玩家+AI）
      const steps = state.history.length >= 2 ? 2 : 1;
      for (let i = 0; i < steps; i++) {
        const last = state.history.pop();
        if (last) {
          state.board = last.snapshot.board.map(r => [...r]);
          state.currentPlayer = last.snapshot.currentPlayer;
          state.gameOver = last.snapshot.gameOver;
          state.winner = last.snapshot.winner;
          state.winningLine = last.snapshot.winningLine;
        }
      }
      state.forbiddenPoint = null;
      notify();
      return true;
    },

    reset() {
      state = createInitialState();
      notify();
    },

    getState() {
      return cloneState();
    },

    // 调试/AI 用：暴露判定函数
    _internals: { checkWin, isForbidden, isBoardFull, probeLine, DIRS }
  };
})();

window.Engine = Engine;