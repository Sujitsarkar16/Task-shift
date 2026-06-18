"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Plus, Filter, MoreHorizontal, Trash2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority,
          deadline: new Date(),
          isCompleted: false
        })
      });
      if (res.ok) {
        setNewTaskTitle("");
        setShowAddForm(false);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-light-red/20 text-light-red";
      case "medium": return "bg-yellow-400/20 text-yellow-600";
      case "low": return "bg-green-400/20 text-green-700";
      default: return "bg-foreground/10 text-foreground";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Tasks</h1>
            <p className="text-foreground/60 text-lg">Manage and prioritize your work.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border-2 border-foreground/10 rounded-lg font-medium hover:bg-foreground/5 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </motion.div>

        {showAddForm && (
          <motion.form variants={itemVariants} onSubmit={handleAddTask} className="mb-6 bg-white p-6 rounded-xl border-2 border-purple">
            <h3 className="font-bold mb-4">New Task</h3>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?" 
                className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                autoFocus
              />
              <select 
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button type="submit" className="px-6 py-2 bg-purple text-white rounded-lg font-bold">Save</button>
            </div>
          </motion.form>
        )}
        
        <motion.div variants={itemVariants} className="bg-white rounded-xl border-2 border-foreground/10 p-2">
          {loading ? (
            <div className="p-8 text-center text-foreground/50 font-bold">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-foreground/50 font-bold">No tasks yet. Create one!</div>
          ) : (
            <div className="space-y-1">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-[#faf9f8] cursor-pointer transition-colors border-2 border-transparent hover:border-foreground/5 group">
                  <div className="flex items-center gap-4" onClick={() => toggleTask(t.id, t.isCompleted)}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${t.isCompleted ? 'bg-purple border-purple' : 'border-foreground/30 group-hover:border-purple group-hover:bg-purple-soft/50'}`}>
                      <CheckCircle2 className={`w-4 h-4 text-white ${t.isCompleted ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                    </div>
                    <p className={`font-medium ${t.isCompleted ? 'line-through text-foreground/40' : ''}`}>{t.title}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                    <button onClick={() => deleteTask(t.id)} className="text-foreground/30 hover:text-light-red opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
