// 仲間募集フォームの送信処理
// ↓ Googleスプレッドシートに紐づくGASウェブアプリのURL(/exec)をここに貼る
var GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycby2KsjRXcdyK7YuSR0f5u-wXeW_F9So-XLTh4E9wi57VpeOa54uromZx3r_7OdgZUN6/exec";

(function () {
  "use strict";
  var form = document.getElementById("joinForm");
  if (!form) return;
  var status = document.getElementById("joinStatus");
  var btn = form.querySelector(".jf-submit");

  // 入力し直したら赤枠を消す
  ["input", "change"].forEach(function (type) {
    form.addEventListener(type, function (e) {
      var box = e.target.closest(".is-invalid");
      if (box && e.target.checkValidity()) box.classList.remove("is-invalid");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // 未入力の必須項目を赤枠で示し、送信ボタンの下に項目名を出す（ブラウザの吹き出しはスマホで見落としやすいため）
    form.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
    var bad = Array.prototype.filter.call(form.elements, function (el) { return el.willValidate && !el.checkValidity(); });
    if (bad.length) {
      var names = bad.map(function (el) {
        var box = el.closest(".jf-field, .jf-consent");
        if (box) box.classList.add("is-invalid");
        if (el.name === "consent") return "個人情報の取り扱いへの同意";
        var label = box && box.querySelector("span");
        return label ? label.childNodes[0].textContent.trim() : el.name;
      });
      status.className = "jf-status err";
      status.textContent = "未入力・未選択の項目があります：" + names.join("、");
      bad[0].focus();
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
