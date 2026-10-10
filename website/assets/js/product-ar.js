(() => {
  const image = document.querySelector('#product-main-image');
  const buttons = [...document.querySelectorAll('[data-product-image]')];
  const status = document.querySelector('.gallery-status');
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    image.src = button.dataset.productImage;
    image.alt = button.dataset.productAlt;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    status.textContent = `الصورة ${index + 1} من ${buttons.length}`;
  }));
  document.querySelector('.product-thumbnails').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const current = buttons.findIndex(button => button.getAttribute('aria-pressed') === 'true');
    const next = (current + (event.key === 'ArrowLeft' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].click(); buttons[next].focus();
  });
})();
