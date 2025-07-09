import {
  users,
  departments,
  employees,
  employeeStatus,
  type User,
  type Department,
  type Employee,
  type EmployeeStatus,
  type InsertUser,
  type InsertDepartment,
  type InsertEmployee,
  type InsertEmployeeStatus,
  type EmployeeWithStatus,
  type DepartmentWithEmployees,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // Auth operations
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeWithStatus(id: number): Promise<EmployeeWithStatus | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;

  // Employee status operations
  getEmployeeStatus(employeeId: number): Promise<EmployeeStatus | undefined>;
  updateEmployeeStatus(status: InsertEmployeeStatus): Promise<EmployeeStatus>;
  getAllEmployeeStatuses(): Promise<EmployeeStatus[]>;


}

export class DatabaseStorage implements IStorage {
  // Auth operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]> {
    const depts = await db.query.departments.findMany({
      with: {
        employees: {
          with: {
            status: true,
            department: true,
          },
        },
      },
    });
    return depts;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [dept] = await db.insert(departments).values(department).returning();
    return dept;
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeWithStatus(id: number): Promise<EmployeeWithStatus | undefined> {
    const result = await db.query.employees.findFirst({
      where: eq(employees.id, id),
      with: {
        status: true,
        department: true,
      },
    });
    return result;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [emp] = await db.insert(employees).values(employee).returning();
    return emp;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [emp] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return emp;
  }

  // Employee status operations
  async getEmployeeStatus(employeeId: number): Promise<EmployeeStatus | undefined> {
    const [status] = await db
      .select()
      .from(employeeStatus)
      .where(eq(employeeStatus.employeeId, employeeId));
    return status;
  }

  async updateEmployeeStatus(status: InsertEmployeeStatus): Promise<EmployeeStatus> {
    const existing = await this.getEmployeeStatus(status.employeeId);
    
    if (existing) {
      const [updated] = await db
        .update(employeeStatus)
        .set({ ...status, lastUpdated: new Date() })
        .where(eq(employeeStatus.employeeId, status.employeeId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(employeeStatus)
        .values({ ...status, lastUpdated: new Date() })
        .returning();
      return created;
    }
  }

  async getAllEmployeeStatuses(): Promise<EmployeeStatus[]> {
    return await db.select().from(employeeStatus);
  }


}

export const storage = new DatabaseStorage();
