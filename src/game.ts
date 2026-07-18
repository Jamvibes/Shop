export type WorkerId='blacksmith'|'leatherworker'|'alchemist'|'carpenter'
export type MaterialId='iron'|'leather'|'herbs'|'wood'
export type ProductId='shortsword'|'handaxe'|'ironBuckler'|'hearthSpear'|'leatherShirt'|'leatherHood'|'ridingBoots'|'scoutJerkin'|'healingPotion'|'focusTonic'|'soothingSalve'|'emberCordial'|'quarterstaff'|'huntingBow'|'oakBuckler'|'wayfarerFlute'
export type Phase='prep'|'open'|'results'
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
export type Customer={id:number;name:string;role:string;icon:string;likes:Recipe['category'][];request:Recipe['category'];patience:number;maxPatience:number;kind:'buyer'|'supplier';material?:MaterialId;amount?:number;cost?:number}
export const customerTemplates:Omit<Customer,'id'|'patience'>[]=[
 {name:'Mara',role:'Trail Warden',icon:'🧝',likes:['blade','potion'],request:'blade',maxPatience:7,kind:'buyer'},
 {name:'Brother Fen',role:'Village Healer',icon:'🧙',likes:['potion','staff'],request:'potion',maxPatience:9,kind:'buyer'},
 {name:'Tilda',role:'Road Scout',icon:'🥷',likes:['armour','bow','potion'],request:'armour',maxPatience:7,kind:'buyer'},
 {name:'Brann',role:'Hedge Mage',icon:'🧔',likes:['staff','potion'],request:'staff',maxPatience:6,kind:'buyer'},
 {name:'Ivo',role:'Woodcutter',icon:'👨‍🌾',likes:['blade','armour'],request:'blade',maxPatience:6,kind:'buyer'},
 {name:'Sable',role:'Marsh Ranger',icon:'🧕',likes:['bow','potion'],request:'bow',maxPatience:8,kind:'buyer'},
 {name:'Oren',role:'Caravan Trader',icon:'🧑‍💼',likes:[],request:'staff',maxPatience:8,kind:'supplier',material:'iron',amount:4,cost:22},
 {name:'Pella',role:'Herb Gatherer',icon:'👩‍🌾',likes:[],request:'potion',maxPatience:8,kind:'supplier',material:'herbs',amount:4,cost:22},
]
export type WorkerState={level:number;xp:number;queue:ProductId[];active?:{product:ProductId;progress:number}}
export type Save={version:8;day:number;phase:Phase;minutes:number;coins:number;materials:Record<MaterialId,number>;inventory:Record<ProductId,number>;hired:WorkerId[];placedBenches:Record<WorkerId,number|null>;shopkeeperSlot:number|null;workerState:Record<WorkerId,WorkerState>;customers:Customer[];nextCustomer:number;served:number;sales:number;revenue:number;expenses:number;reputation:number;display:ProductId[];storageLevel:number;tutorial:number;paused:boolean;speed:1|2;autoPause:boolean}
const emptyInventory=():Record<ProductId,number>=>Object.fromEntries(Object.keys(products).map(k=>[k,0])) as Record<ProductId,number>
const workerState=():Record<WorkerId,WorkerState>=>({blacksmith:{level:1,xp:0,queue:[]},leatherworker:{level:1,xp:0,queue:[]},alchemist:{level:1,xp:0,queue:[]},carpenter:{level:1,xp:0,queue:[]}})
export const freshSave=():Save=>({version:8,day:1,phase:'prep',minutes:8*60,coins:150,materials:{iron:8,leather:8,herbs:8,wood:8},inventory:emptyInventory(),hired:['blacksmith','alchemist'],placedBenches:{blacksmith:6,leatherworker:null,alchemist:23,carpenter:null},shopkeeperSlot:16,workerState:workerState(),customers:[],nextCustomer:1,served:0,sales:0,revenue:0,expenses:0,reputation:0,display:['shortsword','healingPotion'],storageLevel:1,tutorial:0,paused:false,speed:1,autoPause:true})
export const loadSave=():Save=>{try{
 const s=JSON.parse(localStorage.getItem('magic-and-steel-save')||'null');if(!s)return freshSave()
 if(s.version===3){const map=[6,8,10,16,19,21,23,17];s.placedBenches=Object.fromEntries(Object.entries(s.placedBenches).map(([id,slot])=>[id,slot===null?null:map[Number(slot)]??null]))}
 if(s.version===2)s.placedBenches={blacksmith:s.hired.includes('blacksmith')?6:null,leatherworker:s.hired.includes('leatherworker')?10:null,alchemist:s.hired.includes('alchemist')?23:null,carpenter:s.hired.includes('carpenter')?17:null}
 if(s.version<5)s.shopkeeperSlot=16
 if(s.version<8){const occupied=new Set<number>();const remap=(slot:number|null)=>{if(slot===null)return null;const row=Math.floor(slot/6),column=Math.min(slot%6,4);let next=Math.min(24,row*5+column);while(occupied.has(next))next=(next+1)%25;occupied.add(next);return next};(['blacksmith','leatherworker','alchemist','carpenter']as WorkerId[]).forEach(id=>s.placedBenches[id]=remap(s.placedBenches[id]));s.shopkeeperSlot=remap(s.shopkeeperSlot)}
 return{...s,version:8,inventory:{...emptyInventory(),...s.inventory},speed:s.speed===2?2:1,autoPause:s.autoPause!==false}
}catch{return freshSave()}}
export const saveGame=(s:Save)=>localStorage.setItem('magic-and-steel-save',JSON.stringify(s))
export const recipesFor=(w:WorkerId,level:number)=>(Object.keys(products) as ProductId[]).filter(p=>products[p].worker===w&&products[p].level<=level)
export const priceFor=(c:Customer,p:ProductId,reputation=0)=>Math.round(products[p].price*(c.request===products[p].category?1.12:c.likes.includes(products[p].category)?.96:.62)*(1+reputation*.02))
export const makeCustomer=(index:number,id:number):Customer=>{const t=customerTemplates[index%customerTemplates.length];return {...t,id,patience:t.maxPatience}}
export const clock=(minutes:number)=>`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}`
