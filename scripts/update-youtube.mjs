import {readFile,writeFile,mkdir} from 'node:fs/promises';
const channel='UCiLpfrO55MLhugHxiO7Gahg';
const target=new URL('../assets/data/youtube.json',import.meta.url);
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos);|&#(?:x[0-9a-f]+|\d+);/gi,x=>({ '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'" }[x] ?? String.fromCodePoint(x.startsWith('&#x')?parseInt(x.slice(3,-1),16):parseInt(x.slice(2,-1),10))));
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const get=async url=>{const r=await fetch(url,{headers:{'User-Agent':UA,'Accept-Language':'ja'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('YouTube HTTP '+r.status+' '+url);return r.text();};
const valid=v=>/^[\w-]{11}$/.test(v.id||'')&&v.title&&Number.isFinite(Date.parse(v.published));

// サイトに載せるのは横動画だけ（ショートは載せない：大竹さんの方針 2026-10-28）
// 予備: RSS（ショートも混ざるので、リンクが /shorts/ のもの・題名に #shorts があるものを除く。404を返すこともある）
async function fromRss(){
  const xml=await get('https://www.youtube.com/feeds/videos.xml?channel_id='+channel);
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .filter(([,entry])=>!/\/shorts\//.test(entry.match(/<link[^>]*href="([^"]+)"/)?.[1]||''))
    .map(([,entry])=>({id:entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1],title:decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]||''),published:entry.match(/<published>(.*?)<\/published>/)?.[1]}))
    .filter(v=>!/#shorts?\b/i.test(v.title));
}
// 優先: チャンネルの「動画」タブ（横動画だけが並ぶ）を直接読む。公開日は前回の一覧から引き継ぎ、新しい動画だけ動画ページで調べる
async function fromChannelPage(known){
  const html=await get('https://www.youtube.com/channel/'+channel+'/videos');
  const m=html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if(!m)throw Error('チャンネルページの形式が変わった可能性があります');
  const list=[];
  JSON.stringify(JSON.parse(m[1]),(k,v)=>{
    const id=v?.richItemRenderer?.content?.videoRenderer?.videoId||v?.lockupViewModel?.contentId;
    const title=v?.richItemRenderer?.content?.videoRenderer?.title?.runs?.map(r=>r.text).join('')||v?.lockupViewModel?.metadata?.lockupMetadataViewModel?.title?.content;
    if(id&&title&&!list.some(x=>x.id===id))list.push({id,title});
    return v;
  });
  const out=[];
  for(const v of list.slice(0,12)){
    let published=known.get(v.id);
    if(!published){
      const page=await get('https://www.youtube.com/watch?v='+v.id);
      published=page.match(/"publishDate":"([^"]+)"/)?.[1]||page.match(/"uploadDate":"([^"]+)"/)?.[1];
    }
    out.push({id:v.id,title:v.title,published});
  }
  return out;
}

let old=null;
try{old=JSON.parse(await readFile(target,'utf8'));}catch{}
const known=new Map((old?.videos||[]).map(v=>[v.id,v.published]));
let videos=[],errors=[];
for(const [name,load] of [['チャンネルページ',()=>fromChannelPage(known)],['RSS',fromRss]]){
  try{
    videos=(await load()).filter(valid).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,12);
    if(videos.length){console.log(name+'から取得');break;}
    errors.push(name+': 有効な動画がありません');
  }catch(e){errors.push(name+': '+e.message);}
}
if(videos.length){
  await mkdir(new URL('../assets/data/',import.meta.url),{recursive:true});
  await writeFile(target,JSON.stringify({channelId:channel,updatedAt:new Date().toISOString(),videos},null,2)+'\n');
  console.log('Updated '+videos.length+' videos（最新: '+videos[0].published+' '+videos[0].title+'）');
}else{
  // どちらも失敗：前回の一覧で公開は続けるが、実行記録に警告を出して気づけるようにする
  console.log('::warning title=YouTube動画一覧を更新できませんでした::'+errors.join(' / ')+'（前回 '+(old?.updatedAt||'なし')+' の一覧を使用）');
  if(!old?.videos?.length)process.exitCode=1;
}
