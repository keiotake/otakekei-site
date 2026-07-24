// 仲間募集フォームの送信処理
// ↓ Googleスプレッドシートに紐づくGASウェブアプリのURL(/exec)をここに貼る
var GAS_ENDPOINT = "";

(function () {
  "use strict";
  var form = document.getElementById("joinForm");
  if (!form) return;
  var status = document.getElementById("joinStatus");
  var btn = form.querySelector(".jf-submit");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!GAS_ENDPOINT) {
      status.className = "jf-status err";
      status.textContent = "送信先が未設定です。恐れ入りますが、SNSからご連絡ください。";
      return;
    }
    btn.disabled = true;
    status.className = "jf-status";
    status.textContent = "送信中…";

    fetch(GAS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: new FormData(form)
    })
      .then(function () {
        form.reset();
        status.className = "jf-status ok";
        status.textContent = "ご応募ありがとうございます。内容を確認し、後日ご連絡いたします。";
      })
      .catch(function () {
        status.className = "jf-status err";
        status.textContent = "送信に失敗しました。時間をおいて再度お試しください。";
      })
      .finally(function () {
        btn.disabled = false;
      });
  });
})();
