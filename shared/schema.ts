import { pgTable, text, serial, integer, boolean, timestamp, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"), // 'admin' or 'user'
  fullName: varchar("full_name", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameJa: text("name_ja").notNull(),
  icon: text("icon").notNull().default("building"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  firstNameJa: text("first_name_ja").notNull(),
  lastNameJa: text("last_name_ja").notNull(),
  email: text("email").notNull().unique(),
  position: text("position").notNull(),
  positionJa: text("position_ja").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee status table for real-time presence
export const employeeStatus = pgTable("employee_status", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  status: text("status").notNull(), // 'on-site', 'remote', 'direct-commute', 'direct-return', 'offline'
  lastUpdated: timestamp("last_updated").defaultNow(),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  clockInTime: timestamp("clock_in_time"),
  clockOutTime: timestamp("clock_out_time"),
  clockInLocation: text("clock_in_location"),
  clockOutLocation: text("clock_out_location"),
  clockInLatitude: text("clock_in_latitude"),
  clockInLongitude: text("clock_in_longitude"),
  clockOutLatitude: text("clock_out_latitude"),
  clockOutLongitude: text("clock_out_longitude"),
  status: text("status").notNull(), // 'on-site', 'remote', 'direct-commute', 'direct-return'
  workHours: integer("work_hours"), // in minutes
  isModified: boolean("is_modified").default(false),
  modificationReason: text("modification_reason"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  status: one(employeeStatus, {
    fields: [employees.id],
    references: [employeeStatus.employeeId],
  }),
  attendanceRecords: many(attendanceRecords),
}));

export const employeeStatusRelations = relations(employeeStatus, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeStatus.employeeId],
    references: [employees.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeStatusSchema = createInsertSchema(employeeStatus).omit({
  id: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

// Types
export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type EmployeeStatus = typeof employeeStatus.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertEmployeeStatus = z.infer<typeof insertEmployeeStatusSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Extended types for API responses
export type EmployeeWithStatus = Employee & {
  status?: EmployeeStatus;
  department: Department;
};

export type DepartmentWithEmployees = Department & {
  employees: EmployeeWithStatus[];
};
