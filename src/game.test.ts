import { beforeEach, describe, expect, it } from 'vitest'
import { craftableProducts, craftTicks, customerTemplates, freshSave, loadSave, makeCustomer, offerFit, priceFor, products, recipesFor, saveGame } from './game'

describe('continuous shop simulation', () => {
  beforeEach(() => localStorage.clear())

  it('creates a viable persistent shop with placeable workbenches', () => {
    const save = freshSave()
    expect(save.hired).toHaveLength(2)
    expect(save.placedBenches.blacksmith).toBe(6)
    expect(save.placedBenches.alchemist).toBe(23)
    expect(save.shopkeeperSlot).toBe(16)
    save.furnitureFacing.shelf = 1
    saveGame(save)
    expect(loadSave().version).toBe(19)
    expect(loadSave().discoveredRecipes).toEqual(expect.arrayContaining(['shortsword', 'healingPotion']))
    expect(loadSave().displays.shelf.slot).toBe(12)
    expect(loadSave().ownedDisplays.shelf).toBe(true)
    expect(loadSave().ownedDisplays.weaponRack).toBe(false)
    expect(loadSave().furnitureFacing.shelf).toBe(1)
    expect(loadSave().speed).toBe(1)
    expect(loadSave().autoPause).toBe(true)
  })

  it('migrates existing saves to placed workbenches', () => {
    const oldSave = { ...freshSave(), version: 2 }
    delete (oldSave as Partial<typeof oldSave>).placedBenches
    localStorage.setItem('magic-and-steel-save', JSON.stringify(oldSave))
    const migrated = loadSave()
    expect(migrated.version).toBe(19)
    expect(migrated.discoveredRecipes).toContain('shortsword')
    expect(migrated.placedBenches.blacksmith).not.toBeNull()
    expect(migrated.shopkeeperSlot).not.toBeNull()
  })

  it('persists speed and automatic-pause preferences', () => {
    const save = freshSave()
    save.speed = 2
    save.autoPause = false
    saveGame(save)
    expect(loadSave().speed).toBe(2)
    expect(loadSave().autoPause).toBe(false)
  })

  it('migrates displayed merchandise to counted display stock', () => {
    const oldSave = { ...freshSave(), version: 12 as const }
    oldSave.displays.shelf = { slot: 12, product: 'shortsword', quantity: 0 }
    localStorage.setItem('magic-and-steel-save', JSON.stringify(oldSave))
    expect(loadSave().displays.shelf.quantity).toBe(1)
  })

  it('restores a required sales counter and remembers discovered visitors', () => {
    const oldSave = { ...freshSave(), version: 13 as const, shopkeeperSlot: null, discoveredCustomers: ['warden'] as const }
    localStorage.setItem('magic-and-steel-save', JSON.stringify(oldSave))
    const migrated = loadSave()
    expect(migrated.shopkeeperSlot).not.toBeNull()
    expect(migrated.discoveredCustomers).toContain('warden')
  })

  it('migrates sixth-column furniture into the 5 by 5 grid', () => {
    const oldSave = { ...freshSave(), version: 7, shopkeeperSlot: 29 }
    localStorage.setItem('magic-and-steel-save', JSON.stringify(oldSave))
    expect(loadSave().shopkeeperSlot).toBeLessThan(25)
  })

  it('rewards matching customer requests', () => {
    const customer = makeCustomer(0, 1)
    expect(priceFor(customer, 'shortsword')).toBeGreaterThan(priceFor(customer, 'leatherShirt'))
  })

  it('alternates exact-item and category requests using recipes the shop can craft', () => {
    const save = freshSave()
    const available = craftableProducts(save)
    expect(available).toEqual(['shortsword', 'healingPotion'])
    const exactRequest = makeCustomer(0, 1, available)
    const categoryRequest = makeCustomer(1, 2, available)
    expect(available).toContain(exactRequest.requestedProduct)
    expect(categoryRequest.requestedProduct).toBeUndefined()
    expect(available.map(product => products[product].category)).toContain(categoryRequest.request)
  })

  it('initializes and migrates daily report counters', () => {
    const save=freshSave()
    expect(save.dailyProductSales.shortsword).toBe(0)
    expect(save.missedRequests).toBe(0)
    expect(save.displaySales).toBe(0)
    saveGame(save)
    expect(loadSave().wagesPaid).toBe(0)
    expect(loadSave().deliveryPaid).toBe(0)
  })

  it('lets displayed merchandise guide browsing and requests', () => {
    const visitor = makeCustomer(0, 1, ['shortsword', 'healingPotion'], ['shortsword'])
    expect(visitor.browseTicks).toBe(2)
    expect(visitor.browsingProduct).toBe('shortsword')
    expect(visitor.requestedProduct).toBe('shortsword')
  })

  it('requires exact products unless an alternative is suggested', () => {
    const customer=makeCustomer(0,1,['shortsword','healingPotion'])
    expect(customer.requestedProduct).toBeDefined()
    expect(offerFit(customer,customer.requestedProduct!)).toBe('exact')
    const wrong=customer.requestedProduct==='shortsword'?'healingPotion':'shortsword'
    expect(offerFit(customer,wrong)).toBe('wrongItem')
    expect(['alternative','wrongCategory']).toContain(offerFit(customer,wrong,true))
  })

  it('rejects category products that are too advanced or too basic', () => {
    const novice={...makeCustomer(2,2,['healingPotion']),requestedProduct:undefined,request:'potion' as const,level:1}
    expect(offerFit(novice,'emberCordial')).toBe('tooHigh')
    const veteran={...novice,level:3}
    expect(offerFit(veteran,'healingPotion')).toBe('tooLow')
    expect(offerFit(veteran,'focusTonic')).toBe('category')
  })

  it('only generates category requests the current catalogue can satisfy', () => {
    const earlyPaladin=makeCustomer(5,6,['shortsword','healingPotion'])
    expect(earlyPaladin.requestedProduct).toBeUndefined()
    expect(earlyPaladin.level).toBe(2)
    const matching=(['shortsword','healingPotion'] as const).find(product=>products[product].category===earlyPaladin.request)
    expect(matching).toBeDefined()
    expect(offerFit(earlyPaladin,matching!)).toBe('category')
  })

  it('includes the complete illustrated adventurer and supplier cast', () => {
    expect(customerTemplates.map(customer => customer.sprite)).toEqual([
      'warden', 'ranger', 'cleric', 'wizard', 'knight', 'paladin', 'druid', 'trader', 'woodcutter', 'herbalist',
    ])
    expect(customerTemplates.filter(customer => customer.kind === 'supplier')).toHaveLength(3)
  })

  it('unlocks recipes through worker levels', () => {
    expect(recipesFor('blacksmith', 1)).toEqual(['shortsword'])
    expect(recipesFor('blacksmith', 2)).toContain('handaxe')
    expect(recipesFor('blacksmith', 2)).toContain('ironBuckler')
    expect(recipesFor('blacksmith', 3)).toContain('hearthSpear')
    expect(Object.keys(products)).toHaveLength(16)
  })

  it('makes mastered recipes faster without dropping below two ticks', () => {
    expect(craftTicks('shortsword', 0)).toBe(4)
    expect(craftTicks('shortsword', 5)).toBe(3)
    expect(craftTicks('shortsword', 50)).toBe(2)
  })
})
