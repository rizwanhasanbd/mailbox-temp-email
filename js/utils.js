/* ===== Tiny utility module — toast + clipboard ===== */
const Utils = (function () {

  function toast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function copy(text, message = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text);
      toast(message, 'success');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast(message, 'success');
      } catch (_) {
        toast('Copy failed', 'error');
      }
      document.body.removeChild(ta);
    }
  }

  function rint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function rdigits(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += rint(0, 9);
    return s;
  }

  return { toast, copy, rint, pick, rdigits };
})();
