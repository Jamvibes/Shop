export type WorkerId = 'blacksmith'|'leatherworker'|'alchemist'|'carpenter'
export type ProductId = 'shortsword'|'leatherShirt'|'healingPotion'|'quarterstaff'
export type MaterialId = 'iron'|'leather'|'herbs'|'wood'
export type Phase = 'prep'|'open'|'results'|'upgrade'
export const products: Record<ProductId,{name:string;icon:string;worker:WorkerId;material:MaterialId;cost:number;price:number;ticks:number;type:string}> = {
  shortsword:{name:'Shortsword',icon:'🗡️',worker:'blacksmith',material:'iron',cost:2,price:34,ticks:3,type:'weapon'},
  leatherShirt:{name:'Leather Shirt',icon:'🥋',worker:'leatherworker',material:'leather',cost:2,price:30,ticks:3,type:'armour'},
  healingPotion:{name:'Healing Potion',icon:'🧪',worker:'alchemist',material:'herbs',cost:2,price:25,ticks:2,type:'potion'},
  quarterstaff:{name:'Quarterstaff',icon:'🪄',worker:'carpenter',material:'wood',cost:2,price:28,ticks:3,type:'weapon'},
}
export const workers: Record<WorkerId,{name:string;icon:string;product:ProductId;wage:number;color:string}> = {
 blacksmith:{name:'Blacksmith',icon:'⚒',product:'shortsword',wage:12,color:'#bd6448'},
 leatherworker:{name:'Leatherworker',icon:'✂',product:'leatherShirt',wage:10,color:'#c69250'},
 alchemist:{name:'Alchemist',icon:'⚗',product:'healingPotion',wage:11,color:'#735c9d'},
 carpenter:{name:'Carpenter',icon:'▰',product:'quarterstaff',wage:9,color:'#648a54'},
}
export type Customer = {name:string;role:string;icon:string;likes:string[];request:ProductId;patience:number;offer:number;state:'entering'|'waiting'|'served'|'left'}
export const customerDeck: Omit<Customer,'state'>[] = [
 {name:'Mara',role:'Trail Warden',icon:'🧝',likes:['weapon','potion'],request:'shortsword',patience:3,offer:38},
 {name:'Brother Fen',role:'Village Healer',icon:'🧙',likes:['potion','weapon'],request:'healingPotion',patience:4,offer:28},
 {name:'Tilda',role:'Road Scout',icon:'🥷',likes:['armour','potion'],request:'leatherShirt',patience:3,offer:33},
 {name:'Old Brann',role:'Hedge Mage',icon:'🧔',likes:['weapon','potion'],request:'quarterstaff',patience:2,offer:31},
]
export type Save = {day:number;phase:Phase;coins:number;materials:Record<MaterialId,number>;inventory:Record<ProductId,number>;hired:WorkerId[];jobs:Partial<Record<WorkerId,{product:ProductId;progress:number}>>;customerIndex:number;served:number;sales:number;revenue:number;upgraded:boolean;tutorial:number}
export const freshSave=():Save=>({day:1,phase:'prep',coins:120,materials:{iron:6,leather:6,herbs:6,wood:6},inventory:{shortsword:0,leatherShirt:0,healingPotion:0,quarterstaff:0},hired:['blacksmith'],jobs:{},customerIndex:0,served:0,sales:0,revenue:0,upgraded:false,tutorial:0})
export const loadSave=():Save=>{try{return {...freshSave(),...JSON.parse(localStorage.getItem('magic-and-steel-save')||'')}}catch{return freshSave()}}
export const saveGame=(s:Save)=>localStorage.setItem('magic-and-steel-save',JSON.stringify(s))
export const askPrice=(c:Customer,p:ProductId)=>Math.round(products[p].price*(c.likes.includes(products[p].type)?1.08:.72))
