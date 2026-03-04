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
      const data = await getTodos(uid, 'open')
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

  const byQuadrant: Record<TodoQuadrant, Todo[]> = {
    do_first: todos.filter(t => t.quadrant === 'do_first'),
    schedule: todos.filter(t => t.quadrant === 'schedule'),
    delegate: todos.filter(t => t.quadrant === 'delegate'),
    eliminate: todos.filter(t => t.quadrant === 'eliminate'),
  }

  return { todos, loading, save, remove, toggleComplete, refresh, byQuadrant }
}
