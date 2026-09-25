/*!
 * 地图画导入坐标判断 —— 核心逻辑
 *
 * 规则：坐标必须满足  v = -64 + 128 × n  （n 为整数）
 *       合法值形如 …, -192, -64, 64, 192, 320, …
 *
 * 和 import-range.js 一样，纯函数与 DOM 装配分开：
 *   - 浏览器里自动绑定 DOM
 *   - Node 里可以 require 后直接测纯函数（见 site/_test-map-coord.js）
 */
(function (global) {
  'use strict';

  var OFFSET = -64;
  var STEP = 128;

  /* 分隔符：半角逗号、全角逗号、空白，可混用（和导入范围计算保持一致） */
  var SEPARATOR = /[,，\s]+/;

  /* 严格整数：不接受 "12abc"、"1.5" 这类会被 parseInt 悄悄截断的输入 */
  var INTEGER_RE = /^[+-]?\d+$/;

  /* ---------------------------------------------------------------
   * 判断单个坐标是否落在 -64 + 128n 上
   * 注意：JS 里 (-128) % 128 得到 -0，而 -0 === 0 为真，
   *       所以负数坐标（如 -192）也能正确判定。
   * ------------------------------------------------------------- */
  function isValid(v) {
    return (v - OFFSET) % STEP === 0;
  }

  /* 离 v 最近的那个合法坐标 */
  function nearest(v) {
    var n = Math.round((v - OFFSET) / STEP);
    return { n: n, value: OFFSET + STEP * n };
  }

  /* ---------------------------------------------------------------
   * 解析 "x z" / "x,z" -> {ok:true, x, z}
   * ------------------------------------------------------------- */
  function parseCoord(text) {
    var raw = text == null ? '' : String(text).trim();

    if (raw === '') {
      return { ok: false, message: '请输入 x 和 z，例如 1000 1000' };
    }

    var parts = raw.split(SEPARATOR).filter(function (s) { return s !== ''; });

    if (parts.length < 2) {
      return { ok: false, message: '需要两个整数（x 和 z），当前只有 ' + parts.length + ' 个' };
    }

    var value = [];
    for (var i = 0; i < 2; i++) {
      if (!INTEGER_RE.test(parts[i])) {
        return { ok: false, message: '「' + parts[i] + '」不是整数' };
      }
      value.push(Number(parts[i]));
    }

    return { ok: true, x: value[0], z: value[1] };
  }

  /* ---------------------------------------------------------------
   * 主判断
   * 返回 { state:'ok'|'no'|'error', title, lines:[], strongIndex }
   * ------------------------------------------------------------- */
  function check(text) {
    var p = parseCoord(text);

    if (!p.ok) {
      return { state: 'error', title: '格式错误', lines: [p.message], strongIndex: -1 };
    }

    var xOk = isValid(p.x);
    var zOk = isValid(p.z);

    if (xOk && zOk) {
      return {
        state: 'ok',
        title: '✅ (' + p.x + ', ' + p.z + ') 符合要求',
        lines: [
          'x = ' + OFFSET + ' + ' + STEP + ' × (' + ((p.x - OFFSET) / STEP) + ') = ' + p.x,
          'z = ' + OFFSET + ' + ' + STEP + ' × (' + ((p.z - OFFSET) / STEP) + ') = ' + p.z
        ],
        strongIndex: -1
      };
    }

    var rx = nearest(p.x);
    var rz = nearest(p.z);

    return {
      state: 'no',
      title: '❌ (' + p.x + ', ' + p.z + ') 不符合要求',
      lines: [
        '最近的符合坐标：(' + rx.value + ', ' + rz.value + ')',
        'x = ' + OFFSET + ' + ' + STEP + ' × (' + rx.n + ') = ' + rx.value,
        'z = ' + OFFSET + ' + ' + STEP + ' × (' + rz.n + ') = ' + rz.value
      ],
      strongIndex: 0
    };
  }

  /* ---------------------------------------------------------------
   * 浏览器端装配
   * ------------------------------------------------------------- */
  function mount() {
    var $input = document.getElementById('coord');
    var $button = document.getElementById('check');
    var $result = document.getElementById('result');
    if (!$input || !$button || !$result) return;

    function render() {
      var r = check($input.value);

      $result.className = 'coord-result is-shown ' +
        (r.state === 'ok' ? 'is-ok' : 'is-no');

      var html = '<div class="r-label">' + r.title + '</div><div class="r-detail">';
      for (var i = 0; i < r.lines.length; i++) {
        if (i) html += '<br>';
        html += (i === r.strongIndex)
          ? '<span class="r-hl">' + r.lines[i] + '</span>'
          : r.lines[i];
      }
      html += '</div>';

      $result.innerHTML = html;
    }

    $button.addEventListener('click', render);
    $input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        render();
      }
    });
  }

  /* ---------------------------------------------------------------
   * 导出 + 自动挂载
   * ------------------------------------------------------------- */
  var api = {
    OFFSET: OFFSET,
    STEP: STEP,
    isValid: isValid,
    nearest: nearest,
    parseCoord: parseCoord,
    check: check,
    mount: mount
  };

  global.MapCoord = api;

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
