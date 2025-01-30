/**
 * If you include this in your model in an action() block just under your props,
 * it'll allow you to set property values directly while retaining type safety
 * and also is executed in an action. This is useful because often you find yourself
 * making a lot of repetitive setter actions that only update one prop.
 *
 * E.g.:
 *
 *  const UserModel = types.model("User")
 *    .props({
 *      name: types.string,
 *      age: types.number
 *    })
 *    .actions(withSetPropAction)
 *
 *   const user = UserModel.create({ name: "Jamon", age: 40 })
 *
 *   user.setProp("name", "John") // no type error
 *   user.setProp("age", 30)      // no type error
 *   user.setProp("age", "30")    // type error -- must be number
 */
export const withSetPropAction = (self: any) => ({
  setProp<K extends keyof typeof self>(key: K, value: (typeof self)[K]) {
    if (key === "realtimeChannel") return // Ignora tentativas de modificar realtimeChannel
    self[key] = value
  },
})
