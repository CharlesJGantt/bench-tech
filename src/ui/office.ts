import { ADS, LOCATIONS, locationDef, delivery, DELIVERY, NOT_SOLD, RENT, SUPPLIES, TOOLS, type DeliveryId, type SupplyId } from '../business/economy';
import {
  adTier,
  availableDevices,
  canRushBuy,
  donors,
  harvestable,
  inTransit,
  isSpecialOrder,
  lowSupplies,
  orderCost,
  profitAndLoss,
  rushPrice,
  stockOf,
  trendMult,
  CHANNELS,
  type LedgerCat,
  type Project,
  type SaleChannel,
  type SaleRecord,
  type OrderLine,
} from '../business/shop';
import { DEVICE_LIST, DEVICES } from '../sim/devices';
import { loadJob } from '../sim/persist';
import { PARTS, part } from '../sim/parts';
import type { Session } from '../game/session';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`;

export type OfficeTab = 'overview' | 'work' | 'stock' | 'storeroom' | 'tools' | 'market' | 'ads' | 'sales';

const CAT_NAMES: Record<LedgerCat, string> = {
  repair: 'Repairs',
  sale: 'Sales',
  parts: 'Parts',
  supplies: 'Supplies',
  rent: 'Rent',
  electricity: 'Electricity',
  advertising: 'Advertising',
  purchase: 'Devices bought',
  refund: 'Refunds',
  fees: 'Selling fees',
};

/** Order basket kept between renders of the office. */
export type Cart = Record<string, number>; // "part:R-10K" / "supply:flux" -> qty

export function cartLines(cart: Cart): OrderLine[] {
  return Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([k, qty]) => {
      const [kind, id] = k.split(':');
      return { kind: kind as 'part' | 'supply', id, qty };
    });
}

export function officeHtml(s: Session, tab: OfficeTab, cart: Cart, speed: DeliveryId = 'standard'): string {
  const st = s.shop;
  const tabs: [OfficeTab, string][] = [
    ['overview', '📊 Overview'],
    ['work', `🔧 Work (${st.queue.length + st.projects.filter((p) => p.status === 'owned').length})`],
    ['stock', `📦 Supplies & parts${lowSupplies(st).length ? ' ⚠' : ''}`],
    ['storeroom', `🗄 Store-room (${donors(st).length})`],
    ['tools', '🛠 Equipment'],
    ['market', `🛒 Marketplace${Object.keys(st.trend).length ? ' 🔥' : ''}`],
    ['sales', `💲 Sales (${(st.sales ?? []).length})`],
    ['ads', '📣 Advertising & location'],
  ];
  const head = `<div class="of-head">
      <h2>🏪 Shop office <span class="muted">· Day ${st.day}</span></h2>
      <div class="of-stats"><span>💵 <b class="${st.cash < 0 ? 'bad' : ''}">${money(st.cash)}</b></span><span>⭐ ${st.reputation}</span><span>🔧 ${st.jobsDone} jobs</span></div>
      <button class="primary" data-act="end-day" title="Pay today's bills, receive deliveries, and open tomorrow">🌙 End day</button>
    </div>
    <nav class="of-tabs">${tabs.map(([id, label]) => `<button data-act="office-tab" data-tab="${id}" class="${tab === id ? 'on' : ''}">${label}</button>`).join('')}</nav>`;
  let body = '';
  switch (tab) {
    case 'overview':
      body = overview(s);
      break;
    case 'work':
      body = work(s);
      break;
    case 'stock':
      body = stock(s, cart, speed);
      break;
    case 'storeroom':
      body = storeroom(s);
      break;
    case 'tools':
      body = tools(s);
      break;
    case 'market':
      body = market(s);
      break;
    case 'ads':
      body = ads(s);
      break;
    case 'sales':
      body = salesTab(s);
      break;
  }
  return `<div class="office">${head}<div class="of-body">${body}</div></div>`;
}

function listedStatus(p: Project): string {
  const ch = p.channel ?? 'buy-now';
  if (ch === 'auction') return `auction: high bid ${money(p.highBid ?? 0)}, reserve ${money(p.reserve ?? 0)}${p.buyNow ? `, buy-it-now ${money(p.buyNow)}` : ''}, ends day ${p.endsOn}`;
  return `${ch === 'storefront' ? 'in the storefront' : 'online, buy it now'} at ${money(p.salePrice ?? 0)} since day ${p.listedOn}`;
}

/** Spreadsheet of everything sold, newest first, with channel totals. */
function salesTab(s: Session): string {
  const sales = [...(s.shop.sales ?? [])].reverse();
  if (!sales.length) return '<p class="muted">Nothing sold yet. Repair a device you bought and list it from the bench; every sale shows up here.</p>';
  const tot = (f: (r: SaleRecord) => number, rows = sales) => rows.reduce((a, r) => a + f(r), 0);
  const chans = (Object.keys(CHANNELS) as SaleChannel[]).map((c) => {
    const rows = sales.filter((r) => r.channel === c);
    if (!rows.length) return '';
    return `<tr><td>${CHANNELS[c].name}</td><td class="num">${rows.length}</td><td class="num">${money(tot((r) => r.price, rows))}</td><td class="num">${(tot((r) => r.days, rows) / rows.length).toFixed(1)} d</td><td class="num">${money(tot((r) => r.profit, rows))}</td></tr>`;
  }).join('');
  const last = Math.max(...sales.map((r) => r.day));
  const days = Array.from({ length: 14 }, (_, i) => last - 13 + i).filter((d) => d >= 1);
  const byDay = new Map<number, number>();
  for (const r of sales) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.profit);
  const peak = Math.max(1, ...days.map((d) => Math.abs(byDay.get(d) ?? 0)));
  const bars = days.map((d) => { const v = byDay.get(d) ?? 0; return `<span class="bar ${v < 0 ? 'neg' : ''}" style="height:${Math.round((Math.abs(v) / peak) * 46) + 2}px" title="Day ${d}: ${money(v)}"></span>`; }).join('');
  return `<div class="cards"><div class="card"><b>${sales.length}</b><span>sold</span></div><div class="card"><b>${money(tot((r) => r.price))}</b><span>takings</span></div><div class="card"><b>${money(tot((r) => r.fee))}</b><span>fees</span></div><div class="card"><b class="${tot((r) => r.profit) < 0 ? 'bad' : 'good'}">${money(tot((r) => r.profit))}</b><span>profit</span></div></div>
    <h3>By channel</h3><table class="tbl"><tr><th>Channel</th><th>Sold</th><th>Takings</th><th>Avg. time</th><th>Profit</th></tr>${chans}</table>
    <h3>Profit, last 14 days</h3><div class="bars">${bars}</div>
    <h3>Every sale</h3><table class="tbl sales"><tr><th>Day</th><th>Item</th><th>Channel</th><th>Listed</th><th>Days</th><th>Price</th><th>Fee</th><th>Cost</th><th>Profit</th></tr>
    ${sales.map((r) => `<tr><td class="num">${r.day}</td><td>${esc(r.title)}</td><td>${CHANNELS[r.channel].name}</td><td class="num">${r.listedOn}</td><td class="num">${r.days}</td><td class="num">${money(r.price)}</td><td class="num">${money(r.fee)}</td><td class="num">${money(r.cost)}</td><td class="num ${r.profit < 0 ? 'bad' : 'good'}">${money(r.profit)}</td></tr>`).join('')}</table>`;
}

function pnlTable(s: Session, from: number, to: number, title: string): string {
  const p = profitAndLoss(s.shop, from, to);
  const rows = (Object.keys(CAT_NAMES) as LedgerCat[])
    .filter((c) => p.byCat[c])
    .map((c) => `<tr><td>${CAT_NAMES[c]}</td><td class="num ${p.byCat[c]! < 0 ? 'bad' : 'good'}">${money(p.byCat[c]!)}</td></tr>`)
    .join('');
  return `<div class="of-card"><h3>${title}</h3><table class="bom">${rows || '<tr><td class="muted">Nothing yet</td><td></td></tr>'}
    <tr class="total"><td><b>Profit / loss</b></td><td class="num ${p.net < 0 ? 'bad' : 'good'}"><b>${money(p.net)}</b></td></tr></table></div>`;
}

function overview(s: Session): string {
  const st = s.shop;
  const alerts: string[] = [];
  for (const id of lowSupplies(st)) alerts.push(`⚠ Running low on ${SUPPLIES[id].name.toLowerCase()} (${st.supplies[id]} ${SUPPLIES[id].unit} left).`);
  if (st.cash < 0) alerts.push('⚠ You are overdrawn — bills keep coming. Take on jobs or sell a project.');
  const rentIn = RENT.everyDays - ((st.day - 1) % RENT.everyDays) - 1;
  alerts.push(rentIn === 0 ? `🏠 Rent ($${RENT.amount}) is due tonight.` : `🏠 Rent ($${RENT.amount}) due in ${rentIn} day${rentIn === 1 ? '' : 's'}.`);
  for (const [id, t] of Object.entries(st.trend)) alerts.push(`🔥 ${esc(t.label)}: working ${esc(DEVICES[id]?.name ?? id)} units sell for ×${t.mult.toFixed(2)} until day ${t.until}.`);
  for (const o of st.orders) alerts.push(`🚚 Order #${o.id} arrives ${o.arrives - st.day <= 1 ? 'tomorrow morning' : `on day ${o.arrives}`}.`);
  for (const p of st.projects.filter((x) => x.status === 'listed')) alerts.push(`🏷 ${esc(p.title)}: ${listedStatus(p)}`);
  const weekFrom = Math.max(1, st.day - 6);
  const recent = st.ledger
    .slice(-12)
    .reverse()
    .map((e) => `<tr><td class="muted">Day ${e.day}</td><td>${esc(e.text)}</td><td class="num ${e.amount < 0 ? 'bad' : 'good'}">${money(e.amount)}</td></tr>`)
    .join('');
  return `<div class="of-grid">
    <div class="of-card"><h3>Today</h3><ul class="checks">${alerts.map((a) => `<li>${a}</li>`).join('')}</ul>
      <p class="muted small">Electricity so far today: ${Math.round(st.usage.heatSeconds / 60)} min of soldering heat, ${Math.round(st.usage.powerSeconds / 60)} min of powered testing. Advertising: ${esc(adTier(st).name)}.</p></div>
    ${pnlTable(s, st.day, st.day, `Today (day ${st.day})`)}
    ${pnlTable(s, weekFrom, st.day, `Last 7 days`)}
    </div>
    <div class="of-card"><h3>Ledger</h3><table class="bom">${recent || '<tr><td class="muted">No transactions yet.</td></tr>'}</table></div>
    <div class="of-card"><h3>Career</h3><p>Day ${st.day} · reputation ${st.reputation} · ${st.jobsDone} job${st.jobsDone === 1 ? '' : 's'} done · ${st.comebacks} comeback${st.comebacks === 1 ? '' : 's'}</p>
      <p class="muted small">Start over on day 1 with a fresh shop, starting cash and a starter pack of parts (one or two of the chips you would normally have to order). This wipes the current save.</p>
      <div class="row"><button data-act="new-game">⟲ Start a new career</button></div></div>`;
}

function work(s: Session): string {
  const st = s.shop;
  const a = st.active;
  const bench = a
    ? `<div class="of-card hl"><h3>On the bench</h3><p>${esc(s.describeJob())}</p><div class="row"><button class="primary" data-act="close">Back to the bench</button></div></div>`
    : `<div class="of-card"><h3>On the bench</h3><p class="muted">Nothing. Pick a job below.</p></div>`;
  const q = st.queue
    .map((j) => {
      const waited = st.day - j.arrived;
      const isActive = a && a.kind !== 'project' && a.id === j.id;
      const dev = j.job.title ? `${j.job.title} (${DEVICES[j.job.deviceId]?.name ?? ''})` : (DEVICES[j.job.deviceId]?.name ?? '');
      return `<tr><td><b>${esc(j.customer)}</b> <span class="muted small">· ${esc(dev)}</span>${j.kind === 'warranty' ? ' <span class="pill warn">warranty</span>' : ''}<div class="muted small">“${esc(j.complaint)}”</div></td>
        <td class="num">${j.kind === 'warranty' ? 'free' : money(j.quote)}</td>
        <td class="muted small">${
          j.hold
            ? `⏳ ${esc(j.hold.note)} · will wait until day ${j.hold.until}${j.hold.until <= st.day ? ' <span class="bad">— collects it tonight!</span>' : ''}`
            : `${waited === 0 ? 'today' : `waiting ${waited} day${waited === 1 ? '' : 's'}`}${waited >= 3 && j.kind === 'customer' ? ' <span class="bad">— leaves tonight!</span>' : ''}`
        }${j.extraFee ? ` · +$${j.extraFee} next-day fee agreed` : ''}</td>
        <td>${isActive ? '<span class="pill">on bench</span>' : `<button data-act="start-work" data-kind="${j.kind}" data-id="${j.id}"${j.tutorial ? ' data-tutorial="1"' : ''}>Start</button>`}</td></tr>`;
    })
    .join('');
  const done = (st.returned ?? [])
    .map((r) => {
      const status =
        r.outcome === 'fixed'
          ? `<span class="good">✓ Completed${r.paid ? ` — paid ${money(r.paid)}` : ''}</span>`
          : r.outcome === 'gave-up'
            ? '<span class="muted">Handed back unrepaired</span>'
            : '<span class="bad">Returned — it did not pass</span>';
      return `<tr><td><b>${esc(r.customer)}</b> <span class="muted small">· ${esc(r.device)}</span>${r.kind === 'warranty' ? ' <span class="pill warn">warranty</span>' : ''}</td><td class="num">${r.kind === 'warranty' ? 'free' : money(r.quote)}</td><td class="small">${status}</td><td><span class="pill">${r.outcome === 'fixed' ? 'completed' : 'returned'}</span></td></tr>`;
    })
    .join('');
  const proj = st.projects
    .filter((p) => p.status !== 'donor' && (p.status !== 'sold' || st.day - (p.sellsOn ?? 0) < 7))
    .map((p) => {
      const isActive = a?.kind === 'project' && a.id === p.id;
      let status = '';
      let action = '';
      if (inTransit(st, p)) {
        status = `🚚 in the post — arrives day ${p.arrives}`;
      } else if (p.status === 'owned') {
        status = 'needs repair';
        action = isActive
          ? '<span class="pill">on bench</span>'
          : `<button data-act="start-work" data-kind="project" data-id="${p.id}">Work on it</button> <button data-act="store-project" data-id="${p.id}" title="Give up on it and keep it as a parts donor">To store-room</button>`;
      } else if (p.status === 'listed') status = listedStatus(p);
      else if (p.status === 'sold') status = `<span class="good">sold for ${money(p.salePrice ?? 0)} (profit ${money((p.salePrice ?? 0) - p.paid)})</span>`;
      else status = '<span class="muted">scrapped for parts</span>';
      return `<tr><td><b>${esc(p.title)}</b></td><td class="num">paid ${money(p.paid)}</td><td class="small">${status}</td><td>${action}</td></tr>`;
    })
    .join('');
  return `${bench}
    <div class="of-card"><h3>Customers waiting</h3><table class="bom">${q || '<tr><td class="muted">No customers waiting. Advertising brings more in.</td></tr>'}${done}</table></div>
    <div class="of-card"><h3>Your projects</h3><table class="bom">${proj || '<tr><td class="muted">None. Buy broken devices in the Marketplace to fix and sell.</td></tr>'}</table></div>`;
}

function stock(s: Session, cart: Cart, speed: DeliveryId): string {
  const st = s.shop;
  const qtyCtl = (key: string) =>
    `<span class="qty"><button data-act="cart" data-key="${key}" data-d="-1">−</button><b>${cart[key] ?? 0}</b><button data-act="cart" data-key="${key}" data-d="1">+</button></span>`;
  const supplies = (Object.keys(SUPPLIES) as SupplyId[])
    .map((id) => {
      const d = SUPPLIES[id];
      const lvl = st.supplies[id];
      const pct = Math.min(100, (lvl / (d.pack.qty * 1.5)) * 100);
      return `<tr><td><b>${esc(d.name)}</b><div class="muted small">${esc(d.blurb)}</div><div class="lvl"><i class="${lvl <= d.low ? 'low' : ''}" style="width:${pct}%"></i></div></td>
        <td class="num ${lvl <= d.low ? 'bad' : ''}">${lvl} ${d.unit}</td><td class="small muted">${esc(d.pack.label)} · ${money(d.pack.cost)}</td><td>${qtyCtl(`supply:${id}`)}</td></tr>`;
    })
    .join('');
  const parts = Object.values(PARTS)
    .filter((p) => p.kind !== 'testpoint')
    .map((p) => {
      const sl = stockOf(st, p.partNo);
      const notSold = NOT_SOLD.has(p.partNo);
      const special = isSpecialOrder(p.partNo);
      const price = notSold
        ? 'not sold — salvage only'
        : special
          ? `${money(p.cost)} ea · <span class="warn">special order</span>`
          : `${money(p.cost)} ea${canRushBuy(p.partNo) ? ` · rush ${money(rushPrice(p.partNo))}` : ''}`;
      return `<tr><td><b>${esc(p.label)}</b> <span class="muted small">${p.pkg}${p.marking ? ` · "${esc(p.marking)}"` : ''}</span></td>
        <td class="num ${sl.new + sl.used === 0 ? 'bad' : ''}">${sl.new}${sl.used ? ` <span class="muted">+${sl.used} used</span>` : ''}</td>
        <td class="small muted">${price}</td>
        <td>${notSold ? '' : qtyCtl(`part:${p.partNo}`)}</td></tr>`;
    })
    .join('');
  const lines = cartLines(cart);
  const total = orderCost(lines, speed);
  const ship = delivery(speed);
  const speeds = DELIVERY.map(
    (d) => `<button data-act="set-speed" data-id="${d.id}" class="${d.id === speed ? 'on' : ''}" title="${esc(d.blurb)}">${esc(d.name)} · ${money(d.cost)} · ${d.days === 1 ? 'tomorrow' : `${d.days} days`}</button>`,
  ).join('');
  return `<div class="of-grid two">
    <div class="of-card"><h3>Consumables</h3><table class="bom">${supplies}</table>
      <p class="muted small">Your solder, flux, wick and IPA get used up in the microscope. Run out and that tool stops working.</p></div>
    <div class="of-card"><h3>Order basket</h3>
      ${
        lines.length
          ? `<table class="bom">${lines
              .map((l) => `<tr><td>${l.qty}× ${esc(l.kind === 'part' ? part(l.id).label : SUPPLIES[l.id as SupplyId].pack.label + ' ' + SUPPLIES[l.id as SupplyId].name.toLowerCase())}</td></tr>`)
              .join('')}<tr><td class="muted">${esc(ship.name)} shipping ${money(ship.cost)}</td></tr><tr class="total"><td><b>Total ${money(total)}</b></td></tr></table>
             <div class="speed-pick">${speeds}</div>
             <div class="row"><button class="primary" data-act="place-order">Place order — arrives ${ship.days === 1 ? 'tomorrow' : `day ${s.shop.day + ship.days}`}</button><button data-act="clear-cart">Clear</button></div>`
          : '<p class="muted">Empty. Use + to add packs or parts. One shipping fee per order; pick a delivery speed before ordering.</p>'
      }
      <p class="muted small">Need something right now? The rework station's parts tray can rush-buy a single cheap part locally at a markup. Expensive chips, screens and batteries are <b>special order</b> — nobody local stocks them, so order ahead or pull one from a donor in the store-room.</p></div>
    </div>
    <div class="of-card"><h3>Components in stock</h3><table class="bom parts">${parts}</table></div>`;
}

function tools(s: Session): string {
  const st = s.shop;
  const card = (t: (typeof TOOLS)[number]) => {
    const owned = st.tools.includes(t.id);
    return `<div class="of-card ${owned ? 'hl' : ''}"><h3>${esc(t.name)}</h3><div class="price">${t.cost ? money(t.cost) : 'Stock'}</div>
      <p>${esc(t.blurb)}</p>${t.kind === 'instrument' || t.kind === 'microscope' || t.kind === 'testconsole' || t.kind === 'cleaning' ? '' : `<p class="muted small">Heat transfer ×${t.heat.toFixed(2)} · ${t.kind === 'tip' ? 'contact' : 'airflow'} ${t.radius} mm</p>`}
      ${owned ? '<span class="pill">owned</span>' : `<button class="primary" data-act="buy-tool" data-id="${t.id}" ${st.cash < t.cost ? 'disabled title="Not enough cash"' : ''}>Buy ${money(t.cost)}</button>`}</div>`;
  };
  return `<p>Better tools give you capabilities, not stat boosts: a bigger tip melts ground pads quickly, a focused nozzle spares the neighbours. Pick what to use in the microscope's kit selectors.</p>
    <h3>Cleaning tools</h3><div class="of-grid">${TOOLS.filter((t) => t.kind === 'cleaning').map(card).join('')}</div>
    <h3>Diagnostic instruments</h3><div class="of-grid">${TOOLS.filter((t) => t.kind === 'instrument').map(card).join('')}</div>
    <h3>Test consoles (for the 📺 Test Station)</h3><p class="muted small">Without one, cartridges go home untested: the customer pays, and if it does not boot they come back for 10% and a re-fix.</p><div class="of-grid">${TOOLS.filter((t) => t.kind === 'testconsole').map(card).join('')}</div>
    <h3>Microscope upgrades</h3><div class="of-grid">${TOOLS.filter((t) => t.kind === 'microscope').map(card).join('')}</div>
    <h3>Soldering iron tips</h3><div class="of-grid">${TOOLS.filter((t) => t.kind === 'tip').map(card).join('')}</div>
    <h3>Hot-air nozzles</h3><div class="of-grid">${TOOLS.filter((t) => t.kind === 'nozzle').map(card).join('')}</div>
    <p class="muted">Flux grades, wick widths, low-melt alloy, brushes and wipes are consumables — order them on the Supplies &amp; parts tab.</p>`;
}

function market(s: Session): string {
  const st = s.shop;
  const cards = st.market
    .map((l) => {
      const left = l.expires - st.day;
      const dev = DEVICES[l.device];
      const hot = trendMult(st, l.device) > 1;
      const worth = dev ? dev.marketValue * trendMult(st, l.device) : 0;
      return `<div class="of-card listing ${l.partsOnly ? 'donor' : ''}"><h3>${esc(l.title)}</h3><div class="price">${money(l.price)}</div>
        <div>${l.partsOnly ? '<span class="pill warn">parts only</span> ' : ''}${hot ? '<span class="pill hot">🔥 in demand</span>' : ''}</div>
        <p>${esc(l.desc)}</p>
        <p class="muted small">${l.ships ? `🚚 Ships in ${l.ships} day${l.ships === 1 ? '' : 's'}. ` : '📍 Local pick-up today. '}${l.partsOnly ? 'Goes to your store-room as a donor board.' : `Working, clean units sell for about <b>${money(worth)}</b>.`} Listing ends ${left <= 0 ? 'today' : `in ${left} day${left === 1 ? '' : 's'}`}.</p>
        <button class="primary" data-act="buy-listing" data-id="${l.id}" ${st.cash < l.price ? 'disabled title="Not enough cash"' : ''}>Buy for ${money(l.price)}</button></div>`;
    })
    .join('');
  const values = availableDevices(st)
    .map((d) => {
      const m = trendMult(st, d.id);
      return `<li>${esc(d.name)}: <b>${money(d.marketValue * m)}</b>${m > 1 ? ` <span class="pill hot">🔥 ${esc(st.trend[d.id].label)} ×${m.toFixed(2)} until day ${st.trend[d.id].until}</span>` : ''}</li>`;
    })
    .join('');
  const searchOpts = DEVICE_LIST.map((d) => `<option value="${d.id}" ${st.searched[d.id] === st.day ? 'disabled' : ''}>${esc(d.name)}${st.searched[d.id] === st.day ? ' (searched today)' : ''}</option>`).join('');
  return `<div class="of-card"><h3>🔎 Search online for a donor</h3><p class="muted small">Need one particular chip or module? Search online sellers for that exact device. They post it to you (1–4 days); one search per device per day.</p>
      <div class="row"><select id="search-dev">${searchOpts}</select><button class="primary" data-act="search-online">Search</button></div></div>
    <p>Broken devices for sale. Fix them and sell them on when they work and look clean. Going rate for a working unit:</p><ul class="checks">${values}</ul>
    <p class="muted">Sellers are not always honest: some have been "repaired" before, some are missing parts, and once in a while a board is beyond saving — keep it in the store-room and pull parts off it. <b>Parts-only</b> listings are cheap donors for stocking up on expensive chips. A donor board is the only source of a factory-programmed microcontroller. Better devices show up as your reputation grows.</p>
    <div class="of-grid">${cards || '<p class="muted">Nothing listed today. Check back tomorrow.</p>'}</div>`;
}

function ads(s: Session): string {
  const st = s.shop;
  const here = locationDef(st.location);
  const places = `<h3>Where the shop is</h3><div class="of-grid">${LOCATIONS.map((l) => {
    const cur = l.id === here.id;
    const idx = LOCATIONS.indexOf(l) - LOCATIONS.indexOf(here);
    return `<div class="of-card ad ${cur ? 'hl' : ''}"><h3>${esc(l.name)}</h3><div class="price">${money(l.rent)}/week</div><p>${esc(l.blurb)}</p>
      <p class="muted small">${l.traffic ? `Walk-in traffic ×${l.traffic}` : 'No walk-ins'} · +${l.extraCustomers} customers a day${idx > 0 ? ` · fit-out ${money(l.fitOut)}, reputation ${l.reputation}` : ''}</p>
      ${cur ? '<span class="pill">current</span>' : `<button data-act="move-shop" data-id="${l.id}">${idx > 0 ? 'Move in' : 'Move back'}</button>`}</div>`;
  }).join('')}</div><h3>Advertising</h3>`;
  return `${places}<p>Advertising brings more customers each day, and people who find you through ads accept slightly higher quotes. It is billed every night.</p>
    <div class="of-grid">${ADS.map(
      (a) => `<div class="of-card ad ${st.ads === a.id ? 'hl' : ''}"><h3>${esc(a.name)}</h3><div class="price">${a.perDay ? `${money(a.perDay)}/day` : 'Free'}</div>
      <p>${esc(a.blurb)}</p><p class="muted small">${a.customers[0]}–${a.customers[1]} new customers a day · quotes ×${a.quoteMult.toFixed(2)}</p>
      ${st.ads === a.id ? '<span class="pill">current</span>' : `<button data-act="set-ads" data-id="${a.id}">Choose</button>`}</div>`,
    ).join('')}</div>`;
}

function storeroom(s: Session): string {
  const st = s.shop;
  const boards = donors(st)
    .map((p) => {
      if (inTransit(st, p))
        return `<div class="of-card"><h3>${esc(p.title)}</h3><p class="muted">🚚 In the post — arrives on day ${p.arrives}.</p></div>`;
      const job = loadJob(p.job);
      const rows = harvestable(job)
        .map((h) => {
          const sl = stockOf(st, h.partNo);
          return `<tr><td><b>${esc(h.ref)}</b> ${esc(h.label)}</td><td class="num muted small">new ${money(h.cost)}</td><td class="num small">${sl.new} new · ${sl.used} used</td>
            <td><button data-act="harvest" data-id="${p.id}" data-ref="${esc(h.ref)}">Pull</button></td></tr>`;
        })
        .join('');
      return `<div class="of-card"><h3>${esc(p.title)}</h3><p class="muted small">Paid ${money(p.paid)}. Parts you pull get tested: good ones go in the used bin, dead ones are thrown away.</p>
        <details open><summary>${harvestable(job).length} parts left on the board</summary><table class="bom">${rows || '<tr><td class="muted">Stripped bare.</td></tr>'}</table></details></div>`;
    })
    .join('');
  return `<p>Donor boards: failed repairs and parts-only buys. Pull the expensive parts (retimers, APUs, screens, programmed chips) when a job needs them instead of waiting on a delivery. Used parts work in any device that uses the same part number.</p>
    <div class="of-grid two">${boards || '<p class="muted">The shelf is empty. Buy a parts-only listing in the Marketplace, or move a project you have given up on here from the Work tab.</p>'}</div>`;
}
