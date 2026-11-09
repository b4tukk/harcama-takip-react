export const initialState = { transactions: [], budgets: {}, theme: 'system', lastDeleted: null }

const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { ...state, transactions: [{ id: newId(), createdAt: Date.now(), ...action.payload }, ...state.transactions] }
    case 'UPDATE':
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, ...action.payload } : t)) }
    case 'DELETE': {
      const target = state.transactions.find((t) => t.id === action.id)
      if (!target) return state
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id), lastDeleted: target }
    }
    case 'UNDO_DELETE':
      return state.lastDeleted ? { ...state, transactions: [state.lastDeleted, ...state.transactions], lastDeleted: null } : state
    case 'CLEAR_UNDO':
      return { ...state, lastDeleted: null }
    case 'SET_BUDGET': {
      const budgets = { ...state.budgets }
      if (!(action.limit > 0)) delete budgets[action.category]
      else budgets[action.category] = action.limit
      return { ...state, budgets }
    }
    case 'IMPORT': {
      const added = action.transactions.map((t) => ({ id: newId(), createdAt: Date.now(), ...t }))
      return { ...state, transactions: action.replace ? added : [...added, ...state.transactions] }
    }
    case 'LOAD_SAMPLE':
      return { ...state, transactions: action.transactions.map((t) => ({ id: newId(), createdAt: Date.now(), ...t })), budgets: action.budgets }
    case 'RESET':
      return { ...initialState, theme: state.theme }
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    default:
      return state
  }
}
