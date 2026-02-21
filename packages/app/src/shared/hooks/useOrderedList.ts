import { createContext, useCallback, useContext, useMemo } from 'react'

/**
 * Constraint for items managed by useOrderedList.
 * Items must have a unique `id` and an `order` for sorting.
 */
interface OrderedItem {
  id: string
  order: number
}

interface OrderedListActions<T extends OrderedItem> {
  /** Sorted items by order. */
  items: T[]
  /** Add an item to the end of the list. */
  add: (item: T) => void
  /** Remove an item by id. */
  remove: (id: string) => void
  /** Update a single item by id (full replacement). */
  update: (id: string, updated: T) => void
  /** Reorder by moving item from one index to another (sorted-index based). */
  reorder: (fromIndex: number, toIndex: number) => void
}

/**
 * Generic hook for managing an ordered list of items.
 * Handles sorting, add, remove, update, and drag-reorder.
 * Delegates persistence to the provided `onChange` callback.
 */
export function useOrderedList<T extends OrderedItem>(
  items: T[],
  onChange: (items: T[]) => void,
): OrderedListActions<T> {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items],
  )

  const add = useCallback((item: T) => {
    onChange([...items, item])
  }, [items, onChange])

  const remove = useCallback((id: string) => {
    onChange(items.filter(item => item.id !== id))
  }, [items, onChange])

  const update = useCallback((id: string, updated: T) => {
    onChange(items.map(item => item.id === id ? updated : item))
  }, [items, onChange])

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    // Reassign order values based on new positions
    onChange(reordered.map((item, i) => ({ ...item, order: i })))
  }, [sorted, onChange])

  return { items: sorted, add, remove, update, reorder }
}

// --- Context for child access ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const OrderedListContext = createContext<OrderedListActions<any> | null>(null)

/** Access the ordered list actions from a parent OrderedListProvider. */
export function useOrderedListContext<T extends OrderedItem>(): OrderedListActions<T> {
  const ctx = useContext(OrderedListContext)
  if (!ctx) throw new Error('useOrderedListContext must be used within an OrderedListProvider')
  return ctx as OrderedListActions<T>
}
