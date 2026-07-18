import { beforeEach, describe, expect, it } from 'vitest'
import { craftableProducts, customerTemplates, freshSave, loadSave, makeCustomer, priceFor, products, recipesFor, saveGame } from './game'

describe('continuous shop simulation', () => {
  beforeEach(() => localStorage.clear())

  it('creates a viable persistent shop with placeable workbenches', () => {
    const save = freshSave()
    expect(save.hired).toHaveLength(2)
    expect(save.placedBenches.blacksmith).toBe(6)
    expect(save.placedBenches.alchemist).toBe(23)
    expect(save.shopkeeperSlot).toBe(16)
    saveGame(save)
    expect(loadSave().version).toBe(10)
    expect(loadSave().displays.shelf.slot).toBe(12)
    expect(loadSave().speed).toBe(1)
    expect(loadSave().autoPause).toBe(true)
  })

  it('migrates existing saves to placed workbenches', () => {
    const oldSave = { ...freshSave(), version: 2 }
    delete (oldSave as Partial<typeof oldSave>).placedBenches
    localStorage.setItem('magic-and-steel-save', JSON.stringify(oldSave))
    const migrated = loadSave()
    expect(migrated.version).toBe(10)
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
})
