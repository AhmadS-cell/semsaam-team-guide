/* Shared Arabic storefront preview. Commerce remains native Salla integration work. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const menuToggle = $('[data-menu-toggle]');
  const menu = $('#mobile-menu');
  const closeMenu = () => { menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'فتح القائمة'); };
  menuToggle.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    closeMenu();
    const destination = a.hash && $(a.hash);
    if (destination) { destination.tabIndex = -1; destination.focus({preventScroll:true}); }
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuToggle.focus(); } });
  const mobile = matchMedia('(max-width:860px)');
  mobile.addEventListener('change', e => { if (!e.matches) closeMenu(); });

  const slides = $$('[data-hero-slide]');
  const dots = $$('[data-hero-dot]');
  const slider = $('[data-hero-slider]');
  if (slider) {
  const motionButton = $('[data-motion-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, motion = false, inView = true;
  const syncVideo = async () => {
    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (i === index && motion && inView && !document.hidden) {
        video.play().then(() => {
          if (i === index && motion && inView && !document.hidden) video.classList.add('is-playing');
          else { video.pause(); video.classList.remove('is-playing'); }
        }).catch(() => { motion = false; updateMotion(); });
      } else { video.pause(); video.classList.remove('is-playing'); }
    });
  };
  const updateMotion = () => {
    motionButton.setAttribute('aria-pressed', String(motion));
    const label = motion ? 'إيقاف الحركة' : 'تشغيل الحركة';
    motionButton.setAttribute('aria-label', label);
    motionButton.querySelector('[data-motion-icon]').textContent = motion ? 'Ⅱ' : '▷';
    motionButton.querySelector('.motion-label').textContent = label;
    syncVideo();
  };
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide,i) => { slide.hidden = i !== index; slide.classList.toggle('is-active',i === index); });
    dots.forEach((dot,i) => dot.setAttribute('aria-pressed',String(i === index)));
    $('[data-slide-status]').textContent = `${index + 1} من ${slides.length} · ${slides[index].querySelector('.hero-slide-label').textContent}`;
    syncVideo();
  };
  dots.forEach((dot,i) => dot.addEventListener('click', () => show(i)));
  $('[data-hero-prev]').addEventListener('click', () => show(index - 1));
  $('[data-hero-next]').addEventListener('click', () => show(index + 1));
  motionButton.addEventListener('click', () => { motion = !motion; updateMotion(); });
  slider.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(index + (e.key === 'ArrowLeft' ? 1 : -1)); } });
  document.addEventListener('visibilitychange', syncVideo);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncVideo(); }).observe(slider);
  reduced.addEventListener('change', () => { motion = false; updateMotion(); });
  }

  const dialog = $('#product-search');
  const materialVideo = $('[data-material-video]');
  const materialPlay = $('[data-material-play]');
  if (materialVideo && materialPlay) {
    const resetMaterial = () => {
      materialPlay.setAttribute('aria-pressed', 'false');
      materialPlay.textContent = '▷ شاهد الخامة بالحركة';
    };
    materialPlay.addEventListener('click', async () => {
      if (!materialVideo.paused) { materialVideo.pause(); return; }
      materialPlay.disabled = true;
      materialPlay.textContent = 'جارٍ التحميل…';
      $('[data-material-status]').textContent = '';
      $('[data-material-status]').hidden = true;
      try {
        if (!materialVideo.getAttribute('src')) materialVideo.src = materialVideo.dataset.src;
        await materialVideo.play();
        materialPlay.setAttribute('aria-pressed', 'true');
        materialPlay.textContent = 'Ⅱ إيقاف الحركة';
      } catch {
        resetMaterial();
        $('[data-material-status]').hidden = false;
        $('[data-material-status]').textContent = 'تعذّر تشغيل الحركة. يمكنك مشاهدة الصورة والتفاصيل.';
      } finally { materialPlay.disabled = false; }
    });
    materialVideo.addEventListener('pause', resetMaterial);
    materialVideo.addEventListener('ended', () => {
      resetMaterial();
      materialPlay.textContent = '↻ شاهد الخامة مرة ثانية';
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) materialVideo.pause(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) materialVideo.pause();
    }).observe(materialVideo);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
      if (event.matches) materialVideo.pause();
    });
  }
  const input = $('#product-query');
  dialog.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); dialog.close(); } });
  const catalog = [
    {title:'ديسك مات مطبوع',keywords:'ديسك مات desk mat مطبوع جيمينج gaming انمي',href:'#printed-mat'},
    {title:'Pro Control',keywords:'pro control تحكم ديسك مات منافسة',href:'#pro-control'},
    {title:'راحة المعصم',keywords:'راحة المعصم مسند كيبورد ماوس comfort wrist',href:'#comfort-rest'},
    {title:'كيت العناية',keywords:'كيت العناية تنظيف فرشاة care kit',href:'#care-kit'}
  ];
  if (!$('#printed-mat')) catalog.forEach(product => { product.href = `index.html${product.href}`; });
  const normalize = text => text.toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[\u064B-\u065F]/g,'').trim();
  const render = () => {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    const matches = catalog.filter(product => terms.every(term => normalize(product.keywords).includes(term)));
    const results = $('[data-search-results]');
    results.replaceChildren();
    matches.forEach(product => {
      const link = document.createElement('a');
      link.href = product.href;
      link.append(document.createTextNode(product.title));
      const arrow = document.createElement('span'); arrow.textContent = '↙'; arrow.setAttribute('aria-hidden','true'); link.append(arrow);
      link.addEventListener('click', () => {
        dialog.close();
        const destination = link.hash && $(link.hash);
        if (destination) destination.focus({preventScroll:true});
      });
      results.append(link);
    });
    $('[data-search-status]').textContent = matches.length === 1 ? 'منتج واحد' : matches.length ? `${matches.length} منتجات` : 'ما لقينا منتج بهذا الاسم. جرّب «ديسك مات» أو «راحة المعصم».';
  };
  $('[data-search-open]').addEventListener('click', () => { closeMenu(); input.value = ''; render(); dialog.showModal(); input.focus(); });
  $('[data-search-close]').addEventListener('click', () => dialog.close());
  $('[data-search-form]').addEventListener('submit', e => { e.preventDefault(); render(); });
  input.addEventListener('input', render);
})();
