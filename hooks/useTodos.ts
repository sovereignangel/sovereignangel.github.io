'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodos, saveTodo, deleteTodo } from '@/lib/firestore'
import type { Todo, TodoQuadrant } from '@/lib/types'

export function useTodos(uid: string | undefined) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      // Fetch all todos (open + completed) — filter in JS
      const data = await getTodos(uid, 'all')
      setTodos(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<Todo>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const todoId = await saveTodo(uid, data, id)
    await refresh()
    return todoId
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteTodo(uid, id)
    await refresh()
  }, [uid, refresh])

  const toggleComplete = useCallback(async (todo: Todo) => {
    if (!uid || !todo.id) return
    const newStatus = todo.status === 'open' ? 'completed' : 'open'
    const todayKey = new Date().toISOString().split('T')[0]
    await saveTodo(uid, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? todayKey : undefined,
    }, todo.id)
    await refresh()
  }, [uid, refresh])

  // Show open todos + today's completed (so you see what you knocked out)
  const todayKey = new Date().toISOString().split('T')[0]
  const openTodos = todos.filter(t => t.status === 'open')
  const completedToday = todos.filter(t => t.status === 'completed' && t.completedAt === todayKey)
  const activeTodos = [...openTodos, ...completedToday]

  const byQuadrant: Record<TodoQuadrant, Todo[]> = {
    do_first: activeTodos.filter(t => t.quadrant === 'do_first'),
    schedule: activeTodos.filter(t => t.quadrant === 'schedule'),
    delegate: activeTodos.filter(t => t.quadrant === 'delegate'),
    eliminate: activeTodos.filter(t => t.quadrant === 'eliminate'),
  }

  const completedCount = completedToday.length
  const openCount = openTodos.length

  return { todos: activeTodos, loading, save, remove, toggleComplete, refresh, byQuadrant, completedCount, openCount }
}
