(() => {
  'use strict';
  const form=document.getElementById('economics-form');
  if(!form) return;
  const defaults={price:199,cost:30.05625,cpc:1.2,cvr:4,shipping:20,pack:5,units:6,days:30,fee:3,reserve:3,vat:15,goal:80};
  const presets={bundle:{price:199,cost:30.05625,units:6},mat:{price:129,cost:14.625,units:1}};
  const fmt=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const money=n=>fmt.format(n)+' ريال';
  const set=(id,text)=>document.getElementById(id).textContent=text;
  const calc=v=>{
    const factor=1+v.vat/100, rate=(v.fee+v.reserve)/100;
    const revenue=v.price/factor, cac=v.cpc/(v.cvr/100);
    const fulfil=(4+Math.max(0,v.units-3)*.5)*factor;
    const storage=(.1+.05*v.days)*v.units*factor;
    const fixed=v.cost+(v.shipping+v.pack)*factor+fulfil+storage+cac;
    const contribution=revenue-fixed-v.price*rate;
    const target=den=>den>0 ? money(fixed/den):'غير ممكن بهذه النسب';
    return {revenue,cac,fulfil,storage,fixed,contribution,rate,factor,
      targetNet:target((1-v.goal/100)/factor-rate),
      targetInvoice:target(1/factor-rate-v.goal/100)};
  };
  function render(){
    const valid=[...form.elements].every(el=>!el.willValidate||el.checkValidity());
    document.getElementById('econ-error').hidden=valid;
    document.getElementById('econ-results').hidden=!valid;
    if(!valid)return;
    const v=Object.fromEntries(Object.keys(defaults).map(k=>[k,Number(form.elements.namedItem(k).value)]));
    const r=calc(v);
    set('out-profit',money(r.contribution));
    set('out-margin',fmt.format(r.contribution/r.revenue*100)+'% دون VAT / '+fmt.format(r.contribution/v.price*100)+'% من فاتورة العميل');
    set('out-goods',fmt.format((1-v.cost/r.revenue)*100)+'%');
    set('out-cac',money(r.cac));
    set('out-target-net',r.targetNet);set('out-target-invoice',r.targetInvoice);
    const achieved=r.contribution/r.revenue>=v.goal/100;
    set('out-message','هدف '+fmt.format(v.goal)+'% '+(achieved?'متحقق من الإيراد دون VAT':'غير متحقق من الإيراد دون VAT')+'؛ '+(r.contribution/v.price>=v.goal/100?'متحقق':'غير متحقق')+' من فاتورة العميل. المساهمة قبل المصاريف الثابتة.');
    const rows=[['إيراد دون VAT',r.revenue],['منتجات DDP',v.cost],['توصيل محلي',v.shipping*r.factor],['كرتون',v.pack*r.factor],['تجهيز الطلب',r.fulfil],['استلام وتخزين',r.storage],['إعلانات CAC',r.cac],['رسوم دفع',v.price*v.fee/100],['احتياطي مرتجعات',v.price*v.reserve/100],['مساهمة الطلب',r.contribution],['CAC التعادل قبل الثابتة',r.contribution+r.cac]];
    const body=document.getElementById('econ-breakdown');body.replaceChildren();
    rows.forEach(([label,val])=>{const row=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=label;const td=document.createElement('td');td.textContent=fmt.format(val);row.append(th,td);body.append(row);});
    document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(Object.entries(presets[b.dataset.scenario]).every(([k,val])=>v[k]===val))));
  }
  function fill(values){Object.entries(values).forEach(([k,v])=>{form.elements.namedItem(k).value=v;});render();}
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('input',render);
  document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>fill({...defaults,...presets[b.dataset.scenario]})));
  document.getElementById('reset-economics').addEventListener('click',()=>fill(defaults));
  render();
})();
