import {readFile,writeFile,mkdir} from 'node:fs/promises';
const channel='UCiLpfrO55MLhugHxiO7Gahg';
const target=new URL('../assets/data/youtube.json',import.meta.url);
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos);|&#(?:x[0-9a-f]+|\d+);/gi,x=>({ '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'" }[x] ?? String.fromCodePoint(x.startsWith('&#x')?parseInt(x.slice(3,-1),16):parseInt(x.slice(2,-1),10))));
try {
  const response=await fetch('https://www.youtube.com/feeds/videos.xml?channel_id='+channel,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('YouTube HTTP '+response.status);
  const xml=await response.text();
  const videos=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([,entry])=>({id:entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1],title:decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]||''),published:entry.match(/<published>(.*?)<\/published>/)?.[1]})).filter(v=>/^[\w-]{11}$/.test(v.id||'')&&v.title&&Number.isFinite(Date.parse(v.published))).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,12);
  if(!videos.length)throw Error('YouTube feed contained no valid entries');
  await mkdir(new URL('../assets/data/',import.meta.url),{recursive:true});
  await writeFile(target,JSON.stringify({channelId:channel,updatedAt:new Date().toISOString(),videos},null,2)+'\n');
  console.log('Updated '+videos.length+' videos');
}catch(error){
  console.error(error.message);
  try{const old=JSON.parse(await readFile(target,'utf8'));if(!old.videos?.length)throw Error('Empty fallback');console.warn('Using last successful feed from '+old.updatedAt);}catch{process.exitCode=1;}
}
