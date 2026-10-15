'use strict';
(() => {
  let library=[];
  const openGroups=new Map();
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  window.getPortfolioMedia=()=>library;
  window.loadPortfolioMedia=async()=>{
    if(location.protocol!=='http:')return;
    const response=await fetch('/__portfolio/media',{cache:'no-store'});
    if(!response.ok)throw Error('Could not load Media files. Reopen Edit Website.cmd.');
    library=(await response.json()).files;
  };
  window.populateProjectExtras=(root,p,api)=>{
    const {field,changed,refresh,safeURL}=api;root.replaceChildren();
    const action=(parent,label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);parent.append(b);return b;};
    const key=api.cube?'reaction-wheel-cube':p.id;
    if(!openGroups.has(key))openGroups.set(key,new Set());
    const expanded=openGroups.get(key);
    const group=title=>{const box=el('details');box.className='instructions project-extra';box.open=expanded.has(title);box.append(el('summary',title));box.addEventListener('toggle',()=>{if(!box.isConnected)return;if(box.open)expanded.add(title);else expanded.delete(title);});root.append(box);return box;};
    const order=group('Section order');order.append(el('p','Move sections up or down. The headline image and three short sections stay together. Empty sections appear when you add content.'));
    const entries=window.portfolioSectionEntries(p,api.blocks||[],!!api.cube);
    entries.forEach((entry,i)=>{const row=el('div');row.dataset.sectionOrderKey=entry.key;row.style.cssText='display:flex;align-items:center;gap:6px;margin:8px 0';const title=el('span',entry.label);title.style.cssText='flex:1;min-width:0;overflow-wrap:anywhere';row.append(title);
      const move=delta=>{const target=i+delta;[p.sectionOrder[i],p.sectionOrder[target]]=[p.sectionOrder[target],p.sectionOrder[i]];expanded.add('Section order');refresh();changed();};
      const up=action(row,'↑',()=>move(-1));up.setAttribute('aria-label','Move '+entry.label+' up');up.disabled=i===0;
      const down=action(row,'↓',()=>move(1));down.setAttribute('aria-label','Move '+entry.label+' down');down.disabled=i===entries.length-1;order.append(row);
    });
    const picker=(parent,kind,value,callback)=>{
      field(parent,kind==='image'?'Image file path or URL':'Video file path or URL',value,callback);
      const select=el('select');select.setAttribute('aria-label',kind==='image'?'Choose image from Media':'Choose video from Media');
      select.append(new Option('Choose from your Media folder…',''));
      for(const item of library.filter(f=>f.kind===kind))select.append(new Option(item.name,item.src));
      select.value=value;select.addEventListener('change',()=>{if(select.value){callback(select.value);changed();refresh();}});
      parent.append(select);
      const hint=el('p',library.length?'Media files stay in the Media folder; no upload is needed.':'Open Edit Website.cmd to select files from Media, or enter a relative file path above.');hint.className='help';parent.append(hint);
    };
    const preview=(parent,src,kind='image')=>{if(!safeURL(src,true))return;const media=el(kind==='image'?'img':'video');media.className='media-preview';media.src=safeURL(src,true);if(kind==='image')media.alt='Selected image';else{media.controls=true;media.preload='metadata';}parent.append(media);};
    const rows=(parent,items,renderRow,make,label)=>{
      items.forEach((item,i)=>{const box=el('fieldset');box.append(el('legend',String(i+1)));renderRow(box,item);const actions=el('div');actions.className='media-buttons';
        action(actions,'↑',()=>{[items[i-1],items[i]]=[items[i],items[i-1]];refresh();changed();}).disabled=i===0;
        action(actions,'↓',()=>{[items[i+1],items[i]]=[items[i],items[i+1]];refresh();changed();}).disabled=i===items.length-1;
        action(actions,'Remove',()=>{items.splice(i,1);refresh();changed();});box.append(actions);parent.append(box);
      });action(parent,label,()=>{items.push(make());refresh();changed();});
    };
    const cover=group('Main headline image');
    picker(cover,'image',p.image,v=>p.image=v);preview(cover,p.image);
    field(cover,'Image description',p.imageAlt,v=>p.imageAlt=v);
    action(cover,'Remove headline image',()=>{p.image='';refresh();changed();});
    const motivation=group('Motivation');field(motivation,'Why you built this project (blank line between paragraphs)',p.motivation,v=>p.motivation=v,true).style.minHeight='220px';
    if(!api.cube){const short=group('Three short sections');p.facts.forEach((fact,i)=>{const box=el('fieldset');box.append(el('legend','Short section '+(i+1)));field(box,'Heading',fact.title,v=>fact.title=v);field(box,'Short description',fact.body,v=>fact.body=v,true);short.append(box);});}
    if(!api.cube){const engineering=group('Engineering details');field(engineering,'Design, calculations, challenges, and results',p.engineeringDetails,v=>p.engineeringDetails=v,true).style.minHeight='260px';}
    const gallery=group('Photo slideshow');
    rows(gallery,p.gallery,(box,item)=>{picker(box,'image',item.src,v=>item.src=v);preview(box,item.src);field(box,'Image description',item.alt,v=>item.alt=v);field(box,'Caption',item.caption,v=>item.caption=v,true);},()=>({src:'',alt:'',caption:''}),'+ Add slideshow photo');
    const videos=group('Videos');
    rows(videos,p.videos,(box,item)=>{field(box,'Video title',item.title,v=>item.title=v);picker(box,'video',item.src,v=>item.src=v);preview(box,item.src,'video');field(box,'Poster image path or URL (optional)',item.poster,v=>item.poster=v);field(box,'Caption',item.caption,v=>item.caption=v,true);},()=>({title:'',src:'',poster:'',caption:''}),'+ Add video');
    const cad=group('CAD files');
    const cadLabel=el('label','Upload CAD files (you can select several)');const cadUpload=el('input');cadUpload.type='file';cadUpload.multiple=true;cadUpload.accept='.stl,.step,.stp,.iges,.igs,.3mf,.obj,.f3d,.f3z,.sldprt,.sldasm,.ipt,.iam,.dwg,.dxf,.fcstd,.blend,.zip';cadUpload.setAttribute('aria-label','Upload CAD files');
    cadUpload.addEventListener('change',async()=>{try{const selected=[...cadUpload.files];if(!selected.length)return;const files=await Promise.all(selected.map(async file=>{if(file.size>20*1024*1024)throw Error(file.name+' exceeds the 20 MB file limit.');const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve('data:application/octet-stream;base64,'+String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});return {name:file.name,filename:file.name,src,description:'',size:file.size};}));p.cadFiles.push(...files);expanded.add('CAD files');refresh();changed();}catch(error){const message=el('p',error.message);message.setAttribute('role','alert');cad.append(message);}finally{cadUpload.value='';}});
    cadLabel.append(cadUpload);cad.append(cadLabel);
    rows(cad,p.cadFiles,(box,item)=>{field(box,'Display name',item.name,v=>item.name=v);field(box,'Download filename',item.filename,v=>item.filename=v);field(box,'Description',item.description,v=>item.description=v,true);if(item.src?.startsWith('data:'))box.append(el('p','Uploaded file included in your saved website.'));else field(box,'CAD file path or URL',item.src,v=>item.src=v);},()=>({name:'',filename:'',src:'',description:''}),'+ Add CAD link');
    const parts=group('Parts list');
    rows(parts,p.parts,(box,item)=>{field(box,'Part name',item.name,v=>item.name=v);field(box,'Quantity',item.quantity,v=>item.quantity=v);field(box,'Purchase / datasheet link',item.link,v=>item.link=v);picker(box,'image',item.image,v=>item.image=v);preview(box,item.image);field(box,'Notes / specifications',item.notes,v=>item.notes=v,true);},()=>({name:'',quantity:'',link:'',image:'',notes:''}),'+ Add part');
  };
})();
