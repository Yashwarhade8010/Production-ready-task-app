const API_URL = '/api/tasks';

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Something went wrong');
  }

  return result;
}

export const taskService = {
  getAll: () => request(API_URL),

  getById: (id) => request(`${API_URL}/${id}`),

  create: (task) =>
    request(API_URL, {
      method: 'POST',
      body: JSON.stringify(task)
    }),

  update: (id, task) =>
    request(`${API_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(task)
    }),

  delete: (id) =>
    request(`${API_URL}/${id}`, {
      method: 'DELETE'
    })
};