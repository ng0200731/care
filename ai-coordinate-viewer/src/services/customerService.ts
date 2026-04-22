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

  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns { success: true, customers: [...] }
        const rawCustomers = data.customers || (Array.isArray(data) ? data : []);
        return rawCustomers.map((c: any) => this.mapFromBackend(c));
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    return this.getFromLocalStorage();
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
