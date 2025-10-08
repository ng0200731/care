// Customer Service - Handles CRUD operations for customers
// This will be connected to backend API later

export interface Customer {
  id: string;
  customerName: string;
  person: string;
  email: string;
  tel: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
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
  private baseUrl = 'http://localhost:3001/api'; // Backend API URL

  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    try {
      // Try to fetch from backend first
      const response = await fetch(`${this.baseUrl}/customers`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    return this.getFromLocalStorage();
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const customers = this.getFromLocalStorage();
    return customers.find(customer => customer.id === id) || null;
  }

  // Create new customer
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const newCustomer: Customer = {
      id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const customers = this.getFromLocalStorage();
    const index = customers.findIndex(customer => customer.id === data.id);
    
    if (index === -1) {
      throw new Error('Customer not found');
    }

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

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
    }

    // Fallback to local storage
    const customers = this.getFromLocalStorage();
    const filteredCustomers = customers.filter(customer => customer.id !== id);
    
    if (filteredCustomers.length === customers.length) {
      return false; // Customer not found
    }

    this.saveToLocalStorage(filteredCustomers);
    return true;
  }

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getAllCustomers();
    const lowercaseQuery = query.toLowerCase();

    return customers.filter(customer =>
      customer.customerName.toLowerCase().includes(lowercaseQuery) ||
      customer.person.toLowerCase().includes(lowercaseQuery) ||
      customer.email.toLowerCase().includes(lowercaseQuery) ||
      customer.tel.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Private helper methods
  private getFromLocalStorage(): Customer[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }

    // Return default mock data if nothing in storage
    return this.getDefaultMockData();
  }

  private saveToLocalStorage(customers: Customer[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultMockData(): Customer[] {
    return [
      {
        id: '1',
        customerName: 'ABC Fashion Co.',
        person: 'John Smith',
        email: 'john.smith@abcfashion.com',
        tel: '+1-555-0123',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        customerName: 'Global Textiles Ltd.',
        person: 'Sarah Johnson',
        email: 'sarah.j@globaltextiles.com',
        tel: '+1-555-0456',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        customerName: 'Premium Brands Inc.',
        person: 'Michael Chen',
        email: 'm.chen@premiumbrands.com',
        tel: '+1-555-0789',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Initialize service with mock data if needed
  async initialize(): Promise<void> {
    const customers = this.getFromLocalStorage();
    if (customers.length === 0) {
      // Initialize with default data
      const defaultCustomers = this.getDefaultMockData();
      this.saveToLocalStorage(defaultCustomers);
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();

// Initialize on import
customerService.initialize();
