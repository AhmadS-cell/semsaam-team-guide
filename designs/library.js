(() => {
  'use strict';
  const cards = [...document.querySelectorAll('[data-card]')];
  const query = document.querySelector('#library-search');
  const category = document.querySelector('#library-category');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#no-results');
  const normalize = text => text.normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g, '').replace(/[أإآ]/g, 'ا').toLowerCase();
  function filter() {
    const value = normalize(query?.value || '');
    let shown = 0;
    cards.forEach(card => {
      const matches = normalize(card.dataset.search).includes(value) && (!category?.value || card.dataset.category === category.value);
      card.hidden = !matches;
      if (matches) shown++;
    });
    if (count) count.textContent = `${shown} من ${cards.length} ${document.body.dataset.mode === 'references' ? 'مراجع' : 'تصاميم'}`;
    if (empty) empty.hidden = shown !== 0;
  }
  query?.addEventListener('input', filter);
  category?.addEventListener('change', filter);
  filter();
  const viewer = document.querySelector('#art-viewer');
  const viewerImage = viewer?.querySelector('img');
  document.querySelectorAll('[data-open-art]').forEach(button => button.addEventListener('click', () => {
    const image = button.querySelector('img');
    viewerImage.src = image.src;
    viewerImage.alt = image.alt;
    document.querySelector('#viewer-title').textContent = image.alt;
    viewer.showModal();
  }));
  viewer?.querySelector('button')?.addEventListener('click', () => viewer.close());
  viewer?.addEventListener('close', () => { viewerImage.removeAttribute('src'); });
  const menu = document.querySelector('#menu-button');
  const sidebar = document.querySelector('#sidebar');
  const shade = document.querySelector('#drawer-shade');
  const mobile = matchMedia('(max-width: 900px)');
  function closeMenu() {
    sidebar?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    if (shade) shade.hidden = true;
    if (sidebar) sidebar.inert = mobile.matches;
    document.body.style.overflow = '';
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    sidebar.classList.toggle('open', open);
    sidebar.inert = !open && mobile.matches;
    menu.setAttribute('aria-expanded', String(open));
    shade.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) sidebar.querySelector('a')?.focus();
  });
  shade?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
    if (event.key === 'Tab' && menu?.getAttribute('aria-expanded') === 'true') {
      const items = [...sidebar.querySelectorAll('a,button')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  mobile.addEventListener('change', closeMenu);
  if (sidebar) sidebar.inert = mobile.matches;
})();
