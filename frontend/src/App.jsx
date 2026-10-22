import { useCallback, useEffect, useMemo, useState } from 'react';
import { taskService } from './services/taskService';
import './index.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pending'
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await taskService.getAll();
      setTasks(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    progress: tasks.filter((task) => task.status === 'in_progress').length,
    completed: tasks.filter((task) => task.status === 'completed').length
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEditForm(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status
    });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status
      };

      if (editingId !== null) {
        await taskService.update(editingId, payload);
      } else {
        await taskService.create(payload);
      }

      closeForm();
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    setError('');

    try {
      await taskService.delete(task.id);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(task, status) {
    setError('');

    try {
      await taskService.update(task.id, { status });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatStatus(status) {
    return status.replace('_', ' ');
  }

  function formatDate(date) {
    if (!date) return 'Recently created';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-icon">C</span>
          <span>CloudOps<span className="brand-dot">.</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-item active" href="#dashboard">
            <span>▦</span> Dashboard
          </a>

          <button
            className={`nav-item ${filter === 'all' ? '' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>☷</span> All tasks
          </button>

          <button
            className="nav-item"
            onClick={() => setFilter('in_progress')}
          >
            <span>◷</span> In progress
          </button>

          <button
            className="nav-item"
            onClick={() => setFilter('completed')}
          >
            <span>✓</span> Completed
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="online-dot" />
            API connection
            <span className="online-label">LOCAL</span>
          </div>

          <div className="profile">
            <div className="avatar">YW</div>
            <div className="profile-info">
              <strong>Workspace Admin</strong>
              <span>CloudOps project</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="topbar-right">
            <span className="environment">
              <span className="online-dot" /> LOCAL ENVIRONMENT
            </span>
            <div className="avatar small-avatar">YW</div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">OVERVIEW</div>
              <h1>Task dashboard</h1>
              <p>Manage your work and track project progress.</p>
            </div>

            <button className="primary-button" onClick={openCreateForm}>
              <span>＋</span> Create task
            </button>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}

          <section className="stats-grid">
            <StatCard
              label="Total tasks"
              value={stats.total}
              icon="▤"
              description="All tasks in workspace"
              color="purple"
            />

            <StatCard
              label="Pending"
              value={stats.pending}
              icon="◷"
              description="Waiting to be started"
              color="orange"
            />

            <StatCard
              label="In progress"
              value={stats.progress}
              icon="↗"
              description="Currently being worked on"
              color="blue"
            />

            <StatCard
              label="Completed"
              value={stats.completed}
              icon="✓"
              description="Successfully finished"
              color="green"
            />
          </section>

          <section className="tasks-panel">
            <div className="panel-heading">
              <div>
                <h2>Tasks</h2>
                <p>Your project tasks and their current status.</p>
              </div>

              <button className="refresh-button" onClick={loadTasks}>
                ↻ Refresh
              </button>
            </div>

            <div className="filter-bar">
              {[
                ['all', 'All tasks'],
                ['pending', 'Pending'],
                ['in_progress', 'In progress'],
                ['completed', 'Completed']
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`filter-button ${filter === value ? 'selected' : ''}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  {value === 'all' && (
                    <span className="filter-count">{tasks.length}</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="loader" />
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>No tasks found</h3>
                <p>Create a task to get your project moving.</p>
                <button className="primary-button" onClick={openCreateForm}>
                  ＋ Create your first task
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>TASK</th>
                      <th>STATUS</th>
                      <th>CREATED</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <div className="task-name">
                            <span className={`task-marker ${task.status}`} />
                            <div>
                              <strong>{task.title}</strong>
                              <p>{task.description || 'No description provided'}</p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <select
                            className={`status-select ${task.status}`}
                            value={task.status}
                            onChange={(event) =>
                              handleStatusChange(task, event.target.value)
                            }
                            aria-label={`Status for ${task.title}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>

                        <td className="date-cell">
                          {formatDate(task.created_at)}
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-button"
                              onClick={() => openEditForm(task)}
                              aria-label={`Edit ${task.title}`}
                              title="Edit task"
                            >
                              ✎
                            </button>

                            <button
                              className="icon-button delete-button"
                              onClick={() => handleDelete(task)}
                              aria-label={`Delete ${task.title}`}
                              title="Delete task"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="panel-footer">
              <span>
                Showing <strong>{filteredTasks.length}</strong> of{' '}
                <strong>{tasks.length}</strong> tasks
              </span>
              <span className="footer-indicator">
                <span className="online-dot" /> Synced with API
              </span>
            </div>
          </section>

          <footer className="page-footer">
            <span>CloudOps Task Manager</span>
            <span>Development environment · v1.0.0</span>
          </footer>
        </section>
      </main>

      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-heading">
              <div>
                <div className="eyebrow">
                  {editingId !== null ? 'UPDATE TASK' : 'NEW TASK'}
                </div>

                <h2 id="form-title">
                  {editingId !== null ? 'Edit task' : 'Create a task'}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="title">Task title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Deploy application to AWS"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                maxLength={255}
                required
                autoFocus
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Describe what needs to be done..."
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />

              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId !== null
                      ? 'Save changes'
                      : 'Create task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, description, color }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${color}`}>{icon}</span>
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-description">{description}</div>
    </article>
  );
}

export default App;