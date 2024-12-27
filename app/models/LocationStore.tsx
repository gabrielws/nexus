import type { Instance } from 'mobx-state-tree'
import { types } from 'mobx-state-tree'

export const LocationStoreModel = types
  .model('LocationStore')
  .props({
    hasLocationPermission: types.optional(types.boolean, false),
  })
  .actions(self => ({
    setLocationPermission(value: boolean) {
      self.hasLocationPermission = value
    },
  }))

export interface LocationStore extends Instance<typeof LocationStoreModel> {}
