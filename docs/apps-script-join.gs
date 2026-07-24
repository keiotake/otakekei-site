/*
 * 大竹けい「仲間募集」応募フォーム 受信スクリプト（Google Apps Script）
 * ============================================================
 * 【設定手順（大竹さんの作業・5分ほど）】
 * 1. Googleドライブで「スプレッドシートを新規作成」
 * 2. メニュー：拡張機能 → Apps Script を開く
 * 3. 最初のコードを全部消して、このファイルの中身を貼り付け → 保存（💾）
 * 4. 上部の関数プルダウンで「setup」を選び ▶実行
 *    → 初回は「権限を確認」→ 自分のアカウントで許可
 * 5. 右上「デプロイ」→「新しいデプロイ」→ 歯車⚙で種類「ウェブアプリ」を選択
 *    - 説明：仲間募集フォーム
 *    - 次のユーザーとして実行：自分
 *    - アクセスできるユーザー：全員
 *    → デプロイ
 * 6. 表示された「ウェブアプリのURL（.../exec で終わる）」をコピーして渡す
 *    → サイトの assets/js/join.js の GAS_ENDPOINT に貼り込みます
 * ============================================================
 */

var SHEET_NAME = '応募';

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      '受信日時', 'お名前', 'ふりがな', '年代', 'お住まい',
      'メール', '電話', '応募のきっかけ', '関わりたいこと', '頻度', 'メッセージ', '同意'
    ]);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) { setup(); }

    var p = (e && e.parameter) ? e.parameter : {};
    var involve = (e && e.parameters && e.parameters.involve)
      ? e.parameters.involve.join(' / ')
      : '';

    sh.appendRow([
      new Date(),
      p.name || '', p.kana || '', p.age || '', p.area || '',
      p.email || '', p.phone || '', p.motive || '',
      involve, p.frequency || '', p.message || '',
      p.consent ? '同意' : ''
    ]);

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}
