// 活動報告: 「議会での質問と、その後」カードと note 新着レールの描画
(function () {
  'use strict';

  // ---- 質問カード ----
  var STATUS = {
    asked:  ['質問済み', 'st-asked'],
    review: ['市が検討中', 'st-review'],
    moving: ['動き出した', 'st-moving'],
    done:   ['変わった！', 'st-done']
  };
  var qList = document.getElementById('qList');
  if (qList && Array.isArray(window.OTAKE_QUESTIONS)) {
    window.OTAKE_QUESTIONS.forEach(function (item) {
      var st = STATUS[item.status] || STATUS.asked;
      var card = document.createElement('details');
      card.className = 'q-card';

      var summary = document.createElement('summary');
      var gikai = document.createElement('span'); gikai.className = 'q-gikai'; gikai.textContent = item.gikai;
      var title = document.createElement('span'); title.className = 'q-card-title'; title.textContent = item.title;
      var badge = document.createElement('span'); badge.className = 'q-badge ' + st[1]; badge.textContent = st[0];
      var arrow = document.createElement('span'); arrow.className = 'q-arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '＋';
      summary.append(gikai, title, badge, arrow);
      card.append(summary);

      var body = document.createElement('div'); body.className = 'q-body';
      [['問', item.q, 'q-q'], ['市', item.a, 'q-a'], ['後', item.followup, 'q-f']].forEach(function (row) {
        if (!row[1]) return;
        var p = document.createElement('p'); p.className = 'q-row ' + row[2];
        var label = document.createElement('span'); label.className = 'q-label'; label.textContent = row[0];
        var text = document.createElement('span'); text.textContent = row[1];
        p.append(label, text); body.append(p);
      });
      card.append(body);
      qList.append(card);
    });
  }

  // ---- note 新着レール ----
  var rail = document.getElementById('noteRail');
  if (!rail) return;
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }
  function renderNotes(posts) {
    rail.replaceChildren();
    posts.slice(0, 6).forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'note-card'; a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('role', 'listitem');
      if (p.thumbnail) {
        var img = document.createElement('img');
        img.className = 'note-thumb'; img.src = p.thumbnail; img.alt = ''; img.loading = 'lazy';
        a.append(img);
      } else {
        var ph = document.createElement('span');
        ph.className = 'note-thumb note-thumb-empty'; ph.textContent = 'note';
        a.append(ph);
      }
      var t = document.createElement('span'); t.className = 'note-card-title'; t.textContent = p.title;
      var d = document.createElement('span'); d.className = 'note-card-date'; d.textContent = fmtDate(p.published);
      a.append(t, d);
      rail.append(a);
    });
  }
  function noteFallback() {
    rail.replaceChildren();
    var p = document.createElement('p'); p.className = 'video-status';
    p.textContent = '記事一覧を読み込めませんでした。';
    var a = document.createElement('a'); a.href = 'https://note.com/otake_kei'; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'noteで最新記事を読む ↗';
    p.append(a); rail.append(p);
  }
  fetch('assets/data/note.json', { cache: 'no-cache', signal: AbortSignal.timeout(10000) })
    .then(function (r) { if (!r.ok) throw Error('note feed unavailable'); return r.json(); })
    .then(function (data) {
      if (data.posts && data.posts.length) renderNotes(data.posts); else noteFallback();
    })
    .catch(noteFallback);
})();
