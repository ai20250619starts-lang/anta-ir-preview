import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const url = 'http://127.0.0.1:4321/en/';
const probe = () => ({
  js: document.documentElement.classList.contains('js'),
  hidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1').length,
  counts: [...document.querySelectorAll('[data-count]')].map((e) => e.textContent).join(' | '),
  sr: [...document.querySelectorAll('.ll-count .sr-only')].map((e) => e.textContent).join(' | '),
  bars: [...document.querySelectorAll('.ll-bar')].filter((e) => getComputedStyle(e).transform !== 'none').length,
  lead: getComputedStyle(document.querySelector('.ll-lanes .lead')).animationName,
});
// 1) JS off
let p = await b.newPage(); await p.setJavaScriptEnabled(false); await p.goto(url); console.log('no-js     ', JSON.stringify(await p.evaluate(probe)));
// 2) reduced motion
p = await b.newPage(); await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await p.goto(url); console.log('reduced   ', JSON.stringify(await p.evaluate(probe)));
// 3) normal, before scroll
p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 }); await p.goto(url); await new Promise((r) => setTimeout(r, 300)); console.log('motion t0 ', JSON.stringify(await p.evaluate(probe)));
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } });
await new Promise((r) => setTimeout(r, 2000)); console.log('motion end', JSON.stringify(await p.evaluate(probe)));
await b.close();
