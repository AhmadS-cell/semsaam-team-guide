(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const pages = $$('.page');
  const nav = $$('#navigation a');
  const search = $('#search');
  const results = $('#search-results');
  const sidebar = $('#sidebar');
  const menu = $('#menu-button');
  const shade = $('#drawer-shade');
  const dialog = $('#image-dialog');
  let lastImageButton, toastTimer;
  document.body.classList.add('enhanced');
  const normalize = s => s.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
  const mobile = matchMedia('(max-width:900px)');
  const closeMenu = () => { sidebar.classList.remove('open'); sidebar.inert=mobile.matches; menu.setAttribute('aria-expanded','false'); shade.hidden = true; document.body.style.overflow=''; };
  mobile.addEventListener('change',closeMenu);
  function route(scroll = true) {
    const id = location.hash.slice(1) || 'overview';
    if(id==='main'){ $('#main').focus();return; }
    const page = pages.find(p => p.id === id) || pages[0];
    pages.forEach(p => p.classList.toggle('active',p===page));
    nav.forEach(a => a.hash === '#'+page.id ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'));
    $('#current-title').textContent = page.dataset.title;
    document.title = page.dataset.title+' | سمصام';
    closeMenu();
    if(scroll) window.scrollTo({top:0,behavior:'instant'});
  }
  window.addEventListener('hashchange',() => route());
  route(false);
  nav.forEach(a => a.addEventListener('click',() => { results.hidden=true; search.value=''; if(a.hash===location.hash){closeMenu();window.scrollTo(0,0);} }));
  menu.addEventListener('click',() => {
    const open = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open',open);sidebar.inert=!open; shade.hidden=!open; menu.setAttribute('aria-expanded',String(open));
    document.body.style.overflow=open?'hidden':'';
    if(open) nav.find(a=>a.hasAttribute('aria-current'))?.focus();
  });
  shade.addEventListener('click',closeMenu);
  document.addEventListener('keydown',e => {
    if(e.key==='Escape'){results.hidden=true;const wasOpen=sidebar.classList.contains('open');closeMenu();if(wasOpen)menu.focus();}
    if(e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !dialog.open){e.preventDefault();search.focus();}
    if(e.key==='Tab' && sidebar.classList.contains('open')){
      const focusable=[...sidebar.querySelectorAll('a,button')];
      if(e.shiftKey && document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}
      else if(!e.shiftKey && document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus();}
    }
  });
  const records=[];
  pages.forEach(p => {
    records.push({title:p.dataset.title,text:normalize(p.textContent),id:p.id,group:'قسم'});
    p.querySelectorAll('article').forEach((a,i) => {
      const title=a.querySelector('h2,h3')?.textContent;
      if(title) {a.id ||= p.id+'-item-'+i;records.push({title,text:normalize(a.textContent+' '+(a.dataset.search||'')),id:p.id,target:a.id,group:p.dataset.title});}
    });
  });
  search.addEventListener('input',() => {
    const query=normalize(search.value.trim());
    results.replaceChildren(); results.hidden=!query; if(!query)return;
    const matches=records.filter(r=>query.split(/\s+/).every(w=>r.text.includes(w))).slice(0,14);
    const label=document.createElement('p');label.className='result-count';label.textContent=matches.length?'نتائج البحث · '+matches.length:'لا توجد نتائج. جرّب اسم اللون أو المنتج أو الملف.';results.append(label);
    matches.forEach(r=>{
      const a=document.createElement('a');a.href='#'+r.id;a.textContent=r.title;
      const s=document.createElement('small');s.textContent=r.group;a.append(s);
      a.addEventListener('click',e=>{e.preventDefault();if(r.id==='gallery')$('[data-filter="all"]').click();location.hash=r.id;route();results.hidden=true;search.value='';if(r.target){requestAnimationFrame(()=>{const el=document.getElementById(r.target);el.scrollIntoView({block:'center'});el.setAttribute('tabindex','-1');el.focus({preventScroll:true});});}else $('#main').focus({preventScroll:true});});results.append(a);
    });
  });
  search.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('a')?.focus();}if(e.key==='Enter'){results.querySelector('a')?.click();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))results.hidden=true;});
  function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2600);}
  $$('.swatch').forEach(b=>b.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(b.dataset.color);toast('تم نسخ '+b.dataset.color);}
    catch{toast('تعذر النسخ التلقائي. قيمة اللون: '+b.dataset.color);}
  }));
  const cards=$$('.asset-card');
  const updateCount=()=>$('#gallery-count').textContent=cards.filter(c=>!c.hidden).length+' أصلًا';
  $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    cards.forEach(c=>c.hidden=b.dataset.filter!=='all' && c.dataset.group!==b.dataset.filter);updateCount();
  })); updateCount();
  $$('[data-image]').forEach(b=>b.addEventListener('click',()=>{
    lastImageButton=b;$('#image-title').textContent=b.dataset.title;$('#image-note').textContent=b.dataset.note;
    $('#image-source').textContent=b.dataset.source;$('#full-image').src=b.dataset.image;$('#full-image').alt=b.dataset.title;
    $('#image-download').href=b.dataset.image;dialog.showModal();$('#dialog-close').focus();
  }));
  $('#dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>lastImageButton?.focus());
})();
