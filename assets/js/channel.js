(() => {
  'use strict';
  const rail = document.getElementById('videoRail');
  const dialog = document.getElementById('videoDialog');
  const player = document.getElementById('videoPlayer');
  const prev = document.getElementById('videoPrev');
  const next = document.getElementById('videoNext');
  let returnFocus = null;
  function updateButtons() {
    prev.disabled = rail.scrollLeft < 5;
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 5;
  }
  function move(dir) { rail.scrollBy({left:dir*(rail.querySelector('.video-card')?.getBoundingClientRect().width+24 || rail.clientWidth),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); }
  prev.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
  rail.addEventListener('scroll',updateButtons,{passive:true}); window.addEventListener('resize',updateButtons);
  function closePlayer(){player.replaceChildren(); if(returnFocus?.isConnected)returnFocus.focus();}
  dialog.addEventListener('close',closePlayer);
  document.getElementById('videoClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function render(videos){
    const fragment=document.createDocumentFragment();
    for(const video of videos.slice(0,12)){
      if(!/^[\w-]{11}$/.test(video.id)||typeof video.title!=='string'||!Number.isFinite(Date.parse(video.published)))continue;
      const card=document.createElement('article');card.className='video-card';card.setAttribute('role','listitem');
      const link=document.createElement('a');link.href='https://www.youtube.com/watch?v='+video.id;link.setAttribute('aria-label','動画を再生：'+video.title);
      const thumb=document.createElement('div');thumb.className='video-thumb';
      const img=document.createElement('img');img.src='https://i.ytimg.com/vi/'+video.id+'/hqdefault.jpg';img.alt=video.title;img.loading='lazy';img.width=480;img.height=270;
      const play=document.createElement('span');play.className='video-play';play.textContent='▶';play.setAttribute('aria-hidden','true');thumb.append(img,play);
      const title=document.createElement('h3');title.textContent=video.title;
      const time=document.createElement('time');time.dateTime=video.published;time.textContent=new Date(video.published).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'});
      link.append(thumb,title);card.append(link,time);fragment.append(card);
      link.addEventListener('click',e=>{
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||typeof dialog.showModal!=='function')return;
        e.preventDefault();returnFocus=link;
        document.getElementById('videoDialogTitle').textContent=video.title;document.getElementById('videoExternal').href=link.href;
        const frame=document.createElement('iframe');frame.title=video.title;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.src='https://www.youtube-nocookie.com/embed/'+video.id+'?autoplay=1&rel=0';player.replaceChildren(frame);dialog.showModal();
      });
    }
    if(!fragment.childNodes.length)throw Error('No usable videos');
    rail.replaceChildren(fragment);updateButtons();
  }
  fetch('assets/data/youtube.json',{cache:'no-cache',signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error('Video feed unavailable');return r.json();}).then(data=>render(data.videos)).catch(()=>{
    rail.replaceChildren();const p=document.createElement('p');p.className='video-status';p.textContent='動画一覧を読み込めませんでした。';const a=document.createElement('a');a.href='https://www.youtube.com/@otake-kei';a.textContent='YouTubeで最新動画を見る ↗';p.append(a);rail.append(p);updateButtons();
  });
  // Analytics remains inactive until the owner supplies a verified measurement ID.
  const id=window.OTAKE_SITE?.gaMeasurementId;
  if(!/^G-[A-Z0-9]+$/.test(id||'')||location.hostname!=='www.otakekei.com')return;
  function startAnalytics(){
    window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());window.gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname});
    const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.append(s);
  }
  let consent;try{consent=localStorage.getItem('otake-analytics-consent');}catch{}
  if(consent==='yes'){startAnalytics();return;}if(consent==='no')return;
  const banner=document.createElement('aside');banner.className='privacy-banner';banner.setAttribute('aria-label','アクセス解析の設定');
  const p=document.createElement('p');p.textContent='サイト改善のため、Google Analyticsで閲覧数や訪問状況を計測します。許可した場合のみ計測用Cookieを使用します。';banner.append(p);
  for(const [label,value] of [['許可する','yes'],['許可しない','no']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{try{localStorage.setItem('otake-analytics-consent',value);}catch{}banner.remove();if(value==='yes')startAnalytics();});banner.append(b);}document.body.append(banner);
})();
