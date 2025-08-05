// Project Service - Handles CRUD operations for projects
// Simple localStorage implementation

export interface Project {
  id: string;
  slug: string; // URL-friendly version like "summer-collection-nike"
  name: string;
  description: string;
  customerName: string;
  customerId: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Completed';
  createdAt: string;
  updatedAt: string;
  pageCount: number;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  customerName: string;
  customerId: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Completed';
}

class ProjectService {
  private storageKey = 'projects';

  // Get all projects (with migration for existing projects without slugs)
  async getAllProjects(): Promise<Project[]> {
    const projects = this.getFromLocalStorage();

    // Migrate existing projects that don't have slugs
    let needsUpdate = false;
    const migratedProjects = projects.map(project => {
      if (!project.slug) {
        needsUpdate = true;
        return {
          ...project,
          slug: this.generateSlug(project.name, project.customerName)
        };
      }
      return project;
    });

    // Save migrated projects if needed
    if (needsUpdate) {
      this.saveToLocalStorage(migratedProjects);
    }

    return migratedProjects;
  }

  // Get project by ID
  async getProjectById(id: string): Promise<Project | null> {
    const projects = this.getFromLocalStorage();
    return projects.find(project => project.id === id) || null;
  }

  // Get project by readable URL slug
  async getProjectBySlug(slug: string): Promise<Project | null> {
    const projects = this.getFromLocalStorage();
    return projects.find(project => project.slug === slug) || null;
  }

  // Create new project
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const newProject: Project = {
      id: this.generateId(),
      slug: this.generateSlug(data.name, data.customerName),
      ...data,
      pageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const projects = this.getFromLocalStorage();
    projects.push(newProject);
    this.saveToLocalStorage(projects);
    return newProject;
  }

  // Update project
  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project | null> {
    const projects = this.getFromLocalStorage();
    const index = projects.findIndex(project => project.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedProject = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    projects[index] = updatedProject;
    this.saveToLocalStorage(projects);
    return updatedProject;
  }

  // Delete project
  async deleteProject(id: string): Promise<boolean> {
    const projects = this.getFromLocalStorage();
    const filteredProjects = projects.filter(project => project.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false; // Project not found
    }

    this.saveToLocalStorage(filteredProjects);
    return true;
  }

  // Search projects
  async searchProjects(query: string): Promise<Project[]> {
    const projects = await this.getAllProjects();
    const lowercaseQuery = query.toLowerCase();

    return projects.filter(project =>
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.customerName.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Private helper methods
  private getFromLocalStorage(): Project[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading projects from localStorage:', error);
    }

    return [];
  }

  private saveToLocalStorage(projects: Project[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Create URL-friendly slug from project name and customer
  private generateSlug(projectName: string, customerName: string): string {
    const combined = `${projectName}-${customerName}`;
    let slug = combined
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Check if slug already exists and add number if needed
    const existingProjects = this.getFromLocalStorage();
    let counter = 1;
    let finalSlug = slug;

    while (existingProjects.some(p => p.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
