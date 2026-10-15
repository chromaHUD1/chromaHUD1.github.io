/* Shared layout migration for the editor and existing saved portfolios. */
window.applyPortfolioLayout = function (doc) {
  const q = selector => doc.querySelector(selector);
  const el = (tag, cls, value) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (value !== undefined) n.textContent = value; return n; };
  const hero = q('.hero');
  const about = q('#about');
  const projects = q('#projects');
  if (!hero || !about || !projects) return;
  projects.before(about);
  const visual = q('.hero .visual');
  if (visual && !visual.classList.contains('profile-visual')) {
    visual.classList.add('profile-visual');
    visual.replaceChildren();
    visual.append(el('small', '', 'Engineering interests'));
    const name = q('.brand').cloneNode(true); name.querySelectorAll('span').forEach(n => n.remove());
    const initials = name.textContent.trim().split(/\s+/).map(s => s[0]).slice(0,2).join('');
    visual.append(el('div', 'profile-monogram', initials));
    const interests = el('div', 'profile-interests');
    q('.hero .eyebrow').textContent.split('/').map(s=>s.trim()).filter(Boolean).forEach((s,i)=>{const row=el('div');row.append(el('span','',String(i+1).padStart(2,'0')),el('strong','',s));interests.append(row);});
    visual.append(interests);
  }
  let grid = q('.project-grid');
  if (!grid) { grid=el('div','project-grid');projects.append(grid); }
  const feature=q('.feature');
  let cube=q('#reaction-wheel-project');
  if (!cube) {
    cube=el('details','project-disclosure featured-card');cube.id='reaction-wheel-project';
    const summary=el('summary');summary.append(el('span','number','01 / CONTROLS + ELECTRONICS'),el('h3','card-title',feature.querySelector('h3').textContent.replace(/\s+/g,' ')),el('span','card-prompt','Explore project'));
    cube.append(summary,feature);grid.prepend(cube);
  }
  const cards=q('.projects');if(cards.parentElement!==grid)grid.append(cards);
  [...cards.querySelectorAll('.project')].forEach(article=>{
    if(article.tagName==='DETAILS')return;
    const detail=el('details','project project-disclosure');
    const summary=el('summary');const category=article.querySelector('.number');const title=article.querySelector('h3');
    if(category)summary.append(category);if(title){title.classList.add('card-title');summary.append(title);}summary.append(el('span','card-prompt','Explore project'));
    const body=el('div','project-body');while(article.firstChild)body.append(article.firstChild);
    detail.append(summary,body);article.replaceWith(detail);
  });
  q('#project-layout-style')?.remove();
  const style=el('style');style.id='project-layout-style';style.textContent=`
    .hero{padding:85px 0 65px;grid-template-columns:1.35fr .8fr;gap:75px}
    h1{font-size:clamp(44px,5.4vw,72px)}h1 span{font-size:.65em;letter-spacing:-2px;display:inline-block;margin-top:20px;line-height:1.2}
    .profile-visual{padding:30px 34px;background:var(--ink);color:var(--paper)}
    .profile-monogram{font-size:100px;line-height:1.2;letter-spacing:-7px;margin:32px 0 38px;color:var(--accent)}
    .profile-interests>div{display:flex;gap:22px;align-items:center;padding:14px 0;border-top:1px solid #ffffff25}
    .profile-interests span{font:11px monospace;color:var(--accent)}.profile-interests strong{font-size:16px;font-weight:400}
    #about{padding-top:48px;padding-bottom:55px}#about h2{font-size:32px;margin-top:18px}#about p{margin-top:0}
    .project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}
    .project-grid>.projects{display:contents}
    details.project-disclosure{margin:0;padding:0;border:1px solid var(--line);background:#ffffff6b;min-height:0;border-radius:4px;overflow:hidden}
    .project-disclosure>summary{position:relative;list-style:none;display:block;padding:30px 60px 30px 30px;cursor:pointer;font-weight:400}
    .project-disclosure>summary::-webkit-details-marker{display:none}
    .project-disclosure>summary::after{content:'+';position:absolute;right:27px;top:30px;font-size:26px;line-height:1;color:var(--muted)}
    .project-disclosure[open]>summary::after{content:'−'}
    .project-disclosure>summary:hover{background:#ffffff}
    .project-disclosure .card-title{font-size:26px;line-height:1.25;margin:25px 0 18px;letter-spacing:-.8px}
    .card-prompt{font:12px monospace;color:var(--muted)}
    .project-disclosure[open]{grid-column:1/-1}
    .project-disclosure[open]>summary{border-bottom:1px solid var(--line)}
    .project-disclosure .feature{border:0;background:transparent;padding:30px;gap:30px}
    .project-body{padding:5px 30px 30px}.project-body p{font-size:17px;white-space:pre-line;max-width:800px}
    .project-body img{max-width:800px;height:auto!important;max-height:450px;object-fit:contain!important}
    .project-link{display:inline-block;margin-top:10px;font-size:14px}
    @media(max-width:760px){.hero{grid-template-columns:1fr;gap:30px;padding:50px 0}.profile-visual{padding:22px 28px}.profile-monogram{font-size:72px;margin:18px 0 24px}.project-grid{grid-template-columns:1fr}.project-disclosure>summary{padding:24px 55px 24px 24px}.project-disclosure .feature{padding:24px}.project-body{padding:5px 24px 24px}h1 span{letter-spacing:-1px}#about h2{font-size:28px}}
  `;doc.head.append(style);
};
