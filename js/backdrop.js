// The soft drawings around the edges of every screen (a little "day": morning at the top, flowers at the sides, evening below).
// They sit behind the content and never block a tap. The gingham itself is plain CSS (see css/base.css).
const A = (style, body, vb) => `<svg viewBox="${vb}" style="${style}" aria-hidden="true">${body}</svg>`;
const forget = '<circle cx="0" cy="-6" r="5"/><circle cx="5.7" cy="-1.9" r="5"/><circle cx="3.5" cy="4.9" r="5"/><circle cx="-3.5" cy="4.9" r="5"/><circle cx="-5.7" cy="-1.9" r="5"/>';

export const BACKDROP_HTML = [
  // morning, top
  A('left:10px;top:14px;width:30px', '<path d="M32 32a2.5 2.5 0 1 1 5 0a7 7 0 1 1-14 0a11.5 11.5 0 1 1 23 0a16 16 0 1 1-32 0a20.5 20.5 0 1 1 41 0" fill="none" stroke="#E8A49A" stroke-width="3" stroke-linecap="round"/>', '0 0 64 64'),
  A('left:48px;top:30px;width:14px;transform:rotate(12deg)', '<path d="M32 6l6.6 16.6L56 24l-13.6 11L47 52 32 42.6 17 52l4.6-17L8 24l17.4-1.4z" fill="#F6E3A1" stroke="#E0AE2C" stroke-width="3.5" stroke-linejoin="round"/>', '0 0 64 64'),
  A('right:12px;top:10px;width:46px', '<g fill="none" stroke="#E7B93E" stroke-width="2.4" stroke-linecap="round"><circle cx="24" cy="24" r="9" fill="#F6E3A1"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/></g>', '0 0 48 48'),
  A('right:54px;top:34px;width:54px', '<path d="M16 36h30a10 10 0 0 0 0-20 14 14 0 0 0-26-4A12 12 0 0 0 16 36z" fill="#E3EEF8" stroke="#A9C6E2" stroke-width="1.6"/>', '0 0 60 40'),
  A('right:122px;top:16px;width:13px', '<path d="M20 0C21 12 28 19 40 20 28 21 21 28 20 40 19 28 12 21 0 20 12 19 19 12 20 0z" fill="#F2C94C"/>', '0 0 40 40'),
  // afternoon, sides (their height follows the screen: see --ft in css/base.css)
  `<svg class="bd-tulip" viewBox="0 0 90 130" aria-hidden="true"><path d="M40 130C40 104 42 80 40 56M52 130c2-24 10-44 22-60" stroke="#7E9A5E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M40 108c-14-2-22-14-22-30 12 6 20 16 22 30zM56 116c10-6 20-14 22-28-12 4-20 14-22 28z" fill="#9DB57F"/><path d="M27 32c0-10 6-18 13-22 7 4 13 12 13 22 0 14-6 24-13 24S27 46 27 32z" fill="#F3B9B0" stroke="#E0A196" stroke-width="1.5"/><path d="M33 20c3 6 4 14 7 22M47 20c-3 6-4 14-7 22" fill="none" stroke="#E0A196" stroke-width="1.5" stroke-linecap="round"/><path d="M64 50c0-8 5-15 10-18 5 3 10 10 10 18 0 11-5 19-10 19s-10-8-10-19z" fill="#F6E3A1" stroke="#E0B94C" stroke-width="1.5"/></svg>`,
  `<svg class="bd-forget" viewBox="0 0 70 130" aria-hidden="true"><path d="M20 128C24 96 30 70 44 40M30 80c8-10 18-14 28-14" stroke="#7E9A5E" stroke-width="2.4" fill="none" stroke-linecap="round"/><g fill="#BFD7EC" stroke="#8FB3D6" stroke-width="1"><g transform="translate(44 34)">${forget}</g><g transform="translate(58 62) scale(.8)">${forget}</g><g transform="translate(30 56) scale(.7)">${forget}</g></g><circle cx="44" cy="34" r="2.2" fill="#F2C94C"/><circle cx="58" cy="62" r="1.8" fill="#F2C94C"/><circle cx="30" cy="56" r="1.6" fill="#F2C94C"/></svg>`,
  // evening, lower
  A('right:24px;bottom:386px;width:24px;transform:rotate(-18deg)', '<path d="M40 10a30 30 0 1 0 22 50A26 26 0 1 1 40 10z" fill="#F6E3A1" stroke="#E0B94C" stroke-width="4"/>', '0 0 80 80').replace('<svg ', '<svg class="bd-lower" '),
  A('right:56px;bottom:360px;width:11px', '<path d="M20 0C21 12 28 19 40 20 28 21 21 28 20 40 19 28 12 21 0 20 12 19 19 12 20 0z" fill="#E7B93E"/>', '0 0 40 40').replace('<svg ', '<svg class="bd-lower" '),
  A('left:50px;bottom:300px;width:40px', '<path d="M16 36h30a10 10 0 0 0 0-20 14 14 0 0 0-26-4A12 12 0 0 0 16 36z" fill="#F3E6E3" stroke="#E2B8B0" stroke-width="1.8"/>', '0 0 60 40').replace('<svg ', '<svg class="bd-lower" '),
  A('right:100px;bottom:246px;width:22px', '<path d="M32 32a2.5 2.5 0 1 1 5 0a7 7 0 1 1-14 0a11.5 11.5 0 1 1 23 0a16 16 0 1 1-32 0" fill="none" stroke="#8FB3D6" stroke-width="3.4" stroke-linecap="round"/>', '0 0 64 64').replace('<svg ', '<svg class="bd-lower" '),
  A('left:-10px;bottom:128px;width:80px;transform:rotate(-8deg)', '<path d="M30 120C30 96 32 76 30 54M50 120c0-28 2-50 0-70M70 120c0-22 4-40 10-52" stroke="#7E9A5E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M30 100c-14-2-22-12-22-26 12 6 20 14 22 26zM70 104c10-6 18-14 20-26-12 4-18 14-20 26z" fill="#9DB57F"/><path d="M18 34c0-9 5-16 12-20 7 4 12 11 12 20 0 12-5 20-12 20S18 46 18 34z" fill="#F6E3A1" stroke="#E0B94C" stroke-width="1.5"/><path d="M38 30c0-10 6-18 12-22 6 4 12 12 12 22 0 13-6 22-12 22S38 43 38 30z" fill="#F3B9B0" stroke="#E0A196" stroke-width="1.5"/><path d="M44 18c2 6 3 13 6 20M56 18c-2 6-3 13-6 20" fill="none" stroke="#E0A196" stroke-width="1.4" stroke-linecap="round"/><path d="M70 52c0-8 5-15 10-18 5 3 10 10 10 18 0 11-5 18-10 18s-10-7-10-18z" fill="#DCE8F3" stroke="#A9C6E2" stroke-width="1.5"/>', '0 0 100 120').replace('<svg ', '<svg class="bd-lower" '),
].join('');

export function mountBackdrop() {
  const app = document.getElementById('app');
  if (!app || document.getElementById('backdrop')) return;
  const el = document.createElement('div'); el.id = 'backdrop'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = BACKDROP_HTML;
  app.prepend(el);
}
