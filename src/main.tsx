import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  clock, freshSave, loadSave, makeCustomer, priceFor, products, recipesFor,
  saveGame, workers, type MaterialId, type ProductId, type Save, type WorkerId,
} from './game'
import './style.css'

const materialIcons: Record<MaterialId, string> = { iron: '◆', leather: '▱', herbs: '☘', wood: '▬' }
const workerIds = Object.keys(workers) as WorkerId[]
const productIds = Object.keys(products) as ProductId[]
type PlacementId = WorkerId | 'shopkeeper'
const benchNames: Record<PlacementId, string> = {
  blacksmith: 'Forge', leatherworker: 'Stitching Table', alchemist: 'Brewing Table', carpenter: 'Woodworking Bench', shopkeeper: 'Sales Counter',
}
const gridColumns = 6
const gridRows = 5
const slotPositions = Array.from({ length: gridColumns * gridRows }, (_, slot) => {
  const column = slot % gridColumns
  const row = Math.floor(slot / gridColumns)
  return [50 + (column - row) * 8.3, 25 + (column + row) * 4.9] as const
})
const help = [
  'In preparation, select a hired workbench and click a glowing floor space to place it.',
  'Only workers whose benches are placed can craft. Click a placed bench to choose its recipes.',
  'Open the shop when ready. Customers enter and walk to your counter.',
  'Choose stock, then accept, haggle, suggest an alternative, or ask the customer to wait.',
]

function App() {
  const [g, setG] = useState<Save>(loadSave)
  const [selected, setSelected] = useState<ProductId | null>(null)
  const [worker, setWorker] = useState<WorkerId | null>(null)
  const [placing, setPlacing] = useState<PlacementId | null>(null)
  const [note, setNote] = useState('Morning light fills the Wandering Anvil.')
  const [resetArmed, setResetArmed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const active = g.customers[0] || null
  const update = (fn: (s: Save) => Save) => setG(old => fn(structuredClone(old)))

  useEffect(() => saveGame(g), [g])
  useEffect(() => {
    if (g.phase !== 'open' || g.paused) return
    const timer = setInterval(() => update(tick), 1400 / g.speed)
    return () => clearInterval(timer)
  }, [g.phase, g.paused, g.speed])

  function tick(s: Save) {
    s.minutes += 15
    for (const id of s.hired) {
      if (s.placedBenches[id] === null) continue
      const ws = s.workerState[id]
      if (!ws.active && ws.queue.length) ws.active = { product: ws.queue.shift()!, progress: 0 }
      if (ws.active) {
        ws.active.progress++
        const recipe = products[ws.active.product]
        if (ws.active.progress >= recipe.ticks) {
          s.inventory[ws.active.product]++
          ws.xp++
          setNote(`${workers[id].name} finishes ${recipe.name}.`)
          delete ws.active
          if (ws.xp >= 8 && ws.level === 2) { ws.level = 3; setNote(`${workers[id].name} reached level 3 and learned an advanced recipe!`) }
          else if (ws.xp >= 3 && ws.level === 1) { ws.level = 2; setNote(`${workers[id].name} reached level 2 and learned two new recipes!`) }
        }
      }
    }
    s.customers.forEach(c => c.patience--)
    const gone = s.customers.filter(c => c.patience <= 0)
    if (gone.length) { s.reputation = Math.max(-2, s.reputation - gone.length); setNote(`${gone[0].name} leaves after waiting.`) }
    s.customers = s.customers.filter(c => c.patience > 0)
    if (s.minutes % 30 === 0 && s.customers.length < 3 && s.minutes < 18 * 60) {
      const visitor = makeCustomer(s.nextCustomer - 1, s.nextCustomer++)
      s.customers.push(visitor)
      if (s.autoPause) { s.paused = true; setNote(`${visitor.name} has a request. The shop is paused.`) }
      else setNote('A new visitor approaches the counter.')
    }
    if (s.minutes >= 18 * 60) { s.minutes = 18 * 60; s.phase = 'results'; s.paused = false; closeAccounts(s) }
    return s
  }

  function closeAccounts(s: Save) {
    const wages = s.hired.reduce((sum, id) => sum + workers[id].wage, 0)
    const capacity = 8 + s.storageLevel * 4
    let delivery = 0
    ;(Object.keys(s.materials) as MaterialId[]).forEach(m => {
      const qty = Math.max(0, capacity - s.materials[m]); s.materials[m] += qty; delivery += qty * 3
    })
    s.coins -= wages + delivery; s.expenses += wages + delivery
    setNote(`Doors closed. ${wages}g wages and ${delivery}g deliveries paid.`)
  }

  const hire = (id: WorkerId) => update(s => {
    if (s.hired.includes(id) || s.coins < 35) return s
    s.coins -= 35; s.expenses += 35; s.hired.push(id); setPlacing(id)
    setNote(`${workers[id].name} is hired. Place the ${benchNames[id]} on a glowing floor space.`)
    return s
  })
  const placeBench = (slot: number) => {
    if (!placing || g.phase !== 'prep') return
    update(s => {
      for (const id of workerIds) if (s.placedBenches[id] === slot) s.placedBenches[id] = null
      if (s.shopkeeperSlot === slot) s.shopkeeperSlot = null
      if (placing === 'shopkeeper') { s.shopkeeperSlot = slot; setNote('Sales Counter placed. The shopkeeper is ready to welcome customers.') }
      else { s.placedBenches[placing] = slot; setNote(`${benchNames[placing]} placed. Click ${workers[placing].name} to choose a recipe.`) }
      return s
    })
    setPlacing(null)
  }
  const removeBench = (id: WorkerId) => update(s => {
    if (s.phase !== 'prep') return s
    s.placedBenches[id] = null; setPlacing(id); setWorker(null)
    setNote(`${benchNames[id]} picked up. Choose a new floor space.`)
    return s
  })
  const moveCounter = () => update(s => {
    if (s.phase !== 'prep') return s
    s.shopkeeperSlot = null; setPlacing('shopkeeper'); setNote('Sales Counter picked up. Choose a new grid space.'); return s
  })
  const queue = (p: ProductId) => update(s => {
    const r = products[p], ws = s.workerState[r.worker]
    if (s.placedBenches[r.worker] === null) { setNote(`Place the ${benchNames[r.worker]} first.`); return s }
    if (s.materials[r.material] < r.cost) { setNote(`Not enough ${r.material}.`); return s }
    if (ws.queue.length >= 3) { setNote('That workbench queue is full.'); return s }
    s.materials[r.material] -= r.cost; ws.queue.push(p); setNote(`${r.name} added to the queue.`); return s
  })
  const open = () => update(s => {
    if (!workerIds.some(id => s.placedBenches[id] !== null)) { setNote('Place at least one workbench before opening.'); return s }
    if (s.shopkeeperSlot === null) { setNote('Place the Sales Counter before opening the shop.'); return s }
    const firstVisitor = makeCustomer(0, s.nextCustomer++)
    s.phase = 'open'; s.tutorial = 2; s.customers.push(firstVisitor); s.paused = s.autoPause; setPlacing(null)
    setNote(s.autoPause ? `${firstVisitor.name} has the first request. The shop is paused.` : 'The sign turns to OPEN.'); return s
  })
  const serve = (action: 'sell' | 'haggle' | 'suggest' | 'wait' | 'refuse' | 'buy') => update(s => {
    const c = s.customers[0]; if (!c) return s
    if (c.kind === 'supplier') {
      if (action === 'buy' && c.material && c.amount && c.cost) {
        if (s.coins < c.cost) { setNote('You cannot afford the bundle.'); return s }
        s.coins -= c.cost; s.expenses += c.cost; s.materials[c.material] += c.amount; setNote(`Bought ${c.amount} ${c.material}.`)
      } else setNote(`${c.name} takes the bundle elsewhere.`)
      s.customers.shift(); s.served++; return s
    }
    if (action === 'wait') { c.patience = Math.min(c.maxPatience + 2, c.patience + 3); s.customers.push(s.customers.shift()!); setNote(`${c.name} browses.`); return s }
    if (action === 'refuse') { s.customers.shift(); s.served++; setNote(`${c.name} leaves.`); return s }
    if (!selected || !s.inventory[selected]) { setNote('Choose an item in stock.'); return s }
    const r = products[selected], match = c.request === r.category, liked = c.likes.includes(r.category)
    if (action === 'suggest' && !liked) { s.reputation--; s.customers.shift(); s.served++; setNote(`${c.name} dislikes the suggestion.`); return s }
    const base = priceFor(c, selected, s.reputation), success = action !== 'haggle' || Math.random() < (match ? .82 : liked ? .56 : .18)
    if (success) { const price = action === 'haggle' ? Math.round(base * 1.18) : base; s.inventory[selected]--; s.coins += price; s.revenue += price; s.sales++; setNote(`${c.name} buys ${r.name} for ${price}g.`) }
    else { s.reputation--; setNote(`${c.name} rejects the haggle.`) }
    s.customers.shift(); s.served++; setSelected(null); return s
  })
  const nextDay = () => update(s => { s.day++; s.phase = 'prep'; s.minutes = 480; s.customers = []; s.served = 0; s.sales = 0; s.revenue = 0; s.expenses = 0; setNote(`Day ${s.day}. Arrange the shop before opening.`); return s })
  const reset = () => { if (!resetArmed) return setResetArmed(true); localStorage.removeItem('magic-and-steel-save'); setG(freshSave()); setResetArmed(false); setPlacing(null) }

  const totalStock = Object.values(g.inventory).reduce((a, b) => a + b, 0)
  const offer = active && selected && active.kind === 'buyer' ? priceFor(active, selected, g.reputation) : 0

  return <div className="game-shell">
    <header><div className="brand"><span>⚔</span><div><h1>MAGIC <i>&</i> STEEL</h1><p>The Wandering Anvil</p></div></div><div className="clock"><b>DAY {g.day} · {clock(g.minutes)}</b><small>{g.phase === 'prep' ? 'MORNING PREPARATION' : g.phase === 'open' ? (g.paused ? 'SHOP PAUSED' : `SHOP OPEN · ${g.speed}×`) : 'ACCOUNTS'}</small></div><div className="header-actions"><div className="wealth"><b>● {g.coins}g</b><small>Reputation {g.reputation >= 0 ? '+' : ''}{g.reputation}</small></div><button className="settings-toggle" onClick={() => setShowSettings(true)} aria-label="Open settings">⚙</button></div></header>
    <main><section className={`scene ${placing ? 'placement-mode' : ''}`}><div className="sign">✦ THE WANDERING ANVIL ✦</div><div className="room">
      {g.phase === 'prep' && <div className="floor-grid" aria-label="Shop floor placement grid">{slotPositions.map(([x, y], slot) => { const occupant: PlacementId | undefined = g.shopkeeperSlot === slot ? 'shopkeeper' : workerIds.find(id => g.placedBenches[id] === slot); return <button key={slot} className={`bench-slot ${occupant ? 'occupied' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => placeBench(slot)} aria-label={`Grid row ${Math.floor(slot / gridColumns) + 1}, column ${slot % gridColumns + 1}${occupant ? `, occupied by ${benchNames[occupant]}` : ''}`}><span>{occupant ? '×' : '+'}</span></button>})}</div>}
      <div className="workshops">{workerIds.map(id => {
        const slot = g.placedBenches[id]; if (slot === null) return null
        const w = workers[id], ws = g.workerState[id], job = ws.active && products[ws.active.product], [x, y] = slotPositions[slot]
        return <div className={`placed-workstation ${worker === id ? 'chosen' : ''}`} style={{ left: `${x}%`, top: `${y}%`, '--coat': w.color } as React.CSSProperties} key={id}>
          <div className="map-bench" title={benchNames[id]}><span>{w.icon}</span></div>
          <button className="map-worker" onClick={() => setWorker(id)} aria-label={`Select ${w.name} and view recipes`}><img src={`${import.meta.env.BASE_URL}assets/workers/${id}.png`} alt="" draggable="false"/><b>{w.name}</b></button>
          <div className="job-status">{job ? <><span>{job.icon}</span><small>{job.name}</small><div className="progress"><i style={{ width: `${ws.active!.progress / job.ticks * 100}%` }}/></div></> : <small>{ws.queue.length ? `${ws.queue.length} queued` : 'Ready'}</small>}</div>
        </div>
      })}</div>
      {g.shopkeeperSlot !== null && (() => { const [x, y] = slotPositions[g.shopkeeperSlot]; return <div className="shopkeeper-station" style={{ left: `${x}%`, top: `${y}%` }}><div className="shop-counter"><span>▤</span></div><img src={`${import.meta.env.BASE_URL}assets/shop/shopkeeper.png`} alt="Shopkeeper" draggable="false"/><small>SHOPKEEPER</small></div> })()}
      <div className="queue">{g.customers.slice(0, 3).map((c, i) => <button key={c.id} className={`visitor q${i}`}><span>{c.icon}</span><b>{c.name}</b><i style={{ width: `${c.patience / c.maxPatience * 100}%` }}/></button>)}</div>
    </div><div className="notice">❧ {placing ? `Placing ${benchNames[placing]} — choose a glowing floor space.` : note}</div></section>
    <aside className="ledger"><div className="ledger-head"><b>SHOP LEDGER</b><button onClick={reset}>{resetArmed ? 'CONFIRM RESET' : 'RESET SAVE'}</button></div>
      <section><h2>Common materials <small>capacity {8 + g.storageLevel * 4}</small></h2><div className="materials">{(Object.keys(g.materials) as MaterialId[]).map(m => <div key={m}><span>{materialIcons[m]}</span><b>{g.materials[m]}</b><small>{m}</small></div>)}</div></section>
      <section><h2>Shop furniture <small>{g.phase === 'prep' ? 'tap to place or move' : 'locked while open'}</small></h2><div className="bench-palette"><button className={placing === 'shopkeeper' ? 'placing' : ''} disabled={g.phase !== 'prep'} onClick={() => g.shopkeeperSlot === null ? setPlacing('shopkeeper') : moveCounter()}><span>▤</span><b>Sales Counter</b><small>{g.shopkeeperSlot === null ? 'Place in shop' : 'Placed · tap to move'}</small></button>{workerIds.map(id => { const hired = g.hired.includes(id), placed = g.placedBenches[id] !== null; return <button key={id} className={placing === id ? 'placing' : ''} disabled={g.phase !== 'prep'} onClick={() => hired ? (placed ? removeBench(id) : setPlacing(id)) : hire(id)}><span>{workers[id].icon}</span><b>{benchNames[id]}</b><small>{hired ? (placed ? 'Placed · tap to move' : 'Place in shop') : `Hire ${workers[id].name} · 35g`}</small></button> })}</div></section>
      {worker && g.placedBenches[worker] !== null && <section><h2>{workers[worker].name} recipes <small>Lv {g.workerState[worker].level} · queue {g.workerState[worker].queue.length}/3</small></h2><div className="recipes">{recipesFor(worker, g.workerState[worker].level).map(p => { const r = products[p]; return <button key={p} onClick={() => queue(p)}><span>{r.icon}</span><b>{r.name}</b><small>{r.cost} {r.material} · {r.ticks} ticks · {r.price}g value</small></button> })}{g.workerState[worker].level < 3 && <div className="locked-recipe">🔒 More recipes at level {g.workerState[worker].level + 1} · XP {g.workerState[worker].xp}/{g.workerState[worker].level === 1 ? 3 : 8}</div>}</div></section>}
      <section><h2>Stock room <small>{totalStock} items</small></h2><div className="stock">{productIds.filter(p => g.inventory[p] > 0).map(p => <button className={selected === p ? 'selected' : ''} key={p} onClick={() => setSelected(p)}><span>{products[p].icon}</span><b>{products[p].name}</b><em>x{g.inventory[p]}</em><small>{products[p].category}</small></button>)}{!totalStock && <p className="empty">Craft goods to fill your shelves.</p>}</div></section>
      {g.phase === 'prep' && <button className="primary" onClick={open}>TURN SIGN TO OPEN</button>}
      {g.phase === 'open' && <><div className="open-controls"><button onClick={() => update(s => { s.paused = !s.paused; return s })}>{g.paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button><div className="speed-controls" aria-label="Game speed"><button className={g.speed === 1 ? 'active' : ''} onClick={() => update(s => { s.speed = 1; return s })}>1×</button><button className={g.speed === 2 ? 'active' : ''} onClick={() => update(s => { s.speed = 2; return s })}>2×</button></div><span>Visitors {g.customers.length}/3</span></div>{active ? <section className="trade"><h2>{active.icon} {active.name}</h2><p>{active.kind === 'supplier' ? `A bundle of ${active.material} for ${active.cost}g.` : `“I'm looking for ${active.request}. What do you have?”`}</p>{selected && <div className="quoted">{products[selected].icon} {products[selected].name} · {offer}g</div>}<div className="trade-actions">{active.kind === 'supplier' ? <><button onClick={() => serve('buy')}>BUY</button><button onClick={() => serve('refuse')}>DECLINE</button></> : <><button disabled={!selected} onClick={() => serve('sell')}>ACCEPT OFFER</button><button disabled={!selected} onClick={() => serve('haggle')}>HAGGLE +18%</button><button disabled={!selected} onClick={() => serve('suggest')}>SUGGEST ITEM</button><button onClick={() => serve('wait')}>ASK TO WAIT</button><button onClick={() => serve('refuse')}>REFUSE</button></>}</div></section> : <p className="empty">The counter is clear.</p>}</>}
      {g.phase === 'results' && <section className="results"><h2>Day {g.day} accounts</h2><div><span>Items sold</span><b>{g.sales}</b></div><div><span>Sales</span><b>+{g.revenue}g</b></div><div><span>Expenses</span><b>-{g.expenses}g</b></div><button className="upgrade" onClick={() => update(s => { if (s.coins >= 65) { s.coins -= 65; s.storageLevel++; setNote('Stockroom expanded.') } return s })}>EXPAND STOCKROOM · 65g<small>+4 material capacity</small></button><button className="primary" onClick={nextDay}>BEGIN DAY {g.day + 1}</button></section>}
    </aside></main>
    {showSettings && <div className="settings-backdrop" onMouseDown={() => setShowSettings(false)}><section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={event => event.stopPropagation()}><button className="settings-close" onClick={() => setShowSettings(false)} aria-label="Close settings">×</button><h2 id="settings-title">SHOP SETTINGS</h2><div className="setting-row"><div><b>Automatic pause</b><small>Pause whenever a new visitor arrives with a request.</small></div><button className={`toggle ${g.autoPause ? 'on' : ''}`} role="switch" aria-checked={g.autoPause} onClick={() => update(s => { s.autoPause = !s.autoPause; return s })}><span/>{g.autoPause ? 'ON' : 'OFF'}</button></div><div className="setting-row"><div><b>Game speed</b><small>Choose the normal or accelerated shop clock.</small></div><div className="settings-speed"><button className={g.speed === 1 ? 'active' : ''} onClick={() => update(s => { s.speed = 1; return s })}>1×</button><button className={g.speed === 2 ? 'active' : ''} onClick={() => update(s => { s.speed = 2; return s })}>2×</button></div></div><p>Settings save automatically on this device.</p></section></div>}
    <footer><div><b>SHOPKEEPER'S NOTE</b><p>{help[Math.min(g.tutorial, help.length - 1)]}</p></div><span>✓ Saved on this device</span></footer>
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
