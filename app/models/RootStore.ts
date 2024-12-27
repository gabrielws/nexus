import type { Instance, SnapshotOut } from 'mobx-state-tree'
import { types } from 'mobx-state-tree'
import { LocationStoreModel } from './LocationStore'

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model('RootStore').props({
  locationStore: types.optional(LocationStoreModel, {}),
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
