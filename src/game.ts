export type WorkerId='blacksmith'|'leatherworker'|'alchemist'|'carpenter'
export type MaterialId='iron'|'leather'|'herbs'|'wood'
export type ProductId='shortsword'|'handaxe'|'ironBuckler'|'hearthSpear'|'leatherShirt'|'leatherHood'|'ridingBoots'|'scoutJerkin'|'healingPotion'|'focusTonic'|'soothingSalve'|'emberCordial'|'quarterstaff'|'huntingBow'|'oakBuckler'|'wayfarerFlute'
export type Phase='prep'|'open'|'results'
export type DisplayId='shelf'|'weaponRack'|'armourStand'|'potionDisplay'
export type DisplayState={slot:number|null;product:ProductId|null;quantity:number}
export type FurnitureId=WorkerId|DisplayId|'shopkeeper'
export type FurnitureFacing=0|1
export type Recipe={name:string;icon:string;worker:WorkerId;material:MaterialId;cost:number;price:number;ticks:number;category:'blade'|'armour'|'potion'|'staff'|'bow';level:number}
export const products:Record<ProductId,Recipe>={
 shortsword:{name:'Shortsword',icon:'🗡️',worker:'blacksmith',material:'iron',cost:2,price:34,ticks:4,category:'blade',level:1},
 handaxe:{name:'Hand Axe',icon:'🪓',worker:'blacksmith',material:'iron',cost:3,price:52,ticks:6,category:'blade',level:2},
 ironBuckler:{name:'Iron Buckler',icon:'🛡️',worker:'blacksmith',material:'iron',cost:3,price:48,ticks:5,category:'armour',level:2},
 hearthSpear:{name:'Hearthguard Spear',icon:'🔱',worker:'blacksmith',material:'iron',cost:5,price:82,ticks:8,category:'blade',level:3},
 leatherShirt:{name:'Leather Shirt',icon:'🥋',worker:'leatherworker',material:'leather',cost:2,price:31,ticks:4,category:'armour',level:1},
 leatherHood:{name:'Trail Hood',icon:'🧢',worker:'leatherworker',material:'leather',cost:3,price:47,ticks:6,category:'armour',level:2},
 ridingBoots:{name:'Riding Boots',icon:'🥾',worker:'leatherworker',material:'leather',cost:3,price:44,ticks:5,category:'armour',level:2},
 scoutJerkin:{name:'Mossbound Jerkin',icon:'🦺',worker:'leatherworker',material:'leather',cost:5,price:76,ticks:8,category:'armour',level:3},
 healingPotion:{name:'Healing Potion',icon:'🧪',worker:'alchemist',material:'herbs',cost:2,price:26,ticks:3,category:'potion',level:1},
 focusTonic:{name:'Focus Tonic',icon:'⚗️',worker:'alchemist',material:'herbs',cost:3,price:44,ticks:5,category:'potion',level:2},
 soothingSalve:{name:'Soothing Salve',icon:'🫙',worker:'alchemist',material:'herbs',cost:3,price:40,ticks:4,category:'potion',level:2},
 emberCordial:{name:'Emberberry Cordial',icon:'🍷',worker:'alchemist',material:'herbs',cost:5,price:72,ticks:7,category:'potion',level:3},
 quarterstaff:{name:'Quarterstaff',icon:'🪄',worker:'carpenter',material:'wood',cost:2,price:29,ticks:4,category:'staff',level:1},
 huntingBow:{name:'Hunting Bow',icon:'🏹',worker:'carpenter',material:'wood',cost:3,price:50,ticks:6,category:'bow',level:2},
 oakBuckler:{name:'Oak Buckler',icon:'🛡️',worker:'carpenter',material:'wood',cost:3,price:45,ticks:5,category:'armour',level:2},
 wayfarerFlute:{name:'Wayfarer Flute',icon:'🪈',worker:'carpenter',material:'wood',cost:5,price:74,ticks:7,category:'staff',level:3},
}
export const workers:Record<WorkerId,{name:string;icon:string;wage:number;color:string}>={
 blacksmith:{name:'Blacksmith',icon:'⚒',wage:12,color:'#bd6448'},leatherworker:{name:'Leatherworker',icon:'✂',wage:10,color:'#c69250'},alchemist:{name:'Alchemist',icon:'⚗',wage:11,color:'#735c9d'},carpenter:{name:'Carpenter',icon:'▰',wage:9,color:'#648a54'}
}
export type CustomerSprite='warden'|'ranger'|'cleric'|'wizard'|'knight'|'paladin'|'druid'|'trader'|'woodcutter'|'herbalist'
export type Customer={id:number;name:string;role:string;icon:string;sprite:CustomerSprite;level:number;likes:Recipe['category'][];request:Recipe['category'];requestedProduct?:ProductId;browsingProduct?:ProductId;browseTicks:number;patience:number;maxPatience:number;kind:'buyer'|'supplier';material?:MaterialId;amount?:number;cost?:number}
export const customerTemplates:Omit<Customer,'id'|'patience'|'browseTicks'>[]=[
 {name:'Mara',role:'Trail Warden',icon:'🛡️',sprite:'warden',level:2,likes:['blade','potion'],request:'blade',maxPatience:7,kind:'buyer'},
 {name:'Sable',role:'Marsh Ranger',icon:'🏹',sprite:'ranger',level:2,likes:['bow','potion','armour'],request:'bow',maxPatience:8,kind:'buyer'},
 {name:'Brother Fen',role:'Village Cleric',icon:'✨',sprite:'cleric',level:1,likes:['potion','staff','armour'],request:'potion',maxPatience:9,kind:'buyer'},
 {name:'Brann',role:'Hedge Wizard',icon:'🔮',sprite:'wizard',level:2,likes:['staff','potion'],request:'staff',maxPatience:6,kind:'buyer'},
 {name:'Dame Tilda',role:'Road Knight',icon:'⚔️',sprite:'knight',level:2,likes:['blade','armour'],request:'armour',maxPatience:7,kind:'buyer'},
 {name:'Ser Cal',role:'Hearth Paladin',icon:'☀️',sprite:'paladin',level:3,likes:['armour','blade','potion'],request:'blade',maxPatience:8,kind:'buyer'},
 {name:'Elowen',role:'Grove Druid',icon:'🌿',sprite:'druid',level:3,likes:['staff','potion','bow'],request:'staff',maxPatience:9,kind:'buyer'},
 {name:'Oren',role:'Caravan Trader',icon:'🧳',sprite:'trader',level:2,likes:[],request:'armour',maxPatience:8,kind:'supplier',material:'leather',amount:4,cost:22},
 {name:'Ivo',role:'Woodcutter',icon:'🪵',sprite:'woodcutter',level:1,likes:[],request:'staff',maxPatience:7,kind:'supplier',material:'wood',amount:4,cost:18},
 {name:'Pella',role:'Herb Gatherer',icon:'🌱',sprite:'herbalist',level:1,likes:[],request:'potion',maxPatience:9,kind:'supplier',material:'herbs',amount:4,cost:18},
]
export type WorkerState={level:number;xp:number;queue:ProductId[];active?:{product:ProductId;progress:number}}
export type Save={version:19;day:number;phase:Phase;minutes:number;coins:number;materials:Record<MaterialId,number>;inventory:Record<ProductId,number>;mastery:Record<ProductId,number>;hired:WorkerId[];placedBenches:Record<WorkerId,number|null>;shopkeeperSlot:number|null;displays:Record<DisplayId,DisplayState>;ownedDisplays:Record<DisplayId,boolean>;furnitureFacing:Record<FurnitureId,FurnitureFacing>;workerState:Record<WorkerId,WorkerState>;customers:Customer[];discoveredCustomers:CustomerSprite[];discoveredRecipes:ProductId[];nextCustomer:number;served:number;sales:number;dailyProductSales:Record<ProductId,number>;missedRequests:number;displaySales:number;revenue:number;expenses:number;wagesPaid:number;deliveryPaid:number;reputation:number;reputationStart:number;storageLevel:number;tutorial:number;paused:boolean;speed:1|2;autoPause:boolean}
const emptyInventory=():Record<ProductId,number>=>Object.fromEntries(Object.keys(products).map(k=>[k,0])) as Record<ProductId,number>
const emptyMastery=():Record<ProductId,number>=>Object.fromEntries(Object.keys(products).map(k=>[k,0])) as Record<ProductId,number>
const workerState=():Record<WorkerId,WorkerState>=>({blacksmith:{level:1,xp:0,queue:[]},leatherworker:{level:1,xp:0,queue:[]},alchemist:{level:1,xp:0,queue:[]},carpenter:{level:1,xp:0,queue:[]}})
export const freshSave=():Save=>({version:19,day:1,phase:'prep',minutes:8*60,coins:150,materials:{iron:8,leather:8,herbs:8,wood:8},inventory:emptyInventory(),mastery:emptyMastery(),hired:['blacksmith','alchemist'],placedBenches:{blacksmith:6,leatherworker:null,alchemist:23,carpenter:null},shopkeeperSlot:16,displays:{shelf:{slot:12,product:null,quantity:0},weaponRack:{slot:null,product:null,quantity:0},armourStand:{slot:null,product:null,quantity:0},potionDisplay:{slot:null,product:null,quantity:0}},ownedDisplays:{shelf:true,weaponRack:false,armourStand:false,potionDisplay:false},furnitureFacing:{blacksmith:0,leatherworker:0,alchemist:0,carpenter:0,shopkeeper:0,shelf:0,weaponRack:0,armourStand:0,potionDisplay:0},workerState:workerState(),customers:[],discoveredCustomers:[],discoveredRecipes:['shortsword','healingPotion'],nextCustomer:1,served:0,sales:0,dailyProductSales:emptyInventory(),missedRequests:0,displaySales:0,revenue:0,expenses:0,wagesPaid:0,deliveryPaid:0,reputation:0,reputationStart:0,storageLevel:1,tutorial:0,paused:false,speed:1,autoPause:true})
export const loadSave=():Save=>{try{
 const s=JSON.parse(localStorage.getItem('magic-and-steel-save')||'null');if(!s)return freshSave()
 if(s.version===3){const map=[6,8,10,16,19,21,23,17];s.placedBenches=Object.fromEntries(Object.entries(s.placedBenches).map(([id,slot])=>[id,slot===null?null:map[Number(slot)]??null]))}
 if(s.version===2)s.placedBenches={blacksmith:s.hired.includes('blacksmith')?6:null,leatherworker:s.hired.includes('leatherworker')?10:null,alchemist:s.hired.includes('alchemist')?23:null,carpenter:s.hired.includes('carpenter')?17:null}
 if(s.version<5)s.shopkeeperSlot=16
 if(s.version<8){const occupied=new Set<number>();const remap=(slot:number|null)=>{if(slot===null)return null;const row=Math.floor(slot/6),column=Math.min(slot%6,4);let next=Math.min(24,row*5+column);while(occupied.has(next))next=(next+1)%25;occupied.add(next);return next};(['blacksmith','leatherworker','alchemist','carpenter']as WorkerId[]).forEach(id=>s.placedBenches[id]=remap(s.placedBenches[id]));s.shopkeeperSlot=remap(s.shopkeeperSlot)}
 if(s.version<9)s.customers=(s.customers||[]).map((customer:Customer,index:number)=>({...customer,sprite:customerTemplates[index%customerTemplates.length].sprite}))
 if(s.version<10)s.displays={shelf:{slot:12,product:null,quantity:0},weaponRack:{slot:null,product:null,quantity:0},armourStand:{slot:null,product:null,quantity:0},potionDisplay:{slot:null,product:null,quantity:0}}
 if(s.version<11)s.furnitureFacing={blacksmith:0,leatherworker:0,alchemist:0,carpenter:0,shopkeeper:0,shelf:0,weaponRack:0,armourStand:0,potionDisplay:0}
 if(s.version<12)s.ownedDisplays={shelf:true,weaponRack:true,armourStand:true,potionDisplay:true}
 if(s.shopkeeperSlot===null){const occupied=new Set<number>([...Object.values(s.placedBenches).filter((slot):slot is number=>slot!==null),...Object.values(s.displays).map((display:any)=>display.slot).filter((slot):slot is number=>slot!==null)]);s.shopkeeperSlot=Array.from({length:25},(_,slot)=>slot).find(slot=>!occupied.has(slot))??16}
 const displays=Object.fromEntries((Object.keys(s.displays) as DisplayId[]).map(id=>{const display=s.displays[id];return[id,{...display,quantity:display.product?Math.max(1,display.quantity||1):0}]})) as Record<DisplayId,DisplayState>
 const discoveredCustomers=Array.from(new Set<CustomerSprite>([...(s.discoveredCustomers||[]),...(s.customers||[]).map((customer:Customer)=>customer.sprite)]))
 const discoveredRecipes=Array.from(new Set<ProductId>([...(s.discoveredRecipes||[]),...(Object.keys(products) as ProductId[]).filter(product=>s.hired.includes(products[product].worker)&&products[product].level<=s.workerState[products[product].worker].level)]))
 const customers=(s.customers||[]).map((customer:Customer)=>({...customer,level:customer.level??customerTemplates.find(template=>template.sprite===customer.sprite)?.level??1,browseTicks:Math.max(0,customer.browseTicks??0)}))
 return{...s,version:19,displays,customers,discoveredCustomers,discoveredRecipes,inventory:{...emptyInventory(),...s.inventory},mastery:{...emptyMastery(),...s.mastery},dailyProductSales:{...emptyInventory(),...(s.dailyProductSales||{})},missedRequests:s.missedRequests||0,displaySales:s.displaySales||0,wagesPaid:s.wagesPaid||0,deliveryPaid:s.deliveryPaid||0,reputationStart:s.reputationStart??s.reputation??0,speed:s.speed===2?2:1,autoPause:s.autoPause!==false}
}catch{return freshSave()}}
export const saveGame=(s:Save)=>localStorage.setItem('magic-and-steel-save',JSON.stringify(s))
export const recipesFor=(w:WorkerId,level:number)=>(Object.keys(products) as ProductId[]).filter(p=>products[p].worker===w&&products[p].level<=level)
export const craftTicks=(product:ProductId,mastery:number)=>Math.max(2,products[product].ticks-Math.floor(mastery/5))
export type OfferFit='exact'|'category'|'alternative'|'tooHigh'|'tooLow'|'wrongItem'|'wrongCategory'
export const offerFit=(customer:Customer,product:ProductId,alternative=false):OfferFit=>{
 const recipe=products[product]
 if(customer.requestedProduct&&!alternative)return customer.requestedProduct===product?'exact':'wrongItem'
 const categoryMatches=alternative?customer.likes.includes(recipe.category):customer.request===recipe.category
 if(!categoryMatches)return alternative?'wrongCategory':'wrongCategory'
 if(recipe.level>customer.level)return'tooHigh'
 if(recipe.level<Math.max(1,customer.level-1))return'tooLow'
 return alternative?'alternative':'category'
}
export const priceFor=(c:Customer,p:ProductId,reputation=0)=>Math.round(products[p].price*(c.requestedProduct===p?1.18:!c.requestedProduct&&c.request===products[p].category?1.12:c.likes.includes(products[p].category)?.96:.62)*(1+reputation*.02))
export const craftableProducts=(s:Pick<Save,'hired'|'placedBenches'|'workerState'>)=>(Object.keys(products) as ProductId[]).filter(product=>{const recipe=products[product];return s.hired.includes(recipe.worker)&&s.placedBenches[recipe.worker]!==null&&recipe.level<=s.workerState[recipe.worker].level})
export const makeCustomer=(index:number,id:number,availableProducts:ProductId[]=(Object.keys(products) as ProductId[]),displayedProducts:ProductId[]=[]):Customer=>{
 const t=customerTemplates[index%customerTemplates.length]
 if(t.kind==='supplier')return {...t,id,browseTicks:1,patience:t.maxPatience}
 const available=availableProducts.length?availableProducts:(Object.keys(products) as ProductId[]).filter(product=>products[product].level===1)
 const highestAvailable=Math.max(...available.map(product=>products[product].level))
 const level=Math.min(t.level,highestAvailable+1)
 const suitable=available.filter(product=>products[product].level<=level&&products[product].level>=Math.max(1,level-1))
 const preferred=suitable.filter(product=>t.likes.includes(products[product].category))
 const displayedPreferred=displayedProducts.filter(product=>suitable.includes(product)&&t.likes.includes(products[product].category))
 const candidates=displayedPreferred.length?displayedPreferred:preferred.length?preferred:suitable
 const chosen=candidates[(id+index)%candidates.length]
 return {...t,level,id,browseTicks:2,patience:t.maxPatience,browsingProduct:displayedPreferred[0],request:products[chosen].category,requestedProduct:id%2===1?chosen:undefined}
}
export const clock=(minutes:number)=>`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}`
