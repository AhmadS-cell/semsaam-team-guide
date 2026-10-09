(() => {
 'use strict';
 document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => {
   document.body.classList.add('print-topic');
   window.print();
 }));
 window.addEventListener('afterprint', () => document.body.classList.remove('print-topic'));
})();
