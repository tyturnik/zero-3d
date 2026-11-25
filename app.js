/* Интерфейс сайта: меню, корзина, обжарка, бронь, переходы между страницами.
   Общее состояние лежит в window.ZERNO — его читает 3D-сцена (js/scene.js). */
{
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = window.ZERNO = { target: 'home', roast: 45, loc: 0, reduce };

/* ===== Данные: меняйте под клиента ===== */
const CUR = 'zł';
const MENU = {
  'Кофе': [
    ['Эспрессо', 'Плотный, с нотами какао', 9],
    ['Флэт уайт', 'Двойной эспрессо и бархатное молоко', 14],
    ['Капучино', 'Классика с густой пенкой', 13],
    ['Раф с халвой', 'Сливки, ваниль, тахинная халва', 17],
    ['Фильтр V60', 'Сорт дня, заварка вручную', 15],
    ['Колд брю', 'Настаиваем 18 часов', 16]
  ],
  'Не кофе': [
    ['Матча латте', 'Японская матча на овсяном', 18],
    ['Какао', 'На кокосовом молоке', 15],
    ['Улун', 'Молочный, чайник на двоих', 12]
  ],
  'Десерты': [
    ['Баскский чизкейк', 'Подкопчённый сверху', 19],
    ['Круассан', 'С фисташковым кремом', 16],
    ['Канеле', 'Карамельная корочка', 9]
  ]
};
const LOCS = [
  ['Каштановая, 12', 'Ростерия и бар · 7:30–21:00'],
  ['Солнечный бульвар, 4', 'У парка · 8:00–20:00'],
  ['Площадь Мастеров, 1', 'Рядом с вокзалом · 7:00–22:00']
];
const LV = [
  ['Светлая', 'Яркая кислотность, чай и цветы. Лучше всего в фильтре.', ['жасмин', 'бергамот', 'красное яблоко']],
  ['Средняя', 'Баланс сладости и тела — универсально для эспрессо и молока.', ['карамель', 'орех', 'молочный шоколад']],
  ['Тёмная', 'Плотно, горьковато, с дымком. Для тех, кто любит покрепче.', ['тёмный шоколад', 'табак', 'специи']]
];

let tab = 'Кофе', cart = {};

/* ===== Меню ===== */
const tabsEl = $('#tabs'), itemsEl = $('#items');
function renderMenu() {
  tabsEl.innerHTML = Object.keys(MENU).map(k => `<button role="tab" aria-selected="${k === tab}" data-t="${k}">${k}</button>`).join('');
  itemsEl.innerHTML = MENU[tab].map(([n, d, p]) => `<div class="item"><div class="row"><h3>${n}</h3><span class="price">${p} ${CUR}</span></div><p>${d}</p><button class="add" data-n="${n}" data-p="${p}">+ В заказ</button></div>`).join('');
}
tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; renderMenu(); } });
itemsEl.addEventListener('click', e => {
  const b = e.target.closest('.add'); if (!b) return;
  const n = b.dataset.n;
  cart[n] = cart[n] || { p: +b.dataset.p, q: 0 };
  cart[n].q++; renderCart();
  b.textContent = 'Добавлено ✓'; setTimeout(() => b.textContent = '+ В заказ', 900);
});

/* ===== Корзина ===== */
const drawer = $('#drawer');
function renderCart() {
  const ks = Object.keys(cart).filter(k => cart[k].q > 0);
  $('#badge').textContent = ks.reduce((s, k) => s + cart[k].q, 0);
  $('#lines').innerHTML = ks.length
    ? ks.map(k => `<div class="line"><span>${k}</span><span class="qty"><button data-m="${k}" aria-label="Меньше">−</button>${cart[k].q}<button data-pl="${k}" aria-label="Больше">+</button></span><span class="price">${cart[k].p * cart[k].q} ${CUR}</span></div>`).join('')
    : '<p class="empty">Пока пусто. Загляните в меню.</p>';
  $('#total').textContent = ks.reduce((s, k) => s + cart[k].p * cart[k].q, 0) + ' ' + CUR;
}
$('#lines').addEventListener('click', e => {
  const m = e.target.dataset.m, p = e.target.dataset.pl;
  if (m) cart[m].q--; if (p) cart[p].q++;
  if (m || p) renderCart();
});
$('#cartOpen').onclick = () => { drawer.classList.add('open'); $('#ok2').classList.remove('show'); };
$('#cartClose').onclick = () => drawer.classList.remove('open');
$('#checkout').onclick = () => {
  const o = $('#ok2');
  o.textContent = $('#badge').textContent === '0' ? 'Добавьте хотя бы одну позицию.' : 'Заказ собран. Это демо — он никуда не отправляется.';
  o.classList.add('show');
};
addEventListener('keydown', e => { if (e.key === 'Escape') drawer.classList.remove('open'); });

/* ===== Обжарка ===== */
function renderRoast() {
  const r = state.roast, l = LV[r < 34 ? 0 : r < 67 ? 1 : 2];
  $('#lvl').textContent = l[0] + ' · ' + Math.round(196 + r * .3) + '°C';
  $('#lvlTxt').textContent = l[1];
  $('#notes').innerHTML = l[2].map(n => `<span>${n}</span>`).join('');
}
$('#roastR').addEventListener('input', e => { state.roast = +e.target.value; renderRoast(); });

/* ===== Адреса и бронь ===== */
function renderLocs() {
  $('#locs').innerHTML = LOCS.map(([a, h], i) => `<button type="button" class="loc" aria-pressed="${i === state.loc}" data-i="${i}"><b>${a}</b><span>${h}</span></button>`).join('');
}
$('#locs').addEventListener('click', e => { const b = e.target.closest('.loc'); if (b) { state.loc = +b.dataset.i; renderLocs(); } });
const d = new Date();
$('#bDate').min = d.toISOString().slice(0, 10);
$('#bDate').value = new Date(d.getTime() + 864e5).toISOString().slice(0, 10);
$('#bTime').innerHTML = Array.from({ length: 12 }, (_, i) => `<option${i === 9 ? ' selected' : ''}>${i + 9}:00</option>`).join('');
$('#book').addEventListener('submit', e => {
  e.preventDefault();
  const ok = $('#ok'), n = $('#bName').value.trim(), t = $('#bTel').value.trim();
  ok.textContent = (!n || !t)
    ? 'Заполните имя и телефон.'
    : `Готово, ${n}! Столик на ${$('#bG').value} · ${$('#bDate').value.split('-').reverse().join('.')}, ${$('#bTime').value} · ${LOCS[state.loc][0]}. Это демо — заявка не отправляется.`;
  ok.classList.add('show');
});

/* ===== Переходы между страницами (#home, #menu, #roast, #visit) ===== */
const PAGES = ['home', 'menu', 'roast', 'visit'], wipe = $('#wipe');
let cur = null;
function apply(id) {
  cur = id; state.target = id;
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  scrollTo(0, 0);
}
function show(id, anim) {
  if (!PAGES.includes(id)) id = 'home';
  if (id === cur) return;
  drawer.classList.remove('open');
  if (anim && !reduce) {
    wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
    setTimeout(() => apply(id), 370);
  } else apply(id);
}
addEventListener('hashchange', () => show(location.hash.slice(1), true));

renderMenu(); renderCart(); renderRoast(); renderLocs();
show(location.hash.slice(1), false);
}
