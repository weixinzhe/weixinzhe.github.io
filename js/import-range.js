/*!
 * 导入范围计算 —— 核心逻辑
 *
 * 输入：导入坐标 x,y,z 与建筑大小 x长度,y长度,z长度
 * 输出：导入范围 "x1 y1 z1 ~ x2 y2 z2"
 *
 *   x1 = x                y1 = y                z1 = z
 *   x2 = x1 + x长度 - 1    y2 = y1 + y长度 - 1    z2 = z1 + z长度 - 1
 *   （长度包含起点那一格：0 0 0 长 3x3x3 -> 0 0 0 ~ 2 2 2）
 *
 * 同一个文件同时给浏览器和 Node 用：
 *   - 浏览器：自动绑定 DOM（见文件末尾）
 *   - Node  ：require 后直接测纯函数（见 site/_test.js）
 */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------
   * 分隔符：半角逗号、全角逗号、空白，可混用
   * ------------------------------------------------------------- */
  var SEPARATOR = /[,，\s]+/;

  /* 严格的十进制数字（含负号、小数、科学计数法），避免 Number() 的宽松误判 */
  var NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

  /* ---------------------------------------------------------------
   * 数字格式化：整数不带小数点；浮点误差收敛后最多 4 位小数
   * ------------------------------------------------------------- */
  function fmtNum(n) {
    if (n === 0) return '0'; // 顺带把 -0 归一成 0
    if (Number.isInteger(n)) return String(n);
    var rounded = Math.round(n * 10000) / 10000;
    if (Number.isInteger(rounded)) return String(rounded);
    return String(rounded);
  }

  /* ---------------------------------------------------------------
   * 解析 "x,y,z" -> [x, y, z]
   * 返回 {ok:true, value:[..]} 或 {ok:false, tooFew:bool, error:'..'}
   * tooFew 为真表示「只是还没输完」，UI 上按中性提示处理而不是报错
   * ------------------------------------------------------------- */
  function parseVec3(text) {
    var raw = text == null ? '' : String(text).trim();

    if (raw === '') {
      return { ok: false, tooFew: true, error: '需要 3 个数字，当前 0 个' };
    }

    var parts = raw.split(SEPARATOR).filter(function (s) { return s !== ''; });

    if (parts.length !== 3) {
      return {
        ok: false,
        tooFew: parts.length < 3,
        error: '需要 3 个数字，当前 ' + parts.length + ' 个'
      };
    }

    var value = [];
    for (var i = 0; i < 3; i++) {
      var token = parts[i];
      if (!NUMBER_RE.test(token)) {
        return { ok: false, error: '「' + token + '」不是有效数字' };
      }
      var n = Number(token);
      if (!isFinite(n)) {
        return { ok: false, error: '「' + token + '」不是有效数字' };
      }
      value.push(n);
    }

    return { ok: true, value: value };
  }

  /* ---------------------------------------------------------------
   * 核心计算
   * origin / size 都是 [x, y, z]
   * ------------------------------------------------------------- */
  var AXIS_LABEL = ['x长度', 'y长度', 'z长度'];
  var ORIGIN_AXIS = ['x', 'y', 'z'];
  var Y_MIN = -64;
  var Y_MAX = 319;

  function computeImportRange(origin, size) {
    // 规则 1：导入坐标三个分量必须是整数
    for (var i = 0; i < 3; i++) {
      if (!Number.isInteger(origin[i])) {
        return { ok: false, error: '导入坐标 ' + ORIGIN_AXIS[i] + ' = ' + fmtNum(origin[i]) + ' 必须是整数' };
      }
    }

    // 规则 2：导入坐标 y 必须在 -64 ~ 319
    if (origin[1] < Y_MIN || origin[1] > Y_MAX) {
      return {
        ok: false,
        error: '导入坐标 y = ' + fmtNum(origin[1]) + ' 超出范围，需在 ' + Y_MIN + ' ~ ' + Y_MAX + ' 之间'
      };
    }

    // 规则 3：建筑大小三个分量必须是正整数
    for (var i = 0; i < 3; i++) {
      if (!Number.isInteger(size[i]) || size[i] <= 0) {
        return {
          ok: false,
          error: '建筑大小 ' + AXIS_LABEL[i] + ' 必须为正整数（当前 ' + fmtNum(size[i]) + '）'
        };
      }
    }

    var x1 = origin[0], y1 = origin[1], z1 = origin[2];
    // 终点 = 起点 + 长度 - 1（长度包含起点那一格）
    var x2 = x1 + size[0] - 1, y2 = y1 + size[1] - 1, z2 = z1 + size[2] - 1;

    // 规则 4：计算出的导入范围 y 终点必须 ≤ 319
    if (y2 > Y_MAX) {
      return {
        ok: false,
        error: '导入范围 y 终点 = ' + fmtNum(y2) + ' 超过世界高度限制 ' + Y_MAX + '，请调整导入坐标或建筑大小'
      };
    }

    var start = [fmtNum(x1), fmtNum(y1), fmtNum(z1)].join(' ');
    var end = [fmtNum(x2), fmtNum(y2), fmtNum(z2)].join(' ');

    return {
      ok: true,
      x1: x1, y1: y1, z1: z1,
      x2: x2, y2: y2, z2: z2,
      text: start + ' ~ ' + end
    };
  }

  /* ---------------------------------------------------------------
   * 把两个输入框的原始文本换算成一个 UI 状态
   *   state: 'idle'（都空） | 'hint'（还没输完） | 'error' | 'ok'
   * ------------------------------------------------------------- */
  function evaluate(originText, sizeText) {
    var oRaw = originText == null ? '' : String(originText).trim();
    var sRaw = sizeText == null ? '' : String(sizeText).trim();

    if (oRaw === '' && sRaw === '') {
      return { state: 'idle', message: '' };
    }

    var origin = parseVec3(oRaw);
    if (!origin.ok) {
      return { state: origin.tooFew ? 'hint' : 'error', message: origin.error };
    }

    var size = parseVec3(sRaw);
    if (!size.ok) {
      return { state: size.tooFew ? 'hint' : 'error', message: size.error };
    }

    var result = computeImportRange(origin.value, size.value);
    if (!result.ok) {
      return { state: 'error', message: result.error };
    }

    return { state: 'ok', message: '', range: result };
  }

  /* ---------------------------------------------------------------
   * 剪贴板：优先 Clipboard API，非安全上下文回退 execCommand
   * ------------------------------------------------------------- */
  function legacyCopy(text) {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      ok = false;
    }
    return ok;
  }

  function copyText(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* ---------------------------------------------------------------
   * 浏览器端装配
   * ------------------------------------------------------------- */
  var DEBOUNCE_MS = 200;

  function mount() {
    var $origin = document.getElementById('origin');
    var $size = document.getElementById('size');
    var $result = document.getElementById('result');
    var $error = document.getElementById('error');
    var $copy = document.getElementById('copy');
    var $status = document.getElementById('status');

    if (!$origin || !$size || !$result || !$error) return;

    var currentRange = '';
    var debounceTimer = null;
    var flashTimer = null;

    function render() {
      var r = evaluate($origin.value, $size.value);

      $result.classList.remove('is-idle', 'is-ok');
      $error.classList.remove('is-hint', 'is-error');
      $error.textContent = '';
      currentRange = '';
      if ($copy) $copy.disabled = true;

      if (r.state === 'ok') {
        $result.textContent = r.range.text;
        $result.classList.add('is-ok');
        currentRange = r.range.text;
        if ($copy) $copy.disabled = false;
        return;
      }

      $result.textContent = '—';
      $result.classList.add('is-idle');

      if (r.state === 'hint') {
        $error.textContent = r.message;
        $error.classList.add('is-hint');
      } else if (r.state === 'error') {
        $error.textContent = r.message;
        $error.classList.add('is-error');
      }
    }

    function scheduleRender() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, DEBOUNCE_MS);
    }

    function flash(msg) {
      if (!$status) return;
      $status.textContent = msg;
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(function () { $status.textContent = ''; }, 1500);
    }

    if ($copy) {
      $copy.addEventListener('click', function () {
        if (!currentRange) return;
        copyText(currentRange).then(function (ok) {
          flash(ok ? '已复制' : '复制失败，请手动选中');
        });
      });
    }

    // 支持 ?origin=100,64,-200&size=10,5,8 预填并直接计算
    if (typeof URLSearchParams !== 'undefined') {
      var params = new URLSearchParams(window.location.search);
      var qOrigin = params.get('origin');
      var qSize = params.get('size');
      if (qOrigin) $origin.value = qOrigin;
      if (qSize) $size.value = qSize;
    }

    $origin.addEventListener('input', scheduleRender);
    $size.addEventListener('input', scheduleRender);

    var $year = document.getElementById('year');
    if ($year) $year.textContent = String(new Date().getFullYear());

    render();
  }

  /* ---------------------------------------------------------------
   * 导出 + 自动挂载
   * ------------------------------------------------------------- */
  var api = {
    parseVec3: parseVec3,
    fmtNum: fmtNum,
    computeImportRange: computeImportRange,
    evaluate: evaluate,
    mount: mount
  };

  global.ImportRange = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
