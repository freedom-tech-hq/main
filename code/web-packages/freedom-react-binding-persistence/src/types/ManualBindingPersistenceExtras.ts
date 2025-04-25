export interface ManualBindingPersistenceExtras {
  /** Pulls from storage and then listens for storage and binding changes and syncs between the two.  Returns a function to detach. */
  attach: () => () => void;
  /** Deletes the value from storage */
  deleteFromStorage: () => void;
  /** Updates the binding using the value from storage, if it's valid.  Useful if running detached */
  pullFromStorage: () => void;
  /** Updates the storage using the value from the binding.  Useful if running detached */
  pushToStorage: () => void;
}
