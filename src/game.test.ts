import {describe,it,expect,beforeEach} from 'vitest'
import {askPrice,customerDeck,freshSave,products,saveGame,loadSave} from './game'
describe('Magic and Steel economy',()=>{
 beforeEach(()=>localStorage.clear())
 it('starts with a viable first day',()=>{const s=freshSave();expect(s.coins).toBeGreaterThan(100);expect(s.materials.iron).toBeGreaterThanOrEqual(products.shortsword.cost)})
 it('prices preferred goods above mismatches',()=>{const c={...customerDeck[0],state:'waiting' as const};expect(askPrice(c,'shortsword')).toBeGreaterThan(askPrice(c,'leatherShirt'))})
 it('round-trips a local save',()=>{const s=freshSave();s.coins=77;saveGame(s);expect(loadSave().coins).toBe(77)})
})
