(() => {
  'use strict';
  const cards = [...document.querySelectorAll('[data-catalog-card]')];
  const filters = [...document.querySelectorAll('[data-category-filter]')];
  const query = document.querySelector('#catalog-query');
  const sort = document.querySelector('#catalog-sort');
  const grid = document.querySelector('[data-catalog-grid]');
  const empty = document.querySelector('[data-catalog-empty]');
  const allowed = new Set(['all', 'mats', 'accessories']);
  const initial = new URLSearchParams(location.search).get('category');
  let category = allowed.has(initial) ? initial : 'all';
  const normalize = value => value.toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[\u064B-\u065F]/g,'').trim();
  const render = () => {
    const terms = normalize(query.value).split(/\s+/).filter(Boolean);
    const ordered = sort.value === 'name' ? [...cards].sort((a,b) => a.dataset.name.localeCompare(b.dataset.name,'ar')) : cards;
    let count = 0;
    ordered.forEach(card => {
      const matches = (category === 'all' || card.dataset.category === category) && terms.every(term => normalize(card.dataset.name+' '+card.dataset.keywords).includes(term));
      card.hidden = !matches;
      if (matches) count++;
      grid.append(card);
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));
    document.querySelector('[data-catalog-count]').textContent = count === 1 ? 'اختيار واحد' : count === 2 ? 'اختياران' : `${count} اختيارات`;
    empty.hidden = count > 0;
  };
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.categoryFilter;
    const url = new URL(location.href);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category',category);
    history.replaceState(null,'',url);
    render();
  }));
  query.addEventListener('input',render);
  sort.addEventListener('change',render);
  document.querySelector('[data-catalog-reset]').addEventListener('click', () => {
    category = 'all'; query.value = ''; sort.value = 'featured';
    const url = new URL(location.href);url.searchParams.delete('category');history.replaceState(null,'',url);
    render();query.focus();
  });
  render();
})();
