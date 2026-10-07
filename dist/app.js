'use strict';
const heroMedia = window.matchMedia('(max-width: 850px)');
const reducedHeroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroAmbient = document.querySelector('.hero-ambient');
let heroSceneRequested = false;
let heroInView = true;
function updateHeroMotion() {
  const videoEnabled = heroMedia.matches && !reducedHeroMotion.matches && !navigator.connection?.saveData;
  if (videoEnabled && heroInView && !document.hidden) {
    heroAmbient.querySelectorAll('source[data-src]').forEach(source => { if (!source.src) source.src = source.dataset.src; });
    if (heroAmbient.readyState === 0) heroAmbient.load();
    heroAmbient.play().then(() => {
      if (heroMedia.matches && !reducedHeroMotion.matches && heroInView && !document.hidden) document.documentElement.classList.add('hero-video-active');
      else heroAmbient.pause();
    }).catch(() => document.documentElement.classList.remove('hero-video-active'));
  } else {
    heroAmbient.pause();
    if (!videoEnabled) document.documentElement.classList.remove('hero-video-active');
  }
  if (!heroMedia.matches && !reducedHeroMotion.matches && !navigator.connection?.saveData && !heroSceneRequested) {
    heroSceneRequested = true;
    import('./hero-scene.js').catch(() => document.documentElement.classList.remove('hero-webgl'));
  }
}
heroMedia.addEventListener('change', updateHeroMotion);
reducedHeroMotion.addEventListener('change', updateHeroMotion);
document.addEventListener('visibilitychange', updateHeroMotion);
heroAmbient.addEventListener('error', () => document.documentElement.classList.remove('hero-video-active'));
new IntersectionObserver(([entry]) => { heroInView = entry.isIntersecting; updateHeroMotion(); }).observe(document.querySelector('.hero'));
updateHeroMotion();
if (window.lucide) window.lucide.createIcons();
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Abrir menu'); document.body.classList.remove('menu-open'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; mobileNav.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); document.body.classList.toggle('menu-open', open); });
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMenu(); });

const whatsappNumber = '5511970182723';
const whatsappUrl = text => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
document.querySelectorAll('.whatsapp-link').forEach(link => {
  link.href = whatsappUrl('Olá! Gostaria de conversar com a Dínamo sobre a revisão de juros do meu contrato.');
});

const form = document.querySelector('#analysis-form');
const contract = document.querySelector('#contrato');
document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => {
    contract.value = button.dataset.service;
    document.querySelector('#analise').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});

const phone = document.querySelector('#telefone');
phone.addEventListener('input', () => {
  phone.setCustomValidity('');
  const digits = phone.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 3) phone.value = digits;
  else if (digits.length < 7) phone.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  else {
    const split = digits.length > 10 ? 7 : 6;
    phone.value = `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
  }
});
phone.addEventListener('blur', () => {
  const digits = phone.value.replace(/\D/g, '');
  phone.setCustomValidity(digits.length === 10 || digits.length === 11 ? '' : 'Informe seu telefone com DDD, com 10 ou 11 dígitos.');
});

const installment = document.querySelector('#parcela');
installment.addEventListener('input', () => {
  const digits = installment.value.replace(/\D/g, '').slice(0, 9);
  installment.value = digits ? (Number(digits) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const phoneDigits = phone.value.replace(/\D/g, '');
  phone.setCustomValidity(phoneDigits.length === 10 || phoneDigits.length === 11 ? '' : 'Informe seu telefone com DDD, com 10 ou 11 dígitos.');
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const lines = [
    'Olá! Gostaria de solicitar uma análise de contrato com a Dínamo Consultoria Financeira.',
    '',
    `Nome: ${String(data.get('nome')).trim()}`,
    `WhatsApp: ${String(data.get('telefone')).trim()}`,
    `Perfil: ${data.get('perfil')}`,
    `Tipo de contrato: ${data.get('contrato')}`,
  ];
  if (String(data.get('parcela')).trim()) lines.push(`Valor da parcela: ${String(data.get('parcela')).trim()}`);
  if (String(data.get('instituicao')).trim()) lines.push(`Banco/financeira: ${String(data.get('instituicao')).trim()}`);
  if (String(data.get('mensagem')).trim()) lines.push('', `Sobre meu caso: ${String(data.get('mensagem')).trim()}`);
  lines.push('', 'Concordo com o uso destes dados para iniciar o atendimento.');
  const url = whatsappUrl(lines.join('\n'));
  const fallback = document.querySelector('#form-fallback');
  fallback.href = url;
  fallback.hidden = false;
  window.open(url, '_blank', 'noopener,noreferrer');
  const status = document.querySelector('#form-status');
  status.hidden = false;
  status.textContent = 'Sua mensagem está pronta. Confirme o envio no WhatsApp. Se a conversa não abriu, use o link abaixo.';
});

const privacyDialog = document.querySelector('#privacy-dialog');
let privacyOpener;
document.querySelectorAll('.privacy-trigger').forEach(button => button.addEventListener('click', () => {
  privacyOpener = button;
  privacyDialog.showModal();
}));
document.querySelector('.close-dialog').addEventListener('click', () => privacyDialog.close());
privacyDialog.addEventListener('click', event => { if (event.target === privacyDialog) {
  const rect = privacyDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) privacyDialog.close();
} });
privacyDialog.addEventListener('close', () => { if (privacyOpener) privacyOpener.focus({ preventScroll: true }); });
document.querySelector('#year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .06, rootMargin: '0px 0px -15px 0px' });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  document.body.classList.add('reveal-ready');
}

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) {
      document.querySelectorAll('.desktop-nav a').forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    } });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('section[id]').forEach(section => navObserver.observe(section));
  window.addEventListener('scroll', () => {
    if (window.scrollY < document.querySelector('#servicos').offsetTop - 250) {
      document.querySelectorAll('.desktop-nav a').forEach(link => link.classList.remove('is-active'));
    }
  }, { passive: true });
}
