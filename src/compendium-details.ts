type EntryType = 'workers' | 'recipes' | 'customers'

type Link = { type: EntryType; name: string }
type Entry = {
  type: EntryType
  name: string
  subtitle: string
  lore: string
  facts: string[]
  links: Link[]
}

const workers: Entry[] = [
  { type:'workers', name:'Blacksmith', subtitle:'Forge craftsperson', lore:'A former armoury hand who left the city workshops after refusing to stamp rushed blades with a royal seal. The Wandering Anvil gives them the time to make steel worth carrying.', facts:['Workshop: Forge','Material: Iron','Wage: 12g per day','Speciality: Blades and shields'], links:['Shortsword','Hand Axe','Iron Buckler','Hearthguard Spear'].map(name=>({type:'recipes',name})) },
  { type:'workers', name:'Leatherworker', subtitle:'Stitching craftsperson', lore:'A patient traveller who learned that a well-cut jerkin can save a life as surely as a shield. Every piece is fitted for the road rather than the parade ground.', facts:['Workshop: Stitching Table','Material: Leather','Wage: 10g per day','Speciality: Armour and travelling gear'], links:['Leather Shirt','Trail Hood','Riding Boots','Mossbound Jerkin'].map(name=>({type:'recipes',name})) },
  { type:'workers', name:'Alchemist', subtitle:'Brewing craftsperson', lore:'Once an assistant to a celebrated court physician, the alchemist prefers useful remedies to impressive smoke. Their shelves smell of bitterleaf, emberberry, and old parchment.', facts:['Workshop: Brewing Table','Material: Herbs','Wage: 11g per day','Speciality: Potions, tonics, and salves'], links:['Healing Potion','Focus Tonic','Soothing Salve','Emberberry Cordial'].map(name=>({type:'recipes',name})) },
  { type:'workers', name:'Carpenter', subtitle:'Woodworking craftsperson', lore:'A maker of practical things with a quiet fondness for instruments. They judge every stave by its grain and every customer by how they hold it.', facts:['Workshop: Woodworking Bench','Material: Wood','Wage: 9g per day','Speciality: Staves, bows, shields, and instruments'], links:['Quarterstaff','Hunting Bow','Oak Buckler','Wayfarer Flute'].map(name=>({type:'recipes',name})) },
]

const recipeRows = [
 ['Shortsword','Blacksmith','Iron','2','34g','4 ticks','blade'],['Hand Axe','Blacksmith','Iron','3','52g','6 ticks','blade'],['Iron Buckler','Blacksmith','Iron','3','48g','5 ticks','armour'],['Hearthguard Spear','Blacksmith','Iron','5','82g','8 ticks','blade'],
 ['Leather Shirt','Leatherworker','Leather','2','31g','4 ticks','armour'],['Trail Hood','Leatherworker','Leather','3','47g','6 ticks','armour'],['Riding Boots','Leatherworker','Leather','3','44g','5 ticks','armour'],['Mossbound Jerkin','Leatherworker','Leather','5','76g','8 ticks','armour'],
 ['Healing Potion','Alchemist','Herbs','2','26g','3 ticks','potion'],['Focus Tonic','Alchemist','Herbs','3','44g','5 ticks','potion'],['Soothing Salve','Alchemist','Herbs','3','40g','4 ticks','potion'],['Emberberry Cordial','Alchemist','Herbs','5','72g','7 ticks','potion'],
 ['Quarterstaff','Carpenter','Wood','2','29g','4 ticks','staff'],['Hunting Bow','Carpenter','Wood','3','50g','6 ticks','bow'],['Oak Buckler','Carpenter','Wood','3','45g','5 ticks','armour'],['Wayfarer Flute','Carpenter','Wood','5','74g','7 ticks','staff'],
] as const
const recipeLore: Record<string,string> = {
 'Shortsword':'The dependable first commission of many young smiths: short enough for cramped roads and sturdy enough for daily use.',
 'Hand Axe':'Balanced for camp work but edged for danger, it is popular with travellers who cannot afford to carry two tools.',
 'Iron Buckler':'A compact shield built for quick hands. Its dented predecessors hang above many village hearths.',
 'Hearthguard Spear':'Traditionally carried by watchmen stationed beside winter fires, with a broad head suited to holding a doorway.',
 'Leather Shirt':'Layered hide protects the ribs without announcing its wearer from half a mile away.',
 'Trail Hood':'Waxed seams turn rain, while the deep cut hides dust, fatigue, and occasionally a familiar face.',
 'Riding Boots':'Reinforced at heel and ankle for long days in the saddle and longer walks home.',
 'Mossbound Jerkin':'Dyed in muted woodland shades and cut to move quietly through tangled country.',
 'Healing Potion':'A sharp, coppery draught used for cuts, bruises, and the regrettable consequences of confidence.',
 'Focus Tonic':'A bitter tonic favoured by scribes, scouts, and anyone expected to remain alert after midnight.',
 'Soothing Salve':'Cool on contact and fragrant with crushed herbs, it is often bought by healers in small clay jars.',
 'Emberberry Cordial':'Warmth blooms after the first sip. Experienced adventurers know not to mistake it for ordinary wine.',
 'Quarterstaff':'Simple in appearance, demanding in execution, and useful even after the road becomes peaceful again.',
 'Hunting Bow':'Built for reliability in damp forests, with enough strength for game and the dangers that stalk it.',
 'Oak Buckler':'Lighter than iron and pleasantly stubborn, with a rim designed to survive repeated repairs.',
 'Wayfarer Flute':'A travelling instrument whose clear tone carries over campfires, markets, and lonely stretches of road.',
}
const recipes: Entry[] = recipeRows.map(([name,worker,material,cost,value,time,category])=>({
 type:'recipes', name, subtitle:`${category[0].toUpperCase()+category.slice(1)} recipe`, lore:recipeLore[name],
 facts:[`Crafted by: ${worker}`,`Materials: ${cost} ${material.toLowerCase()}`,`Base value: ${value}`,`Craft time: ${time}`],
 links:[{type:'workers',name:worker}, ...customerLinksFor(category)]
}))

function customerLinksFor(category:string): Link[] {
 const likes: Record<string,string[]> = {
  blade:['Mara · Trail Warden','Dame Tilda · Road Knight','Ser Cal · Hearth Paladin'],
  armour:['Sable · Marsh Ranger','Brother Fen · Village Cleric','Dame Tilda · Road Knight','Ser Cal · Hearth Paladin'],
  potion:['Mara · Trail Warden','Sable · Marsh Ranger','Brother Fen · Village Cleric','Brann · Hedge Wizard','Ser Cal · Hearth Paladin','Elowen · Grove Druid'],
  staff:['Brother Fen · Village Cleric','Brann · Hedge Wizard','Elowen · Grove Druid'],
  bow:['Sable · Marsh Ranger','Elowen · Grove Druid'],
 }
 return (likes[category]||[]).map(name=>({type:'customers',name}))
}

const customers: Entry[] = [
 ['Mara · Trail Warden','Buyer','Mara patrols paths too small for the king’s maps. She values equipment that can survive weather, neglect, and sudden trouble.',['Prefers: blades and potions','Usually requests: blades'],['Shortsword','Hand Axe','Hearthguard Spear','Healing Potion']],
 ['Sable · Marsh Ranger','Buyer','Sable knows every dry stone through the marshes and seldom enters town without reeds caught in her cloak.',['Prefers: bows, potions, and armour','Usually requests: bows'],['Hunting Bow','Healing Potion','Leather Shirt','Mossbound Jerkin']],
 ['Brother Fen · Village Cleric','Buyer','Fen serves three scattered hamlets and carries more bandages than scripture. He buys for the people who cannot make the journey themselves.',['Prefers: potions, staves, and armour','Usually requests: potions'],['Healing Potion','Soothing Salve','Quarterstaff','Leather Shirt']],
 ['Brann · Hedge Wizard','Buyer','Brann insists that “hedge wizard” describes geography rather than rank. His singed sleeves suggest regular experimentation.',['Prefers: staves and potions','Usually requests: staves'],['Quarterstaff','Wayfarer Flute','Focus Tonic','Emberberry Cordial']],
 ['Dame Tilda · Road Knight','Buyer','Tilda escorts merchants between towns and judges craftsmanship by whether it still works after a muddy ambush.',['Prefers: blades and armour','Usually requests: armour'],['Shortsword','Iron Buckler','Leather Shirt','Riding Boots']],
 ['Ser Cal · Hearth Paladin','Buyer','Cal protects pilgrims travelling to the old hearth shrines. He is courteous, exacting, and notoriously hard on equipment.',['Prefers: armour, blades, and potions','Usually requests: blades'],['Hearthguard Spear','Iron Buckler','Mossbound Jerkin','Healing Potion']],
 ['Elowen · Grove Druid','Buyer','Elowen trades news from the deep woods for goods made with care. Wasteful workmanship earns a silence colder than refusal.',['Prefers: staves, potions, and bows','Usually requests: staves'],['Quarterstaff','Wayfarer Flute','Hunting Bow','Soothing Salve']],
 ['Oren · Caravan Trader','Supplier','Oren’s wagons follow the safest road available, which is not always the shortest or most legal-looking.',['Supplies: leather','Bundle: 4 leather for 22g'],['Leather Shirt','Trail Hood','Riding Boots','Mossbound Jerkin']],
 ['Ivo · Woodcutter','Supplier','Ivo brings straight-grained timber from the northern slopes and remembers exactly who pays fairly.',['Supplies: wood','Bundle: 4 wood for 18g'],['Quarterstaff','Hunting Bow','Oak Buckler','Wayfarer Flute']],
 ['Pella · Herb Gatherer','Supplier','Pella gathers before sunrise, when dew reveals leaves that would otherwise vanish into the undergrowth.',['Supplies: herbs','Bundle: 4 herbs for 18g'],['Healing Potion','Focus Tonic','Soothing Salve','Emberberry Cordial']],
].map(([name,subtitle,lore,facts,recipeNames])=>({type:'customers',name:name as string,subtitle:subtitle as string,lore:lore as string,facts:facts as string[],links:(recipeNames as string[]).map(name=>({type:'recipes',name}))}))

const entries = [...workers,...recipes,...customers]
const key = (type:EntryType,name:string)=>`${type}:${name.toLowerCase()}`
const entryMap = new Map(entries.map(entry=>[key(entry.type,entry.name),entry]))
let current: Entry | null = null

const style = document.createElement('style')
style.textContent = `
.compendium-grid article:not(.locked){cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}.compendium-grid article:not(.locked):hover,.compendium-grid article:not(.locked):focus-within{transform:translateY(-2px);box-shadow:3px 5px #4b342333}.compendium-grid article:not(.locked)::after{content:'VIEW';margin-left:auto;align-self:flex-end;font-size:6px;color:#765233}.compendium-detail-backdrop{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:18px;background:#12100dbd}.compendium-detail{position:relative;width:min(620px,100%);max-height:86vh;overflow:auto;padding:20px;background:#f2dfb7;border:4px double #795438;color:#39271f;box-shadow:7px 9px #08060566}.compendium-detail-close{position:absolute;right:10px;top:8px;border:0;background:transparent;font-size:24px;color:#543827}.compendium-detail-head{display:flex;gap:14px;padding-right:30px;border-bottom:2px solid #9b754b;padding-bottom:12px}.compendium-detail-mark{display:grid;place-items:center;flex:0 0 60px;height:60px;border:2px solid #8d6747;background:#d5b779;font:24px MedievalSharp}.compendium-detail h3{margin:0;font:18px MedievalSharp}.compendium-detail-head small{display:block;margin-top:4px;font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#795941}.compendium-detail-lore{font-size:10px;line-height:1.65;font-style:italic}.compendium-detail-facts{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}.compendium-detail-facts span{padding:7px;border:1px solid #ad8659;background:#ead2a5;font-size:8px}.compendium-detail h4{margin:15px 0 7px;font:11px MedievalSharp}.compendium-links{display:flex;flex-wrap:wrap;gap:6px}.compendium-links button{padding:7px 9px;border:2px solid #76523a;background:#fff0c7;color:#432e22;font-size:8px}.compendium-links button:hover{background:#38756b;color:#fff1d0}.compendium-empty-links{font-size:8px;color:#795941}@media(max-width:620px){.compendium-detail{padding:15px}.compendium-detail-facts{grid-template-columns:1fr}.compendium-detail-head{gap:10px}.compendium-detail-mark{flex-basis:48px;height:48px}}
`
document.head.append(style)

function typeFromActiveTab(): EntryType | null {
 const active = document.querySelector<HTMLButtonElement>('.compendium-tabs button.active')?.textContent?.trim().toLowerCase()
 return active === 'workers' || active === 'recipes' || active === 'customers' ? active : null
}

function enhanceCards() {
 const type = typeFromActiveTab()
 if (!type) return
 document.querySelectorAll<HTMLElement>('.compendium-grid article').forEach(card=>{
  if (card.classList.contains('locked') || card.dataset.detailsReady === 'true') return
  const title = card.querySelector('b')?.textContent?.trim()
  if (!title || !entryMap.has(key(type,title))) return
  card.dataset.detailsReady = 'true'
  card.tabIndex = 0
  card.setAttribute('role','button')
  card.setAttribute('aria-label',`View details for ${title}`)
  const open = () => showEntry(entryMap.get(key(type,title))!)
  card.addEventListener('click',open)
  card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}})
 })
}

function navigate(link: Link) {
 closeDetail()
 const tab = [...document.querySelectorAll<HTMLButtonElement>('.compendium-tabs button')].find(button=>button.textContent?.trim().toLowerCase()===link.type)
 tab?.click()
 setTimeout(()=>{
  enhanceCards()
  const card = [...document.querySelectorAll<HTMLElement>('.compendium-grid article:not(.locked)')].find(article=>article.querySelector('b')?.textContent?.trim()===link.name)
  if(card){card.scrollIntoView({block:'center'});card.focus();card.click()}
 },60)
}

function showEntry(entry:Entry) {
 current = entry
 closeDetail()
 const backdrop=document.createElement('div')
 backdrop.className='compendium-detail-backdrop'
 backdrop.innerHTML=`<section class="compendium-detail" role="dialog" aria-modal="true" aria-labelledby="compendium-detail-title"><button class="compendium-detail-close" aria-label="Close details">×</button><div class="compendium-detail-head"><div class="compendium-detail-mark">${entry.type==='workers'?'⚒':entry.type==='recipes'?'✦':'♟'}</div><div><h3 id="compendium-detail-title"></h3><small></small></div></div><p class="compendium-detail-lore"></p><div class="compendium-detail-facts"></div><h4>RELATED ENTRIES</h4><div class="compendium-links"></div></section>`
 backdrop.querySelector('h3')!.textContent=entry.name
 backdrop.querySelector('.compendium-detail-head small')!.textContent=entry.subtitle
 backdrop.querySelector('.compendium-detail-lore')!.textContent=entry.lore
 const facts=backdrop.querySelector('.compendium-detail-facts')!
 entry.facts.forEach(fact=>{const span=document.createElement('span');span.textContent=fact;facts.append(span)})
 const links=backdrop.querySelector('.compendium-links')!
 const visibleLinks=entry.links.filter(link=>{
  const target=entryMap.get(key(link.type,link.name));return Boolean(target)
 })
 if(!visibleLinks.length)links.innerHTML='<span class="compendium-empty-links">No related entries have been recorded.</span>'
 visibleLinks.forEach(link=>{const button=document.createElement('button');button.type='button';button.textContent=link.name;button.addEventListener('click',()=>navigate(link));links.append(button)})
 backdrop.addEventListener('mousedown',event=>{if(event.target===backdrop)closeDetail()})
 backdrop.querySelector<HTMLButtonElement>('.compendium-detail-close')!.addEventListener('click',closeDetail)
 document.body.append(backdrop)
 backdrop.querySelector<HTMLButtonElement>('.compendium-detail-close')!.focus()
}
function closeDetail(){document.querySelector('.compendium-detail-backdrop')?.remove();current=null}

document.addEventListener('keydown',event=>{if(event.key==='Escape'&&current)closeDetail()})
new MutationObserver(enhanceCards).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
enhanceCards()
