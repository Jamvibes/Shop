import { beforeEach, describe, expect, it } from 'vitest'
import { freshSave, loadSave, makeCustomer, priceFor, recipesFor, saveGame } from './game'

describe('continuous shop simulation', () => {
  beforeEach(() => localStorage.clear())

  it('creates a viable persistent shop with placeable workbenches', () => {
    const save = freshSave()
    expect(save.hired).toHaveLength(2)
    expect(save.placedBenches.blacksmith).toBe(6)
    expect(save.placedBenches.alchemist).toBe(23)
    saveGame(save)
    expect(loadSave().version).toBe(4)
  })

  it('migrates existing saves to placed workbenches', () => {
    const oldSave = { ...freshSave(), version: 2 }
    delete (oldSave as Partial<typeof oldSave>).placedBenches
    localStorage.setItem('magic-and-steel-save', JSON.stringify(oldSave))
    const migrated = loadSave()
    expect(migrated.version).toBe(4)
    expect(migrated.placedBenches.blacksmith).not.toBeNull()
  })

  it('rewards matching customer requests', () => {
    const customer = makeCustomer(0, 1)
    expect(priceFor(customer, 'shortsword')).toBeGreaterThan(priceFor(customer, 'leatherShirt'))
  })

  it('unlocks recipes through worker levels', () => {
    expect(recipesFor('blacksmith', 1)).toEqual(['shortsword'])
    expect(recipesFor('blacksmith', 2)).toContain('handaxe')
  })
})
