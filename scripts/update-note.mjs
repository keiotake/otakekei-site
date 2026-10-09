import {readFile,writeFile,mkdir} from 'node:fs/promises';
const user='otake_kei';
const target=new URL('../assets/data/note.json',import.meta.url);
const cdata=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos);|&#(?:x[0-9a-f]+|\d+);/gi,x=>({ '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'" }[x] ?? String.fromCodePoint(x.startsWith('&#x')?parseInt(x.slice(3,-1),16):parseInt(x.slice(2,-1),10))));
try {
  const response=await fetch('https://note.com/'+user+'/rss',{headers:{'user-agent':'Mozilla/5.0 (otakekei.com feed)'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('note HTTP '+response.status);
  const xml=await response.text();
  const posts=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([,item])=>({
    title:decode(cdata(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').trim()),
    url:cdata(item.match(/<link>([\s\S]*?)<\/link>/)?.[1]||'').trim(),
    published:item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1],
    thumbnail:cdata(item.match(/<media:thumbnail[^>]*>([\s\S]*?)<\/media:thumbnail>/)?.[1]||item.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1]||'').trim()
  })).filter(p=>p.url.startsWith('https://note.com/'+user+'/n/')&&p.title&&Number.isFinite(Date.parse(p.published)))
    .sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,8)
    .map(p=>({title:p.title,url:p.url,published:new Date(p.published).toISOString(),thumbnail:/^https:\/\//.test(p.thumbnail)?p.thumbnail:''}));
  if(!posts.length)throw Error('note feed contained no valid entries');
  await mkdir(new URL('../assets/data/',import.meta.url),{recursive:true});
  await writeFile(target,JSON.stringify({user,updatedAt:new Date().toISOString(),posts},null,2)+'\n');
  console.log('Updated '+posts.length+' note posts');
}catch(error){
  console.error(error.message);
  try{const old=JSON.parse(await readFile(target,'utf8'));if(!old.posts?.length)throw Error('Empty fallback');console.warn('Using last successful feed from '+old.updatedAt);}catch{process.exitCode=1;}
}
