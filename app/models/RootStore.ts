import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { UserStoreModel } from "./UserStore"
import { ProblemStoreModel } from "./ProblemStore"
import { CommentStoreModel } from "./CommentStore"
import { UpvoteStoreModel } from "./UpvoteStore"

/**
/**
 * A RootStore model.
 */
export const RootStoreModel = types
  .model("RootStore")
  .props({
    userStore: types.optional(UserStoreModel, {}),
    problemStore: types.optional(ProblemStoreModel, {
      problems: [],
      statusFilter: "all",
      isLoading: false,
      errorMessage: undefined,
    }),
    commentStore: types.optional(CommentStoreModel, {}),
    upvoteStore: types.optional(UpvoteStoreModel, {}),
  })
  .actions(() => ({
    afterCreate() {
      // Log para debug
      if (__DEV__) {
        console.log("✅ RootStore criado com sucesso")
      }
    },
  }))

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
