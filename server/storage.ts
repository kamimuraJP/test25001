import {
  users,
  departments,
  employees,
  employeeStatus,
  attendanceRecords,
  type User,
  type Department,
  type Employee,
  type EmployeeStatus,
  type AttendanceRecord,
  type InsertUser,
  type InsertDepartment,
  type InsertEmployee,
  type InsertEmployeeStatus,
  type InsertAttendanceRecord,
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

  // Attendance operations
  getAttendanceRecords(employeeId: number, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: number, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord>;
  getTodayAttendance(employeeId: number): Promise<AttendanceRecord | undefined>;
  getMonthlyAttendance(employeeId: number, year: number, month: number): Promise<AttendanceRecord[]>;
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

  // Attendance operations
  async getAttendanceRecords(employeeId: number, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.employeeId, employeeId),
          gte(attendanceRecords.date, startDate),
          lte(attendanceRecords.date, endDate)
        )
      )
      .orderBy(desc(attendanceRecords.date));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [attendance] = await db.insert(attendanceRecords).values(record).returning();
    return attendance;
  }

  async updateAttendanceRecord(id: number, record: Partial<InsertAttendanceRecord>): Promise<AttendanceRecord> {
    const [attendance] = await db
      .update(attendanceRecords)
      .set(record)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return attendance;
  }

  async getTodayAttendance(employeeId: number): Promise<AttendanceRecord | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.employeeId, employeeId),
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      );
    return record;
  }

  async getMonthlyAttendance(employeeId: number, year: number, month: number): Promise<AttendanceRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getAttendanceRecords(employeeId, startDate, endDate);
  }
}

export const storage = new DatabaseStorage();
