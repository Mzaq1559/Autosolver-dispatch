const API_BASE = 'http://localhost:8000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }
  
  return response.json();
}

export const api = {
  getDrivers: () => fetchApi('/drivers'),
  getOrders: () => fetchApi('/orders'),
  getRestaurants: () => fetchApi('/restaurants'),
  getCustomers: () => fetchApi('/customers'),
  createOrder: (data: any) => fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  assignDriver: (orderId: number, driverId: number) => fetchApi(`/orders/${orderId}/assign?driver_id=${driverId}`, {
    method: 'PUT'
  }),
};
