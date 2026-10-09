// 横スクロールのレールを、マウスで掴んでスライドできるようにする
// （タッチ端末は標準のスワイプがあるため対象外。ドラッグ後のクリック誤発火も防ぐ）
(function () {
  'use strict';
  function enable(el) {
    if (!el) return;
    var down = false, moved = false, startX = 0, startLeft = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX; startLeft = el.scrollLeft;
      el.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      el.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      el.classList.remove('is-dragging');
    });
    el.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  }
  enable(document.getElementById('videoRail'));
  enable(document.getElementById('noteRail'));
})();
