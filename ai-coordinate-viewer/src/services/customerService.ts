// Customer Service - Handles CRUD operations for customers
// Connected to backend API

export interface CustomerMember {
  id: number;
  customerId: number;
  name: string;
  emailPrefix: string | null;
  title: string | null;
  tel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  orderId: string;
  orderNumber: string;
  projectSlug: string;
  layoutId: string;
  masterFileName: string;
  quantity: number;
  status: string;
  currency: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  person: string;
  email: string;
  tel: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  // Backend-specific fields
  companyName?: string;
  emailDomain?: string;
  companyAddress?: string;
  companyTel?: string;
  companyType?: string;
  companyWebsite?: string;
  members?: CustomerMember[];
  // Aggregated from orders
  orderCount?: number;
  orders?: CustomerOrder[];
}

export interface CreateCustomerRequest {
  customerName: string;
  person: string;
  email: string;
  tel: string;
  currency?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}

class CustomerService {
  private storageKey = 'customers';
  private baseUrl = '/api';

  // Map backend customer format to frontend format
  private mapFromBackend(data: any): Customer {
    const firstMember = data.members && data.members.length > 0 ? data.members[0] : null;
    return {
      id: String(data.id),
      customerName: data.companyName || data.customerName || '',
      person: firstMember?.name || data.person || '',
      email: firstMember?.emailPrefix ? `${firstMember.emailPrefix}@${data.emailDomain || ''}` : (data.email || ''),
      tel: firstMember?.tel || data.companyTel || data.tel || '',
      currency: data.currency || 'USD',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Preserve backend fields
      companyName: data.companyName,
      emailDomain: data.emailDomain,
      companyAddress: data.companyAddress,
      companyTel: data.companyTel,
      companyType: data.companyType,
      companyWebsite: data.companyWebsite,
      members: data.members
    };
  }

  // Get all customers (merge from backend API + project localStorage)
  async getAllCustomers(): Promise<Customer[]> {
    let allCustomers: Customer[] = [];

    // 1. Fetch from backend API
    try {
      const response = await fetch(`${this.baseUrl}/customers`);
      if (response.ok) {
        const data = await response.json();
        const rawCustomers = data.customers || (Array.isArray(data) ? data : []);
        const apiCustomers = rawCustomers.map((c: any) => this.mapFromBackend(c));
        allCustomers = allCustomers.concat(apiCustomers);
      }
    } catch (error) {
      console.warn('Backend not available:', error);
    }

    // 2. Extract customers from localStorage orders/projects
    const projectCustomers = this.getCustomersFromProjects();
    // Merge: add project-only customers; enrich API customers with order data
    projectCustomers.forEach(pc => {
      const existing = allCustomers.find(c => c.customerName.toLowerCase() === pc.customerName.toLowerCase());
      if (existing) {
        // Enrich existing API customer with order history
        existing.orders = pc.orders;
        existing.orderCount = pc.orderCount;
      } else {
        allCustomers.push(pc);
      }
    });

    return allCustomers;
  }

  // Extract unique customers from localStorage (order_management + order_variable_data)
  private getCustomersFromProjects(): Customer[] {
    const customers: Customer[] = [];
    const seen = new Map<string, { customer: Customer; orders: CustomerOrder[] }>();

    // 1. From order_management — each order has customerName, layoutId, etc.
    try {
      const orderData = localStorage.getItem('order_management');
      if (orderData) {
        const orders = JSON.parse(orderData);
        if (Array.isArray(orders)) {
          orders.forEach((o: any) => {
            const name = (o.customerName || '').trim();
            if (!name) return;

            const key = name.toLowerCase();
            const orderEntry: CustomerOrder = {
              orderId: o.id || '',
              orderNumber: o.userOrderNumber || o.orderNumber || o.id || '',
              projectSlug: o.projectSlug || '',
              layoutId: o.layoutId || '',
              masterFileName: o.masterFileName || '',
              quantity: o.quantity || 0,
              status: o.status || 'draft',
              currency: o.currency || '',
              createdAt: o.createdAt || new Date().toISOString(),
            };

            if (!seen.has(key)) {
              seen.set(key, {
                customer: {
                  id: o.customerId || `order_${name.replace(/\s+/g, '_')}`,
                  customerName: name,
                  person: '',
                  email: '',
                  tel: '',
                  currency: o.currency || 'USD',
                  createdAt: o.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                orders: [],
              });
            }
            seen.get(key)!.orders.push(orderEntry);
          });
        }
      }
    } catch (e) { /* skip */ }

    // 2. From order_variable_data (projects)
    try {
      const projectData = localStorage.getItem('order_variable_data');
      if (projectData) {
        const projects = JSON.parse(projectData);
        if (Array.isArray(projects)) {
          projects.forEach((p: any) => {
            const name = (p.customerName || '').trim();
            if (!name) return;

            const key = name.toLowerCase();
            if (!seen.has(key)) {
              seen.set(key, {
                customer: {
                  id: p.projectId || `project_${name.replace(/\s+/g, '_')}`,
                  customerName: name,
                  person: '',
                  email: '',
                  tel: '',
                  currency: 'USD',
                  createdAt: p.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                orders: [],
              });
            }
          });
        }
      }
    } catch (e) { /* skip */ }

    // Build final customer list with order counts
    Array.from(seen.values()).forEach(({ customer, orders }) => {
      customer.orders = orders;
      customer.orderCount = orders.length;
      if (orders.length > 0) {
        customer.currency = orders[orders.length - 1].currency || customer.currency;
      }
      customers.push(customer);
    });

    console.log(`📊 Found ${customers.length} customers from projects:`, customers.map(c => `${c.customerName} (${c.orderCount} orders)`));
    return customers;
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        return this.mapFromBackend(data);
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    const customers = this.getFromLocalStorage();
    return customers.find(customer => customer.id === id) || null;
  }

  // Create new customer
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data.customerName,
          person: data.person,
          email: data.email,
          tel: data.tel,
          currency: data.currency
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return this.mapFromBackend(result);
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to localStorage
    const newCustomer: Customer = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const customers = this.getFromLocalStorage();
    customers.push(newCustomer);
    this.saveToLocalStorage(customers);
    return newCustomer;
  }

  // Update customer
  async updateCustomer(data: UpdateCustomerRequest): Promise<Customer> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return this.mapFromBackend(result);
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    const customers = this.getFromLocalStorage();
    const index = customers.findIndex(customer => customer.id === data.id);
    if (index === -1) throw new Error('Customer not found');

    const updatedCustomer = {
      ...customers[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    customers[index] = updatedCustomer;
    this.saveToLocalStorage(customers);
    return updatedCustomer;
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) return true;
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    const customers = this.getFromLocalStorage();
    const filtered = customers.filter(customer => customer.id !== id);
    if (filtered.length === customers.length) return false;
    this.saveToLocalStorage(filtered);
    return true;
  }

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getAllCustomers();
    const lowercaseQuery = query.toLowerCase();
    return customers.filter(customer =>
      (customer.customerName || '').toLowerCase().includes(lowercaseQuery) ||
      (customer.person || '').toLowerCase().includes(lowercaseQuery) ||
      (customer.email || '').toLowerCase().includes(lowercaseQuery) ||
      (customer.tel || '').toLowerCase().includes(lowercaseQuery)
    );
  }

  private getFromLocalStorage(): Customer[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            id: String(c.id || ''),
            customerName: c.customerName || c.companyName || c.name || '',
            person: c.person || c.contact || '',
            email: c.email || '',
            tel: c.tel || c.phone || '',
            currency: c.currency || 'USD',
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString()
          }));
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return this.getDefaultMockData();
  }

  // Sync project customers from localStorage to backend database
  async syncFromProjects(): Promise<{ created: number; skipped: number; errors: string[] }> {
    const customersToSync: Customer[] = [];

    // 1. Extract from order_variable_data
    try {
      const orderVariableData = localStorage.getItem('order_variable_data');
      if (orderVariableData) {
        const projects = JSON.parse(orderVariableData);
        if (Array.isArray(projects)) {
          projects.forEach((p: any) => {
            if (p.customerName && p.customerName.trim()) {
              customersToSync.push({
                id: p.projectId || '',
                customerName: p.customerName.trim(),
                person: '',
                email: '',
                tel: '',
                currency: 'USD',
                createdAt: p.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading order_variable_data:', e);
    }

    // 2. Extract from project_* keys (project layouts)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('project_') && !key.includes('_layouts')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              // Extract customer from key pattern: project_customerName_timestamp
              const parts = key.split('_');
              if (parts.length >= 3) {
                const customerFromKey = parts[1]; // e.g., "jason-boss"
                if (customerFromKey && !customersToSync.find(c => c.customerName === customerFromKey)) {
                  customersToSync.push({
                    id: '',
                    customerName: customerFromKey,
                    person: '',
                    email: '',
                    tel: '',
                    currency: 'USD',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                }
              }
              // Also check parsed data for customerName
              if (parsed.customerName && !customersToSync.find(c => c.customerName === parsed.customerName)) {
                customersToSync.push({
                  id: '',
                  customerName: parsed.customerName,
                  person: '',
                  email: '',
                  tel: '',
                  currency: 'USD',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error scanning localStorage:', e);
    }

    // Deduplicate
    const uniqueCustomers = customersToSync.filter((c, idx, arr) =>
      arr.findIndex(x => x.customerName === c.customerName) === idx
    );

    console.log(`📊 Found ${uniqueCustomers.length} unique customers from projects:`, uniqueCustomers.map(c => c.customerName));

    // 3. Send to backend
    try {
      const response = await fetch(`${this.baseUrl}/customers/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: uniqueCustomers })
      });
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync result:', result);
        return result;
      }
    } catch (e) {
      console.error('Error syncing to backend:', e);
    }

    return { created: 0, skipped: 0, errors: ['Backend sync failed'] };
  }

  private saveToLocalStorage(customers: Customer[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private getDefaultMockData(): Customer[] {
    return [];
  }
}

export const customerService = new CustomerService();
export default customerService;
