import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  clock, craftableProducts, freshSave, loadSave, makeCustomer, priceFor, products, recipesFor,
  saveGame, workers, type DisplayId, type MaterialId, type ProductId, type Save, type WorkerId,
} from './game'
import './style.css'

const materialIcons: Record<MaterialId, string> = { iron: '◆', leather: '▱', herbs: '☘', wood: '▬' }
const workerIds = Object.keys(workers) as WorkerId[]
const productIds = Object.keys(products) as ProductId[]
type PlacementId = WorkerId | DisplayId | 'shopkeeper'
const displayIds: DisplayId[] = ['shelf', 'weaponRack', 'armourStand', 'potionDisplay']
const displayInfo: Record<DisplayId, { name: string; icon: string; accepts: (product: ProductId) => boolean }> = {
  shelf: { name: 'Goods Shelf', icon: '▥', accepts: () => true },
  weaponRack: { name: 'Weapon Rack', icon: '⚔', accepts: product => ['blade', 'bow'].includes(products[product].category) },
  armourStand: { name: 'Armour Stand', icon: '♜', accepts: product => products[product].category === 'armour' },
  potionDisplay: { name: 'Potion Display', icon: '⚗', accepts: product => products[product].category === 'potion' },
}
const benchNames: Record<PlacementId, string> = {
  blacksmith: 'Forge', leatherworker: 'Stitching Table', alchemist: 'Brewing Table', carpenter: 'Woodworking Bench', shopkeeper: 'Sales Counter',
  shelf: 'Goods Shelf', weaponRack: 'Weapon Rack', armourStand: 'Armour Stand', potionDisplay: 'Potion Display',
}
const gridColumns = 5
const gridRows = 5
const slotPositions = Array.from({ length: gridColumns * gridRows }, (_, slot) => {
  const column = slot % gridColumns
  const row = Math.floor(slot / gridColumns)
  return [50 + (column - row) * 8.3, 25 + (column + row) * 5.5] as const
})
const help = [
  'In preparation, click an empty floor tile to choose furniture for that space.',
  'Only workers whose benches are placed can craft. Click a placed bench to choose its recipes.',
  'Click a shelf or rack to stock it. Displayed goods attract browsers and sell for 8% more.',
  'Choose the requested stock, then sell, negotiate, suggest an alternative, or ask the customer to wait.',
]

function App() {
  const [g, setG] = useState<Save>(loadSave)
  const [selected, setSelected] = useState<ProductId | null>(null)
  const [worker, setWorker] = useState<WorkerId | null>(null)
  const [placing, setPlacing] = useState<PlacementId | null>(null)
  const [note, setNote] = useState('Morning light fills the Wandering Anvil.')
  const [resetArmed, setResetArmed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [departure, setDeparture] = useState<{ sprite: string; product: ProductId } | null>(null)
  const [furnitureTile, setFurnitureTile] = useState<number | null>(null)
  const [activeDisplay, setActiveDisplay] = useState<DisplayId | null>(null)
  const active = g.customers[0] || null
  const occupiedSlots = new Set<number>([...Object.values(g.placedBenches).filter((slot): slot is number => slot !== null), ...Object.values(g.displays).map(display => display.slot).filter((slot): slot is number => slot !== null), ...(g.shopkeeperSlot === null ? [] : [g.shopkeeperSlot])])
  const browseSlots = slotPositions.map((_, slot) => slot).filter(slot => {
    if (occupiedSlots.has(slot)) return false
    const row = Math.floor(slot / gridColumns), column = slot % gridColumns
    return [...occupiedSlots].every(occupied => Math.abs(row - Math.floor(occupied / gridColumns)) + Math.abs(column - occupied % gridColumns) > 1)
  })
  const customerPosition = (customerId: number, queueIndex: number) => {
    if (queueIndex === 0 && g.shopkeeperSlot !== null) {
      const [x, y] = slotPositions[g.shopkeeperSlot]
      return [Math.max(8, x - 7), Math.min(73, y + 4.8)] as const
    }
    const customer = g.customers[queueIndex]
    const relevantDisplay = customer && displayIds.map(id => g.displays[id]).find(display => display.slot !== null && display.product && (customer.requestedProduct === display.product || (!customer.requestedProduct && products[display.product].category === customer.request)))
    if (relevantDisplay?.slot !== null && relevantDisplay?.slot !== undefined) {
      const [x, y] = slotPositions[relevantDisplay.slot]
      return [Math.min(90, x + 5), Math.min(75, y + 4)] as const
    }
    const choices = browseSlots.length ? browseSlots : slotPositions.map((_, slot) => slot)
    const roamStep = Math.floor(g.minutes / 30)
    return slotPositions[choices[(customerId * 3 + queueIndex * 5 + roamStep) % choices.length]]
  }
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
      const visitor = makeCustomer(s.nextCustomer - 1, s.nextCustomer++, craftableProducts(s))
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
  const placeBench = (slot: number, choice: PlacementId | null = placing) => {
    if (!choice || g.phase !== 'prep') return
    update(s => {
      for (const id of workerIds) if (s.placedBenches[id] === slot) s.placedBenches[id] = null
      for (const id of displayIds) if (s.displays[id].slot === slot) s.displays[id].slot = null
      if (s.shopkeeperSlot === slot) s.shopkeeperSlot = null
      if (choice === 'shopkeeper') { s.shopkeeperSlot = slot; setNote('Sales Counter placed. The shopkeeper is ready to welcome customers.') }
      else if (displayIds.includes(choice as DisplayId)) { s.displays[choice as DisplayId].slot = slot; setNote(`${benchNames[choice]} placed. Click it to stock or move it.`) }
      else { s.placedBenches[choice as WorkerId] = slot; setNote(`${benchNames[choice]} placed. Click ${workers[choice as WorkerId].name} to choose a recipe.`) }
      return s
    })
    setPlacing(null); setFurnitureTile(null)
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
  const moveDisplay = (id: DisplayId) => update(s => {
    if (s.phase !== 'prep') return s
    s.displays[id].slot = null; setPlacing(id); setActiveDisplay(null); setNote(`${displayInfo[id].name} picked up. Choose a new grid space.`); return s
  })
  const stockDisplay = (id: DisplayId) => update(s => {
    if (s.phase === 'results' || s.displays[id].slot === null) return s
    if (!selected) { setNote('Select an item in the stock room first.'); return s }
    if (!displayInfo[id].accepts(selected)) { setNote(`${displayInfo[id].name} cannot hold ${products[selected].name}.`); return s }
    if (!s.inventory[selected]) { setNote(`${products[selected].name} is not in stock.`); return s }
    const previous = s.displays[id].product
    if (previous) s.inventory[previous]++
    s.inventory[selected]--; s.displays[id].product = selected
    setNote(`${products[selected].name} is now displayed on the ${displayInfo[id].name}.`); setSelected(null); return s
  })
  const clearDisplay = (id: DisplayId) => update(s => {
    const product = s.displays[id].product; if (!product || s.phase === 'results') return s
    s.inventory[product]++; s.displays[id].product = null; setNote(`${products[product].name} returned to the stock room.`); return s
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
    const firstVisitor = makeCustomer(0, s.nextCustomer++, craftableProducts(s))
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
    const stockedDisplay = selected ? displayIds.find(id => s.displays[id].product === selected) : undefined
    if (!selected || (!s.inventory[selected] && !stockedDisplay)) { setNote('Choose an item in stock or on display.'); return s }
    const r = products[selected], match = c.requestedProduct ? c.requestedProduct === selected : c.request === r.category, liked = c.likes.includes(r.category)
    if (action === 'suggest' && !liked) { s.reputation--; s.customers.shift(); s.served++; setNote(`${c.name} dislikes the suggestion.`); return s }
    const displayBoost = stockedDisplay ? .1 : 0
    const base = Math.round(priceFor(c, selected, s.reputation) * (stockedDisplay ? 1.08 : 1)), success = action === 'sell' ? match : action === 'suggest' ? liked : Math.random() < Math.min(.95, (match ? .82 : liked ? .56 : .18) + displayBoost)
    if (success) { const price = action === 'haggle' ? Math.round(base * 1.18) : base; if(stockedDisplay)s.displays[stockedDisplay].product=null;else s.inventory[selected]--; s.coins += price; s.revenue += price; s.sales++; setDeparture({sprite:c.sprite,product:selected}); setTimeout(()=>setDeparture(null),1800); setNote(`${c.name} buys ${r.name} for ${price}g${stockedDisplay?' after spotting it on display':''}.`) }
    else { if(action === 'haggle')s.reputation--; setNote(action === 'haggle' ? `${c.name} rejects the negotiation.` : `${c.name} refuses ${r.name}; it is not what they requested.`) }
    s.customers.shift(); s.served++; setSelected(null); return s
  })
  const nextDay = () => update(s => { s.day++; s.phase = 'prep'; s.minutes = 480; s.customers = []; s.served = 0; s.sales = 0; s.revenue = 0; s.expenses = 0; setNote(`Day ${s.day}. Arrange the shop before opening.`); return s })
  const reset = () => { if (!resetArmed) return setResetArmed(true); localStorage.removeItem('magic-and-steel-save'); setG(freshSave()); setResetArmed(false); setPlacing(null) }

  const totalStock = Object.values(g.inventory).reduce((a, b) => a + b, 0)
  const selectedIsDisplayed = selected ? displayIds.some(id => g.displays[id].product === selected) : false
  const offer = active && selected && active.kind === 'buyer' ? Math.round(priceFor(active, selected, g.reputation) * (selectedIsDisplayed ? 1.08 : 1)) : 0
  const placeableChoices: PlacementId[] = [
    ...(g.shopkeeperSlot === null ? ['shopkeeper' as const] : []),
    ...workerIds.filter(id => g.hired.includes(id) && g.placedBenches[id] === null),
    ...displayIds.filter(id => g.displays[id].slot === null),
  ]

  return <div className="game-shell">
    <header><div className="brand"><span>⚔</span><div><h1>MAGIC <i>&</i> STEEL</h1><p>The Wandering Anvil</p></div></div><div className="clock"><b>DAY {g.day} · {clock(g.minutes)}</b><small>{g.phase === 'prep' ? 'MORNING PREPARATION' : g.phase === 'open' ? (g.paused ? 'SHOP PAUSED' : `SHOP OPEN · ${g.speed}×`) : 'ACCOUNTS'}</small></div><div className="header-actions"><div className="wealth"><b>● {g.coins}g</b><small>Reputation {g.reputation >= 0 ? '+' : ''}{g.reputation}</small></div><button className="settings-toggle" onClick={() => setShowSettings(true)} aria-label="Open settings">⚙</button></div></header>
    <main><section className={`scene ${placing ? 'placement-mode' : ''}`}><div className="sign">✦ THE WANDERING ANVIL ✦</div><div className="room">
      {g.phase === 'prep' && <div className="floor-grid" aria-label="Shop floor placement grid">{slotPositions.map(([x, y], slot) => { const occupant: PlacementId | undefined = g.shopkeeperSlot === slot ? 'shopkeeper' : workerIds.find(id => g.placedBenches[id] === slot) || displayIds.find(id => g.displays[id].slot === slot); return <button key={slot} className={`bench-slot ${occupant ? 'occupied' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => placing ? placeBench(slot) : !occupant && setFurnitureTile(slot)} aria-label={`Grid row ${Math.floor(slot / gridColumns) + 1}, column ${slot % gridColumns + 1}${occupant ? `, occupied by ${benchNames[occupant]}` : ', empty; choose furniture'}`}><span>{occupant ? '×' : '+'}</span></button>})}</div>}
      <div className="workshops">{workerIds.map(id => {
        const slot = g.placedBenches[id]; if (slot === null) return null
        const w = workers[id], ws = g.workerState[id], job = ws.active && products[ws.active.product], [x, y] = slotPositions[slot]
        return <div className={`placed-workstation ${worker === id ? 'chosen' : ''}`} style={{ left: `${x}%`, top: `${y}%`, '--coat': w.color } as React.CSSProperties} key={id}>
          <div className="map-bench" title={benchNames[id]}><span>{w.icon}</span></div>
          <button className="map-worker" onClick={() => setWorker(id)} aria-label={`Select ${w.name} and view recipes`}><img src={`${import.meta.env.BASE_URL}assets/workers/${id}.png`} alt="" draggable="false"/><b>{w.name}</b></button>
          <div className="job-status">{job ? <><span>{job.icon}</span><small>{job.name}</small><div className="progress"><i style={{ width: `${ws.active!.progress / job.ticks * 100}%` }}/></div></> : <small>{ws.queue.length ? `${ws.queue.length} queued` : 'Ready'}</small>}</div>
        </div>
      })}</div>
      {displayIds.map(id => { const display = g.displays[id]; if(display.slot === null)return null; const [x,y]=slotPositions[display.slot]; return <button key={id} className={`map-display ${id} ${display.product?'stocked':''}`} style={{left:`${x}%`,top:`${y}%`}} onClick={()=>setActiveDisplay(id)} aria-label={`${displayInfo[id].name}${display.product?`, displaying ${products[display.product].name}`:', empty'}`}><img src={`${import.meta.env.BASE_URL}assets/displays/${id}.png`} alt=""/><span className="merchandise-slot">{display.product?products[display.product].icon:''}</span></button> })}
      {furnitureTile !== null && (()=>{const [x,y]=slotPositions[furnitureTile];return <div className="floor-picker" style={{left:`${x}%`,top:`${y}%`}} role="dialog" aria-label="Choose furniture"><button className="picker-close" onClick={()=>setFurnitureTile(null)}>×</button><b>PLACE FURNITURE</b>{placeableChoices.map(id=><button key={id} onClick={()=>placeBench(furnitureTile,id)}><span>{displayIds.includes(id as DisplayId)?displayInfo[id as DisplayId].icon:id==='shopkeeper'?'▤':workers[id as WorkerId].icon}</span>{benchNames[id]}</button>)}{!placeableChoices.length&&<small>Everything is already placed.</small>}</div>})()}
      {activeDisplay && g.displays[activeDisplay].slot !== null && (()=>{const display=g.displays[activeDisplay],item=display.product&&products[display.product],slot=display.slot!,[x,y]=slotPositions[slot];return <div className="display-popup" style={{left:`${x}%`,top:`${y}%`}} role="dialog" aria-label={`${displayInfo[activeDisplay].name} controls`}><button className="picker-close" onClick={()=>setActiveDisplay(null)}>×</button><b>{displayInfo[activeDisplay].name}</b>{item?<><em>{item.icon} {item.name}</em><button onClick={()=>{setSelected(display.product);setActiveDisplay(null)}}>OFFER FOR SALE</button><button disabled={g.phase==='results'} onClick={()=>{clearDisplay(activeDisplay);setActiveDisplay(null)}}>RETURN TO STOCK</button></>:<><small>{selected?`Stock with ${products[selected].name}`:'Select an item in the stock room first.'}</small><button disabled={!selected||g.phase==='results'} onClick={()=>{stockDisplay(activeDisplay);setActiveDisplay(null)}}>STOCK SELECTED</button></>}<button disabled={g.phase!=='prep'} onClick={()=>moveDisplay(activeDisplay)}>MOVE</button></div>})()}
      {g.shopkeeperSlot !== null && (() => { const [x, y] = slotPositions[g.shopkeeperSlot]; return <div className="shopkeeper-station" style={{ left: `${x}%`, top: `${y}%` }}><div className="shop-counter"><span>▤</span></div><img src={`${import.meta.env.BASE_URL}assets/shop/shopkeeper.png`} alt="Shopkeeper" draggable="false"/><small>SHOPKEEPER</small></div> })()}
      <div className="roaming-customers" aria-label="Customers in the shop">{g.customers.slice(0, 3).map((c, i) => { const [x, y] = customerPosition(c.id, i); return <button key={c.id} className={`roaming-customer ${i === 0 ? 'requesting' : 'browsing'} ${g.paused ? 'standing' : 'walking'}`} style={{ left: `${x}%`, top: `${y}%` }} title={`${c.name}, ${c.role}`} aria-label={`${c.name}, ${c.role}${i === 0 ? ', waiting at the counter' : ', browsing the shop'}`}><img src={`${import.meta.env.BASE_URL}assets/customers/${c.sprite}.png`} alt="" draggable="false"/>{i === 0 && <span className="request-bubble">{c.kind === 'supplier' ? '📦' : '?'}</span>}<b>{c.name}</b><small>{i === 0 ? c.role : 'Browsing'}</small><i style={{ width: `${c.patience / c.maxPatience * 100}%` }}/></button> })}</div>
      {departure && <div className="departing-customer"><img src={`${import.meta.env.BASE_URL}assets/customers/${departure.sprite}.png`} alt=""/><b>{products[departure.product].icon}</b></div>}
    </div><div className="notice">❧ {placing ? `Placing ${benchNames[placing]} — choose a glowing floor space.` : note}</div></section>
    <aside className="ledger"><div className="ledger-head"><b>SHOP LEDGER</b><button onClick={reset}>{resetArmed ? 'CONFIRM RESET' : 'RESET SAVE'}</button></div>
      <section><h2>Common materials <small>capacity {8 + g.storageLevel * 4}</small></h2><div className="materials">{(Object.keys(g.materials) as MaterialId[]).map(m => <div key={m}><span>{materialIcons[m]}</span><b>{g.materials[m]}</b><small>{m}</small></div>)}</div></section>
      <section><h2>Shop furniture <small>{g.phase === 'prep' ? 'tap to place or move' : 'locked while open'}</small></h2><div className="bench-palette"><button className={placing === 'shopkeeper' ? 'placing' : ''} disabled={g.phase !== 'prep'} onClick={() => g.shopkeeperSlot === null ? setPlacing('shopkeeper') : moveCounter()}><span>▤</span><b>Sales Counter</b><small>{g.shopkeeperSlot === null ? 'Place in shop' : 'Placed · tap to move'}</small></button>{workerIds.map(id => { const hired = g.hired.includes(id), placed = g.placedBenches[id] !== null; return <button key={id} className={placing === id ? 'placing' : ''} disabled={g.phase !== 'prep'} onClick={() => hired ? (placed ? removeBench(id) : setPlacing(id)) : hire(id)}><span>{workers[id].icon}</span><b>{benchNames[id]}</b><small>{hired ? (placed ? 'Placed · tap to move' : 'Place in shop') : `Hire ${workers[id].name} · 35g`}</small></button> })}</div></section>
      {worker && g.placedBenches[worker] !== null && <section><h2>{workers[worker].name} recipes <small>Lv {g.workerState[worker].level} · queue {g.workerState[worker].queue.length}/3</small></h2><div className="recipes">{recipesFor(worker, g.workerState[worker].level).map(p => { const r = products[p]; return <button key={p} onClick={() => queue(p)}><span>{r.icon}</span><b>{r.name}</b><small>{r.cost} {r.material} · {r.ticks} ticks · {r.price}g value</small></button> })}{g.workerState[worker].level < 3 && <div className="locked-recipe">🔒 More recipes at level {g.workerState[worker].level + 1} · XP {g.workerState[worker].xp}/{g.workerState[worker].level === 1 ? 3 : 8}</div>}</div></section>}
      <section><h2>Stock room <small>{totalStock} items</small></h2><div className="stock">{productIds.filter(p => g.inventory[p] > 0).map(p => <button className={selected === p ? 'selected' : ''} key={p} onClick={() => setSelected(p)}><span>{products[p].icon}</span><b>{products[p].name}</b><em>x{g.inventory[p]}</em><small>{products[p].category}</small></button>)}{!totalStock && <p className="empty">Craft goods to fill your shelves.</p>}</div></section>
      {g.phase === 'prep' && <button className="primary" onClick={open}>TURN SIGN TO OPEN</button>}
      {g.phase === 'open' && <><div className="open-controls"><button onClick={() => update(s => { s.paused = !s.paused; return s })}>{g.paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button><div className="speed-controls" aria-label="Game speed"><button className={g.speed === 1 ? 'active' : ''} onClick={() => update(s => { s.speed = 1; return s })}>1×</button><button className={g.speed === 2 ? 'active' : ''} onClick={() => update(s => { s.speed = 2; return s })}>2×</button></div><span>Visitors {g.customers.length}/3</span></div>{active ? <section className="trade"><h2>{active.icon} {active.name}</h2><p>{active.kind === 'supplier' ? `“I can sell you ${active.amount} ${active.material} for ${active.cost}g.”` : active.requestedProduct ? `“I'm looking for a ${products[active.requestedProduct].name}. Do you have one?”` : `“I'm looking for something in the ${active.request} category. What can you offer?”`}</p>{selected && active.kind === 'buyer' && <div className="quoted">{products[selected].icon} {products[selected].name} · {offer}g</div>}<div className="trade-actions">{active.kind === 'supplier' ? <><button onClick={() => serve('buy')}>ACCEPT OFFER</button><button onClick={() => serve('refuse')}>DECLINE</button></> : <><button disabled={!selected} onClick={() => serve('sell')}>SELL ITEM</button><button disabled={!selected} onClick={() => serve('haggle')}>NEGOTIATE +18%</button><button disabled={!selected} onClick={() => serve('suggest')}>SUGGEST ALTERNATIVE</button><button onClick={() => serve('wait')}>ASK TO WAIT</button><button onClick={() => serve('refuse')}>REFUSE SALE</button></>}</div></section> : <p className="empty">The counter is clear.</p>}</>}
      {g.phase === 'results' && <section className="results"><h2>Day {g.day} accounts</h2><div><span>Items sold</span><b>{g.sales}</b></div><div><span>Sales</span><b>+{g.revenue}g</b></div><div><span>Expenses</span><b>-{g.expenses}g</b></div><button className="upgrade" onClick={() => update(s => { if (s.coins >= 65) { s.coins -= 65; s.storageLevel++; setNote('Stockroom expanded.') } return s })}>EXPAND STOCKROOM · 65g<small>+4 material capacity</small></button><button className="primary" onClick={nextDay}>BEGIN DAY {g.day + 1}</button></section>}
    </aside></main>
    {showSettings && <div className="settings-backdrop" onMouseDown={() => setShowSettings(false)}><section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={event => event.stopPropagation()}><button className="settings-close" onClick={() => setShowSettings(false)} aria-label="Close settings">×</button><h2 id="settings-title">SHOP SETTINGS</h2><div className="setting-row"><div><b>Automatic pause</b><small>Pause whenever a new visitor arrives with a request.</small></div><button className={`toggle ${g.autoPause ? 'on' : ''}`} role="switch" aria-checked={g.autoPause} onClick={() => update(s => { s.autoPause = !s.autoPause; return s })}><span/>{g.autoPause ? 'ON' : 'OFF'}</button></div><div className="setting-row"><div><b>Game speed</b><small>Choose the normal or accelerated shop clock.</small></div><div className="settings-speed"><button className={g.speed === 1 ? 'active' : ''} onClick={() => update(s => { s.speed = 1; return s })}>1×</button><button className={g.speed === 2 ? 'active' : ''} onClick={() => update(s => { s.speed = 2; return s })}>2×</button></div></div><p>Settings save automatically on this device.</p></section></div>}
    <footer><div><b>SHOPKEEPER'S NOTE</b><p>{help[Math.min(g.tutorial, help.length - 1)]}</p></div><span>✓ Saved on this device</span></footer>
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
