'use strict';
window.initializePortfolioGalleries = function(doc) {
  doc.querySelectorAll('[data-gallery]').forEach(gallery=>{
    if(gallery.dataset.ready)return;gallery.dataset.ready='true';
    const slides=[...gallery.querySelectorAll('.gallery-slide')];let current=0;
    const show=index=>{current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==current;if(i!==current)slide.querySelectorAll('video').forEach(video=>video.pause());});gallery.querySelector('[data-gallery-count]').textContent=(current+1)+' / '+slides.length;};
    gallery.querySelector('[data-gallery-prev]').addEventListener('click',()=>show(current-1));
    gallery.querySelector('[data-gallery-next]').addEventListener('click',()=>show(current+1));
    gallery.addEventListener('keydown',event=>{if(event.target.closest('video'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));}});
    show(0);
  });
};
window.normalizePortfolioState = function(state) {
  state.cubeBlocks ||= [];
  state.cubeContent ||= {};
  for (const content of [state.cubeContent,...state.projects]) {
    content.motivation ||= ''; content.engineeringDetails ||= '';
    content.gallery ||= []; content.videos ||= []; content.parts ||= []; content.cadFiles ||= [];
  }
  const used = new Set(['reaction-wheel-cube']);
  for (const p of state.projects) {
    let id = (p.id || p.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'project';
    const initial=id;let suffix=2;while(used.has(id))id=initial+'-'+suffix++;p.id=id;used.add(id);p.blocks ||= [];p.facts ||= Array.from({length:3},()=>({title:'',body:''}));
  }
  for(const block of [state.cubeBlocks,...state.projects.map(p=>p.blocks)].flat()){
    block.id ||= crypto.randomUUID();
    if(block.type==='code'&&!Array.isArray(block.files)){
      block.files=[{filename:block.filename||'',language:block.language||'',code:block.code||''}];
      delete block.filename;delete block.language;delete block.code;
    }
  }
  window.portfolioSectionEntries(state.cubeContent,state.cubeBlocks,true);
  for(const p of state.projects)window.portfolioSectionEntries(p,p.blocks,false);
  return state;
};
window.portfolioSectionEntries = function(content,blocks,cube){
  const entries=[{key:'overview',label:'Headline image + three short sections'},{key:'motivation',label:'Motivation'}];
  if(cube)entries.push({key:'technologies',label:'Technologies'},{key:'simulation',label:'Simulation'},{key:'videos',label:'Videos'});
  entries.push({key:'engineering',label:'Engineering details'});
  if(!cube)entries.push({key:'links',label:'Project / demo link'});
  for(const block of blocks)entries.push({key:'content:'+block.id,label:block.heading||({code:'Code category',text:'Text section',image:'Photo'}[block.type]||'Content')});
  entries.push({key:'photos',label:'Photo slideshow'});if(!cube)entries.push({key:'videos',label:'Videos'});
  entries.push({key:'cad',label:'CAD files'},{key:'parts',label:'Parts list'});
  const keys=new Set(entries.map(entry=>entry.key));const order=(content.sectionOrder||[]).filter(key=>keys.has(key));
  for(const entry of entries)if(!order.includes(entry.key)){const photos=order.indexOf('photos');if(entry.key.startsWith('content:')&&photos>=0)order.splice(photos,0,entry.key);else order.push(entry.key);}
  content.sectionOrder ||= [];content.sectionOrder.splice(0,content.sectionOrder.length,...new Set(order));
  return content.sectionOrder.map(key=>entries.find(entry=>entry.key===key));
};
window.createPortfolioPages = function(canonicalHTML, rawState) {
  const state=window.normalizePortfolioState(structuredClone(rawState));
  const parser=new DOMParser();const canonical=parser.parseFromString(canonicalHTML,'text/html');
  const pages={};
  const url=value=>{value=String(value||'').trim();if(/^(https?:\/\/|data:image\/|data:video\/mp4[;,]|data:application\/pdf[;,])/i.test(value))return value;if(/^[a-z][a-z\d+.-]*:/i.test(value)||value.startsWith('//')||value.includes('\\'))return '';return value;};
  const elem=(doc,tag,value,cls)=>{const n=doc.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
  const styles=`
    #about p{white-space:pre-line}
    .profile-monogram.has-cover{font-size:0;letter-spacing:0}.about-cover{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px}.project-videos .gallery-slide[hidden]{display:none}
    .project-gallery figure{margin:0}.project-gallery img{width:100%;height:clamp(250px,55vw,620px);object-fit:contain;background:#fff;border-radius:4px}.gallery-slide[hidden]{display:none}
    .gallery-controls{display:flex;align-items:center;gap:20px;margin-top:18px}.gallery-controls button{border:1px solid var(--line);background:var(--paper);color:var(--ink);padding:12px 18px;border-radius:4px;cursor:pointer;font:inherit}
    .project-gallery figcaption,.project-videos figcaption{color:var(--muted);margin-top:12px;white-space:pre-line;line-height:1.7}.project-videos figure{margin:24px 0}.project-videos video{width:100%;max-height:650px;background:#111;border-radius:4px}.project-videos h3{font-size:22px}
    .parts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:20px}.part-card{padding:22px;border:1px solid var(--line);border-radius:4px;min-width:0}.part-card img{width:100%;height:180px;object-fit:contain;background:white;margin-bottom:20px}.part-card h3{font-size:22px;margin:0 0 12px}.part-card a{overflow-wrap:anywhere}.part-card p{font-size:15px}
    .page-heading{padding:60px 0 35px}.page-heading h1{font-size:clamp(38px,5vw,64px);line-height:1.1;letter-spacing:-2px;max-width:1000px;margin:22px 0}
    .page-heading p{font-size:19px;color:var(--muted);max-width:800px;line-height:1.7}.back-link{font:13px monospace;text-decoration:none}
    .project-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;padding-bottom:60px}
    a.project-card{display:block;text-decoration:none;padding:30px;border:1px solid var(--line);border-radius:4px;background:#ffffff6b;min-width:0;transition:background .15s}
    a.project-card:hover{background:white}a.project-card h3{font-size:26px;line-height:1.25;margin:22px 0 18px}a.project-card .card-prompt{display:block;margin-top:20px}
    .card-cover{width:100%;height:230px;object-fit:contain;display:block;margin:22px 0;background:white;border-radius:3px}.card-summary{font-size:15px;color:var(--muted);margin-top:15px}
    .project-page .feature{margin-bottom:45px;background:transparent;border:0;padding:0;min-width:0}.project-page .feature>div{min-width:0}
    .project-page #cube-details h2{font-size:32px}.project-page #cube-details p,.detail-prose p{font-size:17px;color:var(--muted);line-height:1.8;white-space:pre-line}
    .project-page #cube-details{border-top:1px solid var(--line);padding-top:30px}.detail-prose{max-width:900px;padding-bottom:30px}
    .project-overview.no-cover{display:block}.overview-facts p{white-space:pre-line}
    .project-overview{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(24px,4vw,60px);align-items:center;margin-bottom:40px}.project-overview .detail-cover{margin:0;max-height:550px}.overview-facts{min-width:0}.overview-facts .fact:first-child{margin-top:0}.project-page .feature{display:block}.project-page .feature>div{margin-bottom:24px} @media(max-width:760px){.project-overview{grid-template-columns:1fr;gap:24px}.project-overview .detail-cover{max-height:380px}}
    .detail-cover{width:100%;max-height:550px;object-fit:contain;background:white;margin-bottom:35px;border-radius:4px}
    .content-block{padding:30px 0;border-top:1px solid var(--line);min-width:0}.content-block h2{font-size:30px;letter-spacing:-1px;line-height:1.25}
    .content-block p{font-size:17px;line-height:1.8;color:var(--muted);white-space:pre-line;max-width:950px}.content-block figure{margin:0}.content-block img{max-width:100%;max-height:720px;object-fit:contain;border-radius:4px;display:block}
    .content-block figcaption{font-size:14px;color:var(--muted);margin-top:14px}.content-block pre{background:var(--ink);color:var(--paper);padding:24px;border-radius:4px;overflow:auto;max-width:100%;font:14px/1.7 Consolas,monospace;tab-size:4}.code-label{font:12px monospace;color:var(--muted)}
    .code-category .code-file+.code-file{margin-top:12px}
    .code-file{border:1px solid var(--line);border-radius:4px;background:#ffffff6b;min-width:0}.code-file summary{cursor:pointer;padding:18px 22px;font:15px/1.5 Consolas,monospace;overflow-wrap:anywhere}.code-file summary:hover{background:#ffffff}.code-file summary:focus-visible{outline:3px solid var(--ink);outline-offset:3px}.code-file .code-label{margin:16px 22px 0}.code-file pre{margin:12px;border-radius:3px}
    .project-page{padding-bottom:60px}nav a[aria-current=page]{font-weight:700;text-decoration:underline;text-underline-offset:6px}.project-cards:empty{display:none}
    @media(max-width:760px){.project-cards{grid-template-columns:1fr}.page-heading{padding:40px 0 25px}.page-heading h1{letter-spacing:-1px}.project-page .feature{padding:0}.card-cover{height:190px}a.project-card{padding:24px}.content-block pre{padding:16px;font-size:12px}}
    @media(prefers-reduced-motion:reduce){a.project-card{transition:none}}
  `;
  function shell(title,current){const doc=canonical.cloneNode(true);doc.querySelectorAll('script,base').forEach(n=>n.remove());doc.title=title+' — '+state.name;const main=doc.querySelector('main');main.replaceChildren();main.removeAttribute('id');doc.querySelector('.brand').href='index.html';const nav=doc.querySelector('nav');nav.replaceChildren();for(const [label,href]of[['About','index.html'],['Projects','projects.html']]){const a=elem(doc,'a',label);a.href=href;if(href===current)a.setAttribute('aria-current','page');nav.append(a);}const style=elem(doc,'style');style.textContent=styles;doc.head.append(style);return doc;}
  function serialize(doc){
    doc.querySelectorAll('p,figcaption').forEach(paragraph=>{
      const walker=doc.createTreeWalker(paragraph,4);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      for(const node of nodes){if(node.parentElement.closest('em,code,pre'))continue;const pattern=/(?<!\*)\*([^*\n]+)\*(?!\*)/g;const fragment=doc.createDocumentFragment();let end=0,found=false;for(const match of node.textContent.matchAll(pattern)){found=true;fragment.append(doc.createTextNode(node.textContent.slice(end,match.index)));fragment.append(elem(doc,'em',match[1]));end=match.index+match[0].length;}if(found){fragment.append(doc.createTextNode(node.textContent.slice(end)));node.replaceWith(fragment);}}
    });
    return '<!doctype html>\n'+doc.documentElement.outerHTML;
  }
  const list=[{id:'reaction-wheel-cube',title:state.cubeTitle.replace(/\n/g,' '),category:'CONTROLS + ELECTRONICS',description:state.cubeSummary,image:state.cubeImage||state.videoPoster,imageAlt:state.cubeImage?state.cubeImageAlt:'Reaction wheel simulation preview'},...state.projects];
  function cards(doc,home=false){const grid=elem(doc,'div',undefined,'project-cards');list.forEach((p,i)=>{const a=elem(doc,'a',undefined,'project-card');a.id=p.id;a.href=home?'projects.html#'+p.id:'project-'+p.id+'.html';a.append(elem(doc,'span',String(i+1).padStart(2,'0')+' / '+p.category,'number'));if(!home&&url(p.image)){const img=elem(doc,'img');img.src=url(p.image);img.alt=p.imageAlt||p.title;img.loading='lazy';img.className='card-cover';a.append(img);}a.append(elem(doc,'h3',p.title));if(!home&&p.description)a.append(elem(doc,'p',p.description.length>180?p.description.slice(0,177)+'…':p.description,'card-summary'));a.append(elem(doc,'span',home?'See projects ↗':'Open project ↗','card-prompt'));grid.append(a);});return grid;}
  const home=shell('About','index.html');const main=home.querySelector('main');main.id='top';for(const selector of ['.hero','#about']){main.append(canonical.querySelector(selector).cloneNode(true));}main.querySelector('.hero .button').href='projects.html';const previews=elem(home,'section',undefined,'section');previews.id='projects';const heading=elem(home,'div',undefined,'sectionhead');heading.append(elem(home,'h2','Selected projects'));const see=elem(home,'a','See all projects ↗');see.href='projects.html';heading.append(see);previews.append(heading,cards(home,true));main.append(previews);const contact=canonical.querySelector('#portfolio-contact');if(contact)main.append(contact.cloneNode(true));
  const payload=elem(home,'script');payload.type='application/json';payload.id='portfolio-content';payload.textContent=JSON.stringify({format:'owen-portfolio-site',version:2,state}).replace(/</g,'\\u003c');home.body.append(payload);pages['index.html']=serialize(home);
  const listing=shell('Projects','projects.html');const listingMain=listing.querySelector('main');const header=elem(listing,'section',undefined,'page-heading');header.append(elem(listing,'small','Personal engineering projects'),elem(listing,'h1','Projects'),elem(listing,'p','Explore my work in electrical engineering, optics, and controls. Open a project for its design, documentation, and demonstrations.'));listingMain.append(header,cards(listing));pages['projects.html']=serialize(listing);
  function addBlocks(doc,main,blocks){for(const block of blocks||[]){const section=elem(doc,'section',undefined,'content-block');section.dataset.sectionKey='content:'+block.id;if(block.heading)section.append(elem(doc,'h2',block.heading));if(block.type==='text'){String(block.body||'').split(/\n\s*\n/).filter(s=>s.trim()).forEach(s=>section.append(elem(doc,'p',s)));}else if(block.type==='image'&&url(block.src)){const figure=elem(doc,'figure');const img=elem(doc,'img');img.src=url(block.src);img.alt=block.alt||block.caption||'Project image';img.loading='lazy';figure.append(img);if(block.caption)figure.append(elem(doc,'figcaption',block.caption));section.append(figure);}else if(block.type==='code'){section.classList.add('code-category');for(const file of block.files){const disclosure=elem(doc,'details',undefined,'code-file');disclosure.append(elem(doc,'summary',file.filename||file.language||'View code'));if(file.filename&&file.language)disclosure.append(elem(doc,'div',file.language,'code-label'));if(file.kind==='archive'){if(/^data:application\/zip;base64,[a-z\d+/=]+$/i.test(file.src||'')){const a=elem(doc,'a','Download ZIP ↓','archive-download');a.href=file.src;a.download=file.filename||'code.zip';a.style.cssText='display:inline-block;margin:12px 22px 22px';disclosure.append(a);}}else{const pre=elem(doc,'pre');pre.append(elem(doc,'code',file.code||''));disclosure.append(pre);}section.append(disclosure);}}main.append(section);}}
  function prose(doc,main,title,text){if(!String(text||'').trim())return;const section=elem(doc,'section',undefined,'content-block detail-prose');section.append(elem(doc,'h2',title));String(text).split(/\n\s*\n/).filter(s=>s.trim()).forEach(s=>section.append(elem(doc,'p',s)));main.append(section);}
  function addMedia(doc,main,p){
    const photos=p.gallery.filter(item=>url(item.src));
    if(photos.length){const section=elem(doc,'section',undefined,'content-block project-gallery');section.dataset.gallery='';section.tabIndex=0;section.setAttribute('aria-label','Project photo slideshow');section.append(elem(doc,'h2','Photos'));
      photos.forEach((item,i)=>{const figure=elem(doc,'figure',undefined,'gallery-slide');figure.hidden=i!==0;const img=elem(doc,'img');img.src=url(item.src);img.alt=item.alt||item.caption||'Project photo '+(i+1);img.loading=i?'lazy':'eager';figure.append(img);if(item.caption)figure.append(elem(doc,'figcaption',item.caption));section.append(figure);});
      const controls=elem(doc,'div',undefined,'gallery-controls');const prev=elem(doc,'button','← Previous');prev.type='button';prev.dataset.galleryPrev='';const count=elem(doc,'span','1 / '+photos.length);count.dataset.galleryCount='';count.setAttribute('aria-live','polite');const next=elem(doc,'button','Next →');next.type='button';next.dataset.galleryNext='';controls.append(prev,count,next);if(photos.length<2){prev.disabled=true;next.disabled=true;}section.append(controls);main.append(section);
      const script=elem(doc,'script');script.textContent='('+window.initializePortfolioGalleries.toString()+')(document);';doc.body.append(script);
    }
    const videos=p.videos.filter(item=>url(item.src));if(videos.length){const section=elem(doc,'section',undefined,'content-block project-videos');section.dataset.gallery='';section.tabIndex=0;section.setAttribute('aria-label','Project video slideshow');section.append(elem(doc,'h2','Videos'));for(const [i,item] of videos.entries()){const figure=elem(doc,'figure',undefined,'gallery-slide');figure.hidden=i!==0;if(item.title)figure.append(elem(doc,'h3',item.title));const video=elem(doc,'video');video.controls=true;video.preload='metadata';video.setAttribute('playsinline','');video.setAttribute('aria-label',item.title||'Project video');if(url(item.poster))video.poster=url(item.poster);video.src=url(item.src);const fallback=elem(doc,'a','Open video');fallback.href=url(item.src);video.append(fallback);figure.append(video);if(item.caption)figure.append(elem(doc,'figcaption',item.caption));const open=elem(doc,'a','Open video file ↗');open.href=url(item.src);figure.append(open);section.append(figure);}const controls=elem(doc,'div',undefined,'gallery-controls');const prev=elem(doc,'button','← Previous');prev.type='button';prev.dataset.galleryPrev='';const count=elem(doc,'span','1 / '+videos.length);count.dataset.galleryCount='';count.setAttribute('aria-live','polite');const next=elem(doc,'button','Next →');next.type='button';next.dataset.galleryNext='';if(videos.length<2){prev.disabled=true;next.disabled=true;}controls.append(prev,count,next);section.append(controls);main.append(section);if(!photos.length){const script=elem(doc,'script');script.textContent='('+window.initializePortfolioGalleries.toString()+')(document);';doc.body.append(script);}}
  }
  function addCAD(doc,main,p){
    const files=p.cadFiles.filter(file=>file.src);if(!files.length)return;
    const section=elem(doc,'section',undefined,'content-block cad-files');section.append(elem(doc,'h2','CAD files'));const grid=elem(doc,'div',undefined,'parts-grid');
    for(const file of files){const src=/^data:application\/octet-stream;base64,[a-z\d+/=]+$/i.test(file.src)?file.src:url(file.src);if(!src)continue;const card=elem(doc,'article',undefined,'part-card');card.append(elem(doc,'h3',file.name||file.filename||'CAD file'));if(file.description)card.append(elem(doc,'p',file.description));const a=elem(doc,'a','Download '+(file.filename||file.name||'CAD file')+' ↓');a.href=src;a.download=file.filename||file.name||'cad-file';card.append(a);grid.append(card);}if(grid.children.length){section.append(grid);main.append(section);}
  }
  function appendOverview(doc,main,image,facts){
    if(!image&&!facts.some(fact=>fact.title||fact.body))return;
    const row=elem(doc,'section',undefined,'project-overview');if(image)row.append(image);else row.classList.add('no-cover');const text=elem(doc,'div',undefined,'overview-facts');
    for(const fact of facts){if(!fact.title&&!fact.body)continue;const section=elem(doc,'div',undefined,'fact');if(fact.title)section.append(elem(doc,'strong',fact.title));if(fact.body)section.append(elem(doc,'p',fact.body));text.append(section);}row.append(text);main.append(row);
  }
  function arrangeSections(main,content,cube){
    const mark=(node,key)=>{if(node)node.dataset.sectionKey=key;};
    const feature=main.querySelector('article.feature');
    if(feature){mark(feature.querySelector('.tags')?.parentElement,'technologies');mark(feature.querySelector('#cube-details'),'engineering');const simulation=feature.querySelector('video')?.closest('figure');if(simulation){mark(simulation,'simulation');simulation.classList.add('feature');}if(!main.querySelector('.project-overview'))mark(feature.querySelector('.fact')?.parentElement,'overview');for(const child of [...feature.children])main.append(child);feature.remove();}
    mark(main.querySelector('.project-overview'),'overview');mark(main.querySelector('.project-gallery'),'photos');mark(main.querySelector('.project-videos'),'videos');mark(main.querySelector('.cad-files'),'cad');mark(main.querySelector('.parts-list'),'parts');
    for(const prose of main.querySelectorAll(':scope > .detail-prose'))mark(prose,prose.querySelector('h2')?.textContent==='Motivation'?'motivation':'engineering');
    mark(main.querySelector(':scope > a.button'),'links');
    for(const key of content.sectionOrder){const node=[...main.children].find(child=>child.dataset.sectionKey===key);if(node)main.append(node);}
  }
  function addParts(doc,main,p){const parts=p.parts.filter(item=>item.name||item.image||item.link||item.notes);if(!parts.length)return;const section=elem(doc,'section',undefined,'content-block parts-list');section.append(elem(doc,'h2','Parts list'));const grid=elem(doc,'div',undefined,'parts-grid');for(const part of parts){const card=elem(doc,'article',undefined,'part-card');if(url(part.image)){const img=elem(doc,'img');img.src=url(part.image);img.alt=part.name||'Project part';img.loading='lazy';card.append(img);}card.append(elem(doc,'h3',part.name||'Part'));if(part.quantity)card.append(elem(doc,'p','Quantity: '+part.quantity));if(part.notes)card.append(elem(doc,'p',part.notes));if(url(part.link)){const a=elem(doc,'a','Part / datasheet ↗');a.href=url(part.link);a.target='_blank';a.rel='noopener noreferrer';card.append(a);}grid.append(card);}section.append(grid);main.append(section);}
  list.forEach((p,index)=>{const doc=shell(p.title,'projects.html');const detail=doc.querySelector('main');detail.className='project-page';detail.setAttribute('data-project-id',p.id);const top=elem(doc,'section',undefined,'page-heading');const back=elem(doc,'a','← All projects','back-link');back.href='projects.html#'+p.id;top.append(back,elem(doc,'h1',p.title));if(p.description)top.append(elem(doc,'p',p.description));detail.append(top);const content=index===0?state.cubeContent:p;const cover=index===0?state.cubeImage:p.image;let headlineImage=null;if(url(cover)){headlineImage=elem(doc,'img');headlineImage.src=url(cover);headlineImage.alt=(index===0?state.cubeImageAlt:p.imageAlt)||p.title;headlineImage.className='detail-cover';}if(index===0){const feature=canonical.querySelector('.feature').cloneNode(true);feature.querySelector('#cube-photo')?.remove();const first=feature.querySelector(':scope > div');first.querySelector('.eyebrow')?.remove();first.querySelector('h3')?.remove();first.querySelector('p')?.remove();const details=feature.querySelector('#cube-details details');if(details){const section=elem(doc,'section');section.append(elem(doc,'h2',details.querySelector('summary').textContent));details.querySelectorAll('p').forEach(n=>section.append(n.cloneNode(true)));details.replaceWith(section);}if(headlineImage){const facts=feature.querySelector('.fact')?.parentElement;const overview=elem(doc,'section',undefined,'project-overview');overview.append(headlineImage);if(facts){facts.classList.add('overview-facts');overview.append(facts);}detail.append(overview);}prose(doc,detail,'Motivation',content.motivation);detail.append(feature);addBlocks(doc,detail,state.cubeBlocks);}else{appendOverview(doc,detail,headlineImage,p.facts);prose(doc,detail,'Motivation',content.motivation);prose(doc,detail,'Engineering details',p.engineeringDetails);if(url(p.link)){const a=elem(doc,'a','View code or demo ↗','button');a.href=url(p.link);a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}addBlocks(doc,detail,p.blocks);}addMedia(doc,detail,content);if(index===0){const simulation=detail.querySelector('.feature video')?.closest('figure');const videos=detail.querySelector('.project-videos');if(simulation&&videos)simulation.after(videos);}addCAD(doc,detail,content);addParts(doc,detail,content);arrangeSections(detail,content,index===0);const footerBack=elem(doc,'a','← Back to all projects','back-link');footerBack.href='projects.html';detail.append(footerBack);pages['project-'+p.id+'.html']=serialize(doc);});
  return pages;
};
