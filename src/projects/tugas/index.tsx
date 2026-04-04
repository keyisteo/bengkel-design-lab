import { useState, useEffect } from 'react'
import './tugas.css'
import { HomePage } from './pages/HomePage'
import { AddTaskPage } from './pages/AddTaskPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { StatsPage } from './pages/StatsPage'
import { TASKS, type Task } from './data/tasks'

interface TugasAppProps {
  screen?: string
  onScreenChange?: (screen: string) => void
}

export function TugasApp({ screen: externalScreen, onScreenChange }: TugasAppProps) {
  const [screen, setScreen] = useState(externalScreen ?? 'tugas-home')
  const [tasks, setTasks] = useState<Task[]>(TASKS)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    if (!externalScreen || externalScreen === screen) return
    setScreen(externalScreen)
    if (!selectedTask && externalScreen === 'tugas-detail') {
      setSelectedTask(tasks[0])
    }
  }, [externalScreen]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (s: string) => {
    setScreen(s)
    onScreenChange?.(s)
  }

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  const handleAddTask = (data: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: `t${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setTasks((prev) => [newTask, ...prev])
    go('tugas-home')
  }

  const handleDeleteTask = () => {
    if (!selectedTask) return
    setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id))
    setSelectedTask(null)
    go('tugas-home')
  }

  return (
    <div className="tugas w-full h-full">
      {screen === 'tugas-home' && (
        <HomePage
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onSelectTask={(task) => {
            setSelectedTask(task)
            go('tugas-detail')
          }}
          onNavigate={go}
        />
      )}

      {screen === 'tugas-add' && (
        <AddTaskPage
          onAdd={handleAddTask}
          onBack={() => go('tugas-home')}
        />
      )}

      {screen === 'tugas-detail' && selectedTask && (
        <TaskDetailPage
          task={selectedTask}
          onBack={() => go('tugas-home')}
          onToggle={() => {
            handleToggleTask(selectedTask.id)
            setSelectedTask((prev) => prev ? { ...prev, completed: !prev.completed } : null)
          }}
          onDelete={handleDeleteTask}
        />
      )}

      {screen === 'tugas-stats' && (
        <StatsPage
          tasks={tasks}
          onBack={() => go('tugas-home')}
          onNavigate={go}
        />
      )}
    </div>
  )
}
