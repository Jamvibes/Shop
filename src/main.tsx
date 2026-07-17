import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {askPrice,customerDeck,freshSave,loadSave,products,saveGame,workers,type Customer,type ProductId,type WorkerId,type MaterialId,type Save} from './game'
import './style.css'

const materialIcon:Record<MaterialId,string>={iron:'◆',leather:'▱',herbs:'☘',wood:'▰'}
const tips=[
 'Welcome, shopkeep! Hire a second artisan, then assign crafting jobs.',
 'Click an available worker to craft. Each order spends 2 materials.',
 'Craft a few wares, then open the shop when you feel ready.',
 'Customers have tastes. Pick an item from your stock to offer them.',
 'A fair sale is safe. Negotiate once for more coin—but they may refuse.',
 'Finish the day, pay wages, and review your results.',
 'Buy the Market Stall upgrade to unlock tomorrow and a stronger shop.',
]
function App(){
 const [g,setG]=useState<Save>(loadSave)
 const [selected,setSelected]=useState<ProductId|null>(null)
 const [notice,setNotice]=useState('The morning fire crackles. Time to prepare.')
 const [confirmReset,setConfirmReset]=useState(false)
 const current=useMemo<Customer|null>(()=>g.phase==='open'&&g.customerIndex<customerDeck.length?{...customerDeck[g.customerIndex],state:'waiting'}:null,[g.phase,g.customerIndex])
 const update=(fn:(s:Save)=>Save)=>setG(old=>fn(structuredClone(old)))
 useEffect(()=>saveGame(g),[g])
 useEffect(()=>{if(g.phase!=='prep')return;const id=setInterval(()=>update(s=>{let changed=false;for(const w of s.hired){const j=s.jobs[w];if(j){j.progress++;changed=true;if(j.progress>=products[j.product].ticks){s.inventory[j.product]++;delete s.jobs[w];setNotice(`${products[j.product].name} finished and placed in stock.`)}}}return changed?s:s}),1300);return()=>clearInterval(id)},[g.phase,g.hired.join(',')])
 const hire=(id:WorkerId)=>update(s=>{if(s.hired.includes(id)||s.coins<18)return s;s.coins-=18;s.hired.push(id);s.tutorial=Math.max(s.tutorial,1);setNotice(`${workers[id].name} hired for 18g. Daily wage: ${workers[id].wage}g.`);return s})
 const craft=(id:WorkerId)=>update(s=>{const p=workers[id].product,m=products[p].material;if(s.jobs[id]){setNotice('That artisan is already at work.');return s}if(s.materials[m]<products[p].cost){setNotice(`Not enough ${m}.`);return s}s.materials[m]-=products[p].cost;s.jobs[id]={product:p,progress:0};s.tutorial=Math.max(s.tutorial,2);setNotice(`${workers[id].name} begins a ${products[p].name}.`);return s})
 const openShop=()=>update(s=>{if(Object.values(s.inventory).reduce((a,b)=>a+b,0)<2){setNotice('Craft at least two wares before opening.');return s}s.phase='open';s.tutorial=Math.max(s.tutorial,3);setNotice('The bell rings. Your first customer is approaching!');return s})
 const resolve=(mode:'accept'|'haggle'|'refuse')=>update(s=>{if(!current||!selected)return s;const qty=s.inventory[selected];if(!qty){setNotice('That shelf is empty. Choose something in stock.');return s}if(mode==='refuse'){setNotice(`${current.name} leaves empty-handed.`)}else{const base=Math.round(askPrice(current,selected)*(s.upgraded?1.1:1));const liked=current.likes.includes(products[selected].type);const success=mode==='accept'||(liked?Math.random()>.22:Math.random()>.65);if(success){const price=mode==='haggle'?Math.round(base*1.18):base;s.inventory[selected]--;s.coins+=price;s.sales++;s.revenue+=price;setNotice(`${current.name} buys the ${products[selected].name} for ${price}g${mode==='haggle'?' after a spirited haggle':''}!`)}else setNotice(`${current.name} refuses your higher price and departs.`)}s.served++;s.customerIndex++;s.tutorial=Math.max(s.tutorial,5);setSelected(null);return s})
 const finishDay=()=>update(s=>{const wages=s.hired.reduce((n,w)=>n+workers[w].wage,0);s.coins-=wages;s.phase='results';s.tutorial=5;setNotice(`Lanterns out. ${wages}g paid in wages.`);return s})
 const upgrade=()=>update(s=>{if(s.coins<55){setNotice('You need 55g for the Market Stall.');return s}s.coins-=55;s.upgraded=true;s.phase='upgrade';s.tutorial=6;setNotice('The Market Stall is yours! Shelves now attract better offers.');return s})
 const nextDay=()=>update(s=>{s.day++;s.phase='prep';s.materials={iron:6,leather:6,herbs:6,wood:6};s.customerIndex=0;s.served=0;s.sales=0;s.revenue=0;s.jobs={};s.tutorial=2;setNotice('A fresh delivery arrives. Day two begins!');return s})
 const reset=()=>{if(!confirmReset){setConfirmReset(true);return}localStorage.removeItem('magic-and-steel-save');setG(freshSave());setConfirmReset(false);setNotice('A new ledger begins.')}
 return <div className="game-shell">
  <header><div className="brand"><span className="brand-mark">⚔</span><div><h1>MAGIC <i>&</i> STEEL</h1><p>A cosy shopkeeper tale</p></div></div><div className="day">DAY {g.day}<small>{g.phase==='prep'?'PREPARATION':g.phase==='open'?'SHOP OPEN':g.phase==='results'?'DAY COMPLETE':'IMPROVEMENT'}</small></div><div className="coins"><span>●</span> {g.coins}<small>gold crowns</small></div></header>
  <main>
   <section className="scene" aria-label="Cutaway view of the shop">
    <div className="rafters"><span>✦</span><b>THE WANDERING ANVIL</b><span>✦</span></div>
    <div className="room">
     <div className="window"><div>☾</div></div><div className="shelf back"><span>🧪</span><span>📜</span><span>🕯️</span></div>{g.upgraded&&<div style={{position:'absolute',right:'4%',top:10,zIndex:2,background:'#d8a74c',border:'4px solid #492b22',padding:'8px 16px',fontFamily:'MedievalSharp'}}>✦ MARKET STALL ✦</div>}
     <div className="stations">{(Object.keys(workers) as WorkerId[]).map((id,i)=>{const w=workers[id],h=g.hired.includes(id),job=g.jobs[id];return <button key={id} className={`station s${i} ${h?'hired':'locked'}`} onClick={()=>h?craft(id):hire(id)} aria-label={h?`Craft ${products[w.product].name}`:`Hire ${w.name}`}><div className="worker" style={{'--coat':w.color} as React.CSSProperties}><span className="head">{h?'●':'?'}</span><span className="body">{w.icon}</span></div><b>{w.name}</b><small>{h?(job?`Crafting ${products[job.product].name}`:`Tap to craft ${products[w.product].name}`):`Hire 18g · Wage ${w.wage}g`}</small>{job&&<div className="progress"><i style={{width:`${job.progress/products[job.product].ticks*100}%`}}/></div>}</button>})}</div>
     <div className="counter"><div className="countertop"/><span className="merchant">🧑‍🌾<small>YOU</small></span></div>
     <div className={`customer ${current?'arrived':''}`}>{current?<><span>{current.icon}</span><b>{current.name}</b></>:g.phase==='open'?<span className="dust">· · ·</span>:null}</div>
     <div className="door">{g.phase==='open'?'OPEN':'CLOSED'}<i/></div><div className="floor-lines"/>
    </div>
    <div className="notice">❧ {notice}</div>
   </section>
   <aside className="ledger">
    <div className="tabs"><b>SHOP LEDGER</b><button onClick={reset}>{confirmReset?'CONFIRM RESET':'RESET SAVE'}</button></div>
    <section><h2>Materials</h2><div className="materials">{(Object.keys(g.materials) as MaterialId[]).map(m=><div key={m}><span>{materialIcon[m]}</span><b>{g.materials[m]}</b><small>{m}</small></div>)}</div></section>
    <section><h2>Shelf stock</h2><div className="stock">{(Object.keys(products) as ProductId[]).map(p=><button key={p} className={selected===p?'selected':''} disabled={g.phase!=='open'||!g.inventory[p]} onClick={()=>setSelected(p)}><span>{products[p].icon}</span><b>{products[p].name}</b><em>x{g.inventory[p]}</em><small>Value {products[p].price}g</small></button>)}</div></section>
    {g.phase==='prep'&&<button className="primary" onClick={openShop}>RING THE BELL · OPEN SHOP</button>}
    {g.phase==='open'&&current&&<section className="trade"><h2>{current.name}, {current.role}</h2><p>“I’m seeking a <b>{products[current.request].name}</b>. Show me something useful.”</p><div className="preference">Prefers: {current.likes.join(' · ')}</div>{selected?<div className="offer"><span>Offer {Math.round(askPrice(current,selected)*(g.upgraded?1.1:1))}g</span><button onClick={()=>resolve('accept')}>SELL</button><button onClick={()=>resolve('haggle')}>HAGGLE +18%</button><button onClick={()=>resolve('refuse')}>DECLINE</button></div>:<small>Select an item from Shelf stock.</small>}</section>}
    {g.phase==='open'&&g.customerIndex>=customerDeck.length&&<button className="primary" onClick={finishDay}>CLOSE SHOP · COUNT THE TILL</button>}
    {g.phase==='results'&&<section className="results"><h2>Day {g.day} Results</h2><div><span>Customers served</span><b>{g.served}</b></div><div><span>Items sold</span><b>{g.sales}</b></div><div><span>Sales revenue</span><b>{g.revenue}g</b></div><div><span>Wages paid</span><b>-{g.hired.reduce((n,w)=>n+workers[w].wage,0)}g</b></div>{!g.upgraded?<button className="upgrade" onClick={upgrade}>BUILD MARKET STALL · 55g<small>Better offers next day + proud new awning</small></button>:<button className="primary" onClick={nextDay}>BEGIN DAY {g.day+1}</button>}</section>}
    {g.phase==='upgrade'&&<section className="upgrade-card"><div>⛺</div><h2>Market Stall Built!</h2><p>Your bright street stall draws wealthier travellers. Tomorrow’s base offers rise by 10%.</p><button className="primary" onClick={nextDay}>BEGIN DAY {g.day+1}</button></section>}
   </aside>
  </main>
  <footer><div className="guide"><span>✦</span><div><b>SHOPKEEPER'S NOTE</b><p>{tips[Math.min(g.tutorial,tips.length-1)]}</p></div></div><div className="save-status">✓ Ledger saved locally</div></footer>
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>)
