"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Send, X, BarChart2, Activity, Lightbulb } from 'lucide-react';

interface Sticky { id: number; text: string; color: string; }
interface Action { id: number; date: string; text: string; }
interface Metric { id: number; label: string; value: string; }

interface Project {
  id: number;
  title: string;
  isOpen: boolean;
  stickies: Sticky[];
  actions: Action[];
  metrics: Metric[];
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [newAction, setNewAction] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem("my-projects-v3");
    if (saved) setProjects(JSON.parse(saved));
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated) localStorage.setItem("my-projects-v3", JSON.stringify(projects));
  }, [projects, hasHydrated]);

  const addProject = () => {
    const newProj: Project = {
      id: Date.now(),
      title: "NAME YOUR PROJECT",
      isOpen: true,
      stickies: [],
      actions: [],
      metrics: []
    };
    setProjects([newProj, ...projects]);
  };

  const addAction = (projectId: number) => {
    const text = newAction[projectId];
    if (!text) return;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setProjects(projects.map(p => p.id === projectId ? { ...p, actions: [{ id: Date.now(), date, text }, ...p.actions] } : p));
    setNewAction({ ...newAction, [projectId]: "" });
  };

  const addMetric = (projectId: number) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, metrics: [...p.metrics, { id: Date.now(), label: "Metric", value: "0" }] } : p));
  };

  if (!hasHydrated) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground">
          <span className="text-amber-500">Project Launchpad</span>
        </h1>
        <button 
          onClick={addProject} 
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 dark:shadow-none"
        >
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>

      <div className="space-y-6">
        {projects.map(project => (
          <div key={project.id} className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden transition-all">
            {/* PROJECT BAR */}
            <div className={`flex items-center p-2 transition-colors ${project.isOpen ? 'bg-muted/50' : 'bg-card'}`}>
              <input 
                value={project.title}
                onChange={(e) => setProjects(projects.map(p => p.id === project.id ? { ...p, title: e.target.value.toUpperCase() } : p))}
                className="flex-1 p-3 bg-transparent font-black uppercase italic tracking-widest text-lg outline-none text-foreground focus:text-amber-500"
              />
              <div className="flex items-center gap-2 pr-2">
                <button 
                  onClick={() => setProjects(projects.filter(p => p.id !== project.id))}
                  className="p-2 text-muted-foreground/60 hover:text-red-400 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setProjects(projects.map(p => p.id === project.id ? { ...p, isOpen: !p.isOpen } : p))}
                  className={`p-3 rounded-lg transition-all ${project.isOpen ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                  title={project.isOpen ? "Collapse Project" : "Expand Project"}
                >
                  {project.isOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
            </div>

            {project.isOpen && (
              <div className="p-8 space-y-10 border-t border-border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  
                  {/* IDEAS SECTION (AMBER ACCENT) */}
                  <section>
                    <div className="flex justify-between items-center mb-6 border-b-2 border-amber-500/20 pb-2">
                      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                        <Lightbulb className="w-3 h-3" /> Idea Bank
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {project.stickies.map(s => (
                        <div 
                          key={s.id} 
                          className="bg-amber-50 dark:bg-amber-950/30 p-4 aspect-square rounded-lg border border-amber-200/80 dark:border-amber-800/40 relative group transition-all hover:shadow-md hover:-translate-y-1"
                        >
                          {/* REMOVE BUTTON (Visible on hover) */}
                          <button 
                            onClick={() => setProjects(projects.map(p => 
                              p.id === project.id 
                                ? { ...p, stickies: p.stickies.filter(st => st.id !== s.id) } 
                                : p
                            ))}
                            className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 text-amber-400 hover:text-red-500 transition-all"
                            title="Remove Note"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          <textarea 
                            className="bg-transparent border-none resize-none text-sm font-medium w-full h-full outline-none text-amber-950 dark:text-amber-100 placeholder:text-amber-600/70 dark:placeholder:text-amber-400/50"
                            placeholder="New idea..."
                            value={s.text}
                            onChange={(e) => setProjects(projects.map(p => 
                              p.id === project.id 
                                ? { ...p, stickies: p.stickies.map(st => st.id === s.id ? { ...st, text: e.target.value } : st) } 
                                : p
                            ))}
                          />
                        </div>
                      ))}

                      <button 
                        onClick={() => setProjects(projects.map(p => 
                          p.id === project.id 
                            ? { ...p, stickies: [...p.stickies, { id: Date.now(), text: "", color: 'bg-amber-50' }] } 
                            : p
                        ))}
                        className="border-2 border-dashed border-amber-200 dark:border-amber-900/40 aspect-square rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-500 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </section>

                  {/* ACTION LOG (PURPLE ACCENT) */}
                  <section>
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 mb-6">
                      <Activity className="w-3 h-3" /> Action Log
                    </h3>
                    <div className="flex gap-2 mb-6">
                      <input 
                        className="flex-1 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-foreground placeholder:text-muted-foreground rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 ring-purple-400/50 dark:ring-purple-700/50"
                        placeholder="Log new action..."
                        value={newAction[project.id] || ""}
                        onChange={(e) => setNewAction({ ...newAction, [project.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addAction(project.id)}
                      />
                      <button onClick={() => addAction(project.id)} className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg shadow-md shadow-purple-500/20 dark:shadow-none">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {project.actions.map(action => (
                        <div key={action.id} className="flex gap-4 items-start group">
                          <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase mt-1">{action.date}</span>
                          <p className="text-sm font-semibold text-foreground/90">{action.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* METRICS TRACKER (BLUE ACCENT - Intentional Brand Preserved) */}
                <section className="bg-blue-600 rounded-xl p-8 text-white shadow-xl shadow-blue-500/20 dark:shadow-none">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">
                      <BarChart2 className="w-3 h-3" /> Metrics Tracker
                    </h3>
                    <button onClick={() => addMetric(project.id)} className="text-[9px] font-black uppercase bg-blue-400/30 border border-blue-300/50 px-4 py-1.5 rounded-full hover:bg-white hover:text-blue-600 transition-all">
                      + Add Metric
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {project.metrics.map(metric => (
                      <div key={metric.id} className="space-y-1 group">
                        <input 
                          className="bg-transparent text-[10px] font-black uppercase tracking-widest text-blue-200 outline-none w-full border-b border-transparent focus:border-blue-300"
                          value={metric.label}
                          onChange={(e) => setProjects(projects.map(p => p.id === project.id ? { ...p, metrics: p.metrics.map(m => m.id === metric.id ? { ...m, label: e.target.value } : m) } : p))}
                        />
                        <input 
                          className="bg-transparent text-3xl font-black italic outline-none w-full text-white"
                          value={metric.value}
                          onChange={(e) => setProjects(projects.map(p => p.id === project.id ? { ...p, metrics: p.metrics.map(m => m.id === metric.id ? { ...m, value: e.target.value } : m) } : p))}
                        />
                      </div>
                    ))}
                    {project.metrics.length === 0 && (
                      <p className="col-span-full text-blue-200 text-xs italic opacity-60 text-center py-4">No metrics tracked yet.</p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
