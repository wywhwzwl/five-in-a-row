/**
 * aiPlayer.js — AI 对手（V1.0 / V2.0 / V3.0 三版本渐进式）
 *
 * 协议约束：
 *  - 渐进式：禁止一上来就 Minimax 决策树（易产生幻觉）
 *  - 分层解耦：AI 只接收 board 快照，返回 {row, col}，无副作用
 *  - 黑棋禁手过滤：白棋无禁手；防守方评估时仍需避开黑棋禁手
 *
 * 公开 API：
 *  - AIPlayer.init(config)
 *  - AIPlayer.decideMove(board, player, version) → Promise<{row, col}>
 */
const AIPlayer = (() => {
  let cfg = null;

  // ============================================================
  // 工具：沿某方向探测连续同色棋子数 + 开放度
  // 返回 { count, openEnds }
  // ============================================================
  const probeLine = (board, r, c, player, dr, dc) => {
    let count = 0;
    let openEnds = 0;

    // 正方向
    for (let k = 1; k < cfg.BOARD_SIZE; k++) {
      const nr = r + dr * k, nc = c + dc * k;
      if (nr < 0 || nr >= cfg.BOARD_SIZE || nc < 0 || nc >= cfg.BOARD_SIZE) break;
      if (board[nr][nc] === player) count++;
      else { if (board[nr][nc] === 0) openEnds++; break; }
    }

    // 反方向
    for (let k = 1; k < cfg.BOARD_SIZE; k++) {
      const nr = r - dr * k, nc = c - dc * k;
      if (nr < 0 || nr >= cfg.BOARD_SIZE || nc < 0 || nc >= cfg.BOARD_SIZE) break;
      if (board[nr][nc] === player) count++;
      else { if (board[nr][nc] === 0) openEnds++; break; }
    }

    return { count: count + 1, openEnds };  // +1 含自身
  };

  // ============================================================
  // 形状评分表（基于连续数 + 开放度）
  // P2 修复：改用 Map<key, score> O(1) 查表，替代 Array.find 线性扫描
  // ============================================================
  const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

  /**
   * 评分表（合并自 config.AI_WEIGHTS 的语义口径）
   * key 格式: `${count}:${openEnds}`
   */
  const SHAPE_SCORE_MAP = new Map([
    ['1:0', 1], ['1:1', 2], ['1:2', 3],
    ['2:0', 5], ['2:1', 20], ['2:2', 50],
    ['3:0', 100], ['3:1', 500], ['3:2', 1000],     // 活三
    ['4:0', 1000], ['4:1', 5000], ['4:2', 10000],   // 死四 / 冲四 / 活四
    ['5:0', 100000], ['5:1', 100000], ['5:2', 100000],  // 成五
    ['6:0', 1000000], ['6:1', 1000000], ['6:2', 1000000], // 长连
  ]);

  const lookupShapeScore = (count, openEnds) => {
    return SHAPE_SCORE_MAP.get(`${count}:${openEnds}`) || 0;
  };

  /**
   * 计算某位置某玩家的总评分（4 方向求和）
   * 注意：调用前 board[r][c] 应已是 player 的模拟落子
   */
  const evaluatePoint = (board, r, c, player) => {
    let total = 0;
    for (const [dr, dc] of DIRS) {
      const { count, openEnds } = probeLine(board, r, c, player, dr, dc);
      total += lookupShapeScore(count, openEnds);
    }
    return total;
  };

  /**
   * 获取所有需要评估的候选点（剪枝：仅考虑已有棋子 2 格内的空位）
   * P1 修复：使用 Uint8Array(225) 标志位替代 Set<string>
   */
  const getCandidatePoints = (board) => {
    const N = cfg.BOARD_SIZE;
    const flag = new Uint8Array(N * N);   // 0 = 未访问/已占用, 1 = 候选
    let hasAny = false;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c] !== 0) {
          hasAny = true;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
              if (board[nr][nc] === 0) flag[nr * N + nc] = 1;
            }
          }
        }
      }
    }

    const out = [];
    if (!hasAny) {
      // 空棋盘 → 中心 3×3
      const mid = Math.floor(N / 2);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          out.push({ row: mid + dr, col: mid + dc });
        }
      }
    } else {
      for (let i = 0; i < N * N; i++) {
        if (flag[i]) out.push({ row: Math.floor(i / N), col: i % N });
      }
    }
    return out;
  };

  /**
   * P1 修复：原地落子-评估-还原工具
   * 替代原来的 board.map(r => [...r]) 深拷贝模式
   * evaluatePoint 是只读探针，模拟落子+还原一格即可
   */
  const withSimulation = (board, r, c, player, fn) => {
    const saved = board[r][c];
    board[r][c] = player;
    try {
      return fn();
    } finally {
      board[r][c] = saved;
    }
  };

  // ============================================================
  // V1.0 随机模式（协议最低基线）
  // ============================================================
  const decideV1_Random = (board, aiPlayer) => {
    const empty = [];
    for (let r = 0; r < cfg.BOARD_SIZE; r++) {
      for (let c = 0; c < cfg.BOARD_SIZE; c++) {
        if (board[r][c] === 0) empty.push({ row: r, col: c });
      }
    }
    if (empty.length === 0) return null;
    return empty[Math.floor(Math.random() * empty.length)];
  };

  // ============================================================
  // V2.0 防御模式（扫描玩家最后落子周围的活三/冲四）
  // P1 修复：使用 withSimulation 原地修改+还原，替代 4×N 次完整深拷贝
  // ============================================================
  const decideV2_Defensive = (board, aiPlayer) => {
    const opponent = aiPlayer === 1 ? 2 : 1;
    const candidates = getCandidatePoints(board);

    // 优先级 1：检测 AI 自身能否成五
    for (const { row, col } of candidates) {
      const win = withSimulation(board, row, col, aiPlayer,
        () => wouldWin(board, row, col, aiPlayer));
      if (win) return { row, col };
    }

    // 优先级 2：封堵对手的冲四（必堵）
    for (const { row, col } of candidates) {
      const threat = withSimulation(board, row, col, opponent,
        () => detectThreat(board, row, col, opponent));
      if (threat === 'closed-four' || threat === 'open-four') return { row, col };
    }

    // 优先级 3：封堵对手的活三
    for (const { row, col } of candidates) {
      const threat = withSimulation(board, row, col, opponent,
        () => detectThreat(board, row, col, opponent));
      if (threat === 'open-three') return { row, col };
    }

    // 优先级 4：寻找 AI 自己的活三/冲四进攻机会
    for (const { row, col } of candidates) {
      const threat = withSimulation(board, row, col, aiPlayer,
        () => detectThreat(board, row, col, aiPlayer));
      if (threat === 'open-three' || threat === 'closed-four' || threat === 'open-four') {
        return { row, col };
      }
    }

    // 兜底：随机
    return decideV1_Random(board, aiPlayer);
  };

  // ============================================================
  // V3.0 评分模式（双端权重分）
  // P1 修复：每候选 2 次深拷贝 → 0 次（用 withSimulation）
  // ============================================================
  const decideV3_Scoring = (board, aiPlayer) => {
    const opponent = aiPlayer === 1 ? 2 : 1;
    const candidates = getCandidatePoints(board);

    let bestPoint = null;
    let bestScore = -Infinity;

    for (const { row, col } of candidates) {
      // 进攻分：原地模拟 AI 落子 → evaluatePoint
      const attackScore = withSimulation(board, row, col, aiPlayer,
        () => evaluatePoint(board, row, col, aiPlayer));

      // 防守分：原地模拟对手落子
      const defenseScore = withSimulation(board, row, col, opponent,
        () => evaluatePoint(board, row, col, opponent));

      // 综合分：防守权重略高于进攻（避免忽视对手威胁）
      const total = attackScore + defenseScore * cfg.AI_WEIGHTS.DEFENSE_MULTIPLIER;

      // 平分打破：离中心近的优先
      const center = Math.floor(cfg.BOARD_SIZE / 2);
      const distToCenter = Math.abs(row - center) + Math.abs(col - center);
      const tieBreaker = (cfg.BOARD_SIZE * 2 - distToCenter) * 0.001;

      const finalScore = total + tieBreaker;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestPoint = { row, col };
      }
    }

    return bestPoint;
  };

  // ============================================================
  // 辅助：5 连判定（AI 自带版本，无需引入 Engine）
  // ============================================================
  const wouldWin = (board, r, c, player) => {
    for (const [dr, dc] of DIRS) {
      const { count } = probeLine(board, r, c, player, dr, dc);
      if (count >= 5) return true;
    }
    return false;
  };

  /**
   * 威胁识别
   * 返回 'open-three' | 'closed-four' | 'open-four' | null
   */
  const detectThreat = (board, r, c, player) => {
    let maxThreat = null;
    for (const [dr, dc] of DIRS) {
      const { count, openEnds } = probeLine(board, r, c, player, dr, dc);
      if (count === 4 && openEnds === 2) return 'open-four';
      if (count === 4 && openEnds === 1) maxThreat = 'closed-four';
      if (count === 3 && openEnds === 2) maxThreat = 'open-three';
    }
    return maxThreat;
  };

  // ============================================================
  // 公开 API
  // ============================================================
  return {
    init(config = window.CONFIG) {
      cfg = config;
    },

    /**
     * 决策入口（异步避免阻塞 UI）
     */
    async decideMove(board, player, version = 3) {
      // 让出主线程，让 UI 先更新"AI 思考中"提示
      await new Promise(r => setTimeout(r, cfg.ANIMATION.AI_THINK_DELAY_MS));

      switch (version) {
        case 1: return decideV1_Random(board, player);
        case 2: return decideV2_Defensive(board, player);
        case 3: return decideV3_Scoring(board, player);
        default: return decideV3_Scoring(board, player);
      }
    },

    // 暴露内部函数供测试
    _internals: { evaluatePoint, getCandidatePoints, probeLine, decideV1_Random, decideV2_Defensive, decideV3_Scoring }
  };
})();

window.AIPlayer = AIPlayer;