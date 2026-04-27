'use strict';

const CARS = [
  {
    id: 'model-y',
    badge: '⭐ Best Seller',
    name: 'Model Y',
    sub: 'Dual Motor All-Wheel Drive',
    desc: "The world's best-selling EV. A versatile SUV with room for 7, panoramic glass roof, and instant AWD performance.",
    // Primary: real Tesla press image. Fallback: Unsplash photo
    img: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-Y.png',
    imgFallback: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80',
    specs: [{ val: '533 km', key: 'Range' }, { val: '3.7 s', key: '0–100' }, { val: '250 km/h', key: 'Top Speed' }, { val: '7', key: 'Seats' }],
    price: 'From $43,990',
    viewer: 'viewer.html?car=modely'
  },
  {
    id: 'model-3',
    badge: 'Most Popular',
    name: 'Model 3',
    sub: 'Long Range All-Wheel Drive',
    desc: 'The most affordable EV. Sleek minimalist sedan with class-leading range and a 15.4" touchscreen.',
    img: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-3.png',
    imgFallback: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    specs: [{ val: '602 km', key: 'Range' }, { val: '4.4 s', key: '0–100' }, { val: '225 km/h', key: 'Top Speed' }, { val: '5', key: 'Seats' }],
    price: 'From $32,740',
    viewer: 'viewer.html?car=model3'
  },
  {
    id: 'model-s',
    badge: 'Flagship Sedan',
    name: 'Model S',
    sub: 'Plaid — Tri Motor AWD',
    desc: 'Pinnacle of EV engineering. 17" cinematic display, yoke steering, and record-breaking Plaid performance.',
    img: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-S.png',
    imgFallback: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&q=80',
    specs: [{ val: '637 km', key: 'Range' }, { val: '2.1 s', key: '0–100' }, { val: '322 km/h', key: 'Top Speed' }, { val: '5', key: 'Seats' }],
    price: 'From $74,990',
    viewer: 'viewer.html?car=models'
  },
  {
    id: 'model-x',
    badge: 'Family SUV',
    name: 'Model X',
    sub: 'Plaid — Tri Motor AWD',
    desc: 'Ultimate family SUV. Iconic Falcon Wing doors, seating for 7, and the largest windshield of any production car.',
    img: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-X.png',
    imgFallback: 'https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800&q=80',
    specs: [{ val: '547 km', key: 'Range' }, { val: '2.6 s', key: '0–100' }, { val: '262 km/h', key: 'Top Speed' }, { val: '7', key: 'Seats' }],
    price: 'From $79,990',
    viewer: 'viewer.html?car=modelx'
  },
  {
    id: 'cybertruck',
    badge: '🆕 New',
    name: 'Cybertruck',
    sub: 'All-Wheel Drive · Stainless Steel',
    desc: 'Ultra-hard stainless steel exoskeleton. Adaptive air suspension, 11,000 lb tow capacity, and 547 km of range.',
    img: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Cybertruck.png',
    imgFallback: 'https://images.unsplash.com/photo-1695653422543-7da6d6744364?w=800&q=80',
    specs: [{ val: '547 km', key: 'Range' }, { val: '4.1 s', key: '0–100' }, { val: '209 km/h', key: 'Top Speed' }, { val: '5', key: 'Seats' }],
    price: 'From $60,990',
    viewer: 'viewer.html?car=cybertruck'
  },
  {
    id: 'roadster',
    badge: 'Coming Soon',
    name: 'Roadster',
    sub: 'Next-Gen Sports Car',
    desc: 'The quickest car ever made. Sub-2-second 0–100, over 1,000 km of range, and a removable glass roof.',
    img: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Roadster.png',
    imgFallback: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    specs: [{ val: '1000 km', key: 'Range' }, { val: '1.9 s', key: '0–100' }, { val: '400+', key: 'Top Speed' }, { val: '2+2', key: 'Seats' }],
    price: 'From $200,000',
    viewer: 'viewer.html?car=roadster'
  }
];

function renderGrid() {
  const grid = document.getElementById('vehiclesGrid');
  grid.innerHTML = CARS.map(car => `
    <div class="vehicle-card" data-id="${car.id}" style="opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s cubic-bezier(.16,1,.3,1)">
      <img src="${car.imgFallback}" alt="${car.name}" loading="lazy"
           onerror="this.src='${car.imgFallback}'"
           style="opacity:0;transition:opacity .5s ease"
           onload="this.style.opacity='1'"/>
      <div class="card-body">
        <p class="card-badge">${car.badge}</p>
        <h3 class="card-name">${car.name}</h3>
        <p class="card-sub">${car.sub}</p>
        <p class="card-desc">${car.desc}</p>
        <div class="card-specs">
          ${car.specs.map(s => `<div class="card-spec"><span class="card-spec-val">${s.val}</span><span class="card-spec-key">${s.key}</span></div>`).join('')}
        </div>
        <p class="card-price">${car.price}</p>
        <div class="card-actions">
          <a href="${car.viewer}" class="btn-view3d">View in 3D</a>
          <a href="#" class="btn-learn">Order</a>
        </div>
      </div>
    </div>
  `).join('');
}

function initReveal() {
  const cards = [...document.querySelectorAll('.vehicle-card')];
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const i = cards.indexOf(e.target);
      setTimeout(() => {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }, i * 90);
      io.unobserve(e.target);
    });
  }, { threshold: 0.06 });
  cards.forEach(c => io.observe(c));
}

renderGrid();
initReveal();
