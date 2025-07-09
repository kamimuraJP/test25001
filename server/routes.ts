import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertEmployeeStatusSchema, insertAttendanceRecordSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Session middleware
  const MemStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: true, // Changed to true to ensure session creation
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Add sameSite for better compatibility
    },
    name: 'connect.sid' // Explicit session cookie name
  }));

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    console.log('Auth check - Session ID:', req.session?.id);
    console.log('Auth check - Session user:', req.session?.user?.username);
    
    if (req.session?.user) {
      return next();
    }
    console.log('Auth failed - No session user found');
    return res.status(401).json({ message: "Unauthorized" });
  };

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Initialize default users if they don't exist
  const initializeUsers = async () => {
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      await storage.createUser({
        username: 'admin',
        password: 'seb@such@n',
        role: 'admin',
        fullName: '管理者',
        isActive: true
      });
    }

    const sampleUser = await storage.getUserByUsername('sample');
    if (!sampleUser) {
      await storage.createUser({
        username: 'sample',
        password: '4110',
        role: 'user',
        fullName: 'サンプルユーザー',
        isActive: true
      });
    }
  };

  await initializeUsers();

  // Initialize sample data
  const initializeSampleData = async () => {
    const departments = await storage.getDepartments();
    if (departments.length === 0) {
      // Create departments
      const salesDept = await storage.createDepartment({
        name: 'Sales',
        nameJa: '営業部',
        icon: 'briefcase'
      });

      const engineeringDept = await storage.createDepartment({
        name: 'Engineering',
        nameJa: 'エンジニア部',
        icon: 'laptop-code'
      });

      const hrDept = await storage.createDepartment({
        name: 'Human Resources',
        nameJa: '人事部',
        icon: 'users'
      });

      // Create employees
      const employees = [
        {
          firstName: 'Taro',
          lastName: 'Tanaka',
          firstNameJa: '太郎',
          lastNameJa: '田中',
          email: 'tanaka@company.com',
          position: 'Sales Manager',
          positionJa: '営業部長',
          departmentId: salesDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Hanako',
          lastName: 'Sato',
          firstNameJa: '花子',
          lastNameJa: '佐藤',
          email: 'sato@company.com',
          position: 'Senior Engineer',
          positionJa: 'シニアエンジニア',
          departmentId: engineeringDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Jiro',
          lastName: 'Suzuki',
          firstNameJa: '次郎',
          lastNameJa: '鈴木',
          email: 'suzuki@company.com',
          position: 'HR Specialist',
          positionJa: '人事担当者',
          departmentId: hrDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Yuki',
          lastName: 'Yamada',
          firstNameJa: '雪',
          lastNameJa: '山田',
          email: 'yamada@company.com',
          position: 'Junior Engineer',
          positionJa: 'ジュニアエンジニア',
          departmentId: engineeringDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Akiko',
          lastName: 'Watanabe',
          firstNameJa: '明子',
          lastNameJa: '渡辺',
          email: 'watanabe@company.com',
          position: 'Sales Representative',
          positionJa: '営業担当',
          departmentId: salesDept.id,
          profileImageUrl: null,
          isActive: true
        }
      ];

      for (const emp of employees) {
        const employee = await storage.createEmployee(emp);
        // Set initial status
        await storage.updateEmployeeStatus({
          employeeId: employee.id,
          status: Math.random() > 0.5 ? 'on-site' : 'remote',
          location: '東京オフィス',
          latitude: '35.6762',
          longitude: '139.6503'
        });
      }
    }
  };

  await initializeSampleData();

  // Auth API
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login attempt - Session ID before:', req.session?.id);
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || !user.isActive) {
        return res.status(401).json({ 
          message: "ユーザー名またはパスワードが正しくありません" 
        });
      }

      // Store user in session (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      (req.session as any).user = userWithoutPassword;
      
      console.log('Login - Session ID after user set:', req.session?.id);
      console.log('Login - User set in session:', userWithoutPassword.username);
      
      // Save session explicitly and respond
      req.session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "セッション保存に失敗しました" });
        }
        
        console.log('Session saved successfully for user:', userWithoutPassword.username);
        console.log('Final session ID:', req.session?.id);
        
        res.json({ 
          message: "ログインに成功しました",
          user: userWithoutPassword
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "入力データが正しくありません", 
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "ログアウトに失敗しました" });
      }
      res.json({ message: "ログアウトしました" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json((req.session as any).user);
  });

  // Departments API
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartmentsWithEmployees();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Employees API
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployeeWithStatus(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Employee status API
  app.post("/api/employees/:id/status", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const statusData = insertEmployeeStatusSchema.parse({
        ...req.body,
        employeeId,
      });

      const status = await storage.updateEmployeeStatus(statusData);
      
      // Broadcast status update to all connected clients
      broadcast({
        type: 'STATUS_UPDATE',
        data: { employeeId, status }
      });

      res.json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status data", errors: error.errors });
      }
      console.error("Error updating employee status:", error);
      res.status(500).json({ message: "Failed to update employee status" });
    }
  });

  app.get("/api/employees/:id/status", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const status = await storage.getEmployeeStatus(employeeId);
      if (!status) {
        return res.status(404).json({ message: "Employee status not found" });
      }
      res.json(status);
    } catch (error) {
      console.error("Error fetching employee status:", error);
      res.status(500).json({ message: "Failed to fetch employee status" });
    }
  });

  // Attendance API
  app.post("/api/attendance/clock-in", async (req, res) => {
    try {
      const attendanceData = insertAttendanceRecordSchema.parse({
        ...req.body,
        date: new Date(),
        clockInTime: new Date(),
      });

      // Check if there's already a record for today
      const existingRecord = await storage.getTodayAttendance(attendanceData.employeeId);
      
      if (existingRecord && existingRecord.clockInTime) {
        return res.status(400).json({ message: "Already clocked in today" });
      }

      const attendance = existingRecord 
        ? await storage.updateAttendanceRecord(existingRecord.id, attendanceData)
        : await storage.createAttendanceRecord(attendanceData);

      // Update employee status
      await storage.updateEmployeeStatus({
        employeeId: attendanceData.employeeId,
        status: attendanceData.status,
        location: attendanceData.clockInLocation,
        latitude: attendanceData.clockInLatitude,
        longitude: attendanceData.clockInLongitude,
      });

      // Broadcast attendance update
      broadcast({
        type: 'ATTENDANCE_UPDATE',
        data: { type: 'clock-in', attendance }
      });

      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/attendance/clock-out", async (req, res) => {
    try {
      const { employeeId, clockOutLocation, clockOutLatitude, clockOutLongitude } = req.body;
      
      const todayRecord = await storage.getTodayAttendance(employeeId);
      if (!todayRecord || !todayRecord.clockInTime) {
        return res.status(400).json({ message: "No clock-in record found for today" });
      }

      const clockOutTime = new Date();
      const workHours = Math.floor((clockOutTime.getTime() - todayRecord.clockInTime.getTime()) / (1000 * 60));

      const attendance = await storage.updateAttendanceRecord(todayRecord.id, {
        clockOutTime,
        clockOutLocation,
        clockOutLatitude,
        clockOutLongitude,
        workHours,
      });

      // Update employee status to offline
      await storage.updateEmployeeStatus({
        employeeId,
        status: 'offline',
        location: clockOutLocation,
        latitude: clockOutLatitude,
        longitude: clockOutLongitude,
      });

      // Broadcast attendance update
      broadcast({
        type: 'ATTENDANCE_UPDATE',
        data: { type: 'clock-out', attendance }
      });

      res.json(attendance);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get("/api/employees/:id/attendance", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { year, month } = req.query;
      
      if (year && month) {
        const records = await storage.getMonthlyAttendance(
          employeeId,
          parseInt(year as string),
          parseInt(month as string)
        );
        res.json(records);
      } else {
        const today = await storage.getTodayAttendance(employeeId);
        res.json(today || null);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = {
        ...req.body,
        isModified: true,
      };

      const attendance = await storage.updateAttendanceRecord(id, updateData);
      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance record:", error);
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  // Export attendance data as CSV
  app.get("/api/employees/:id/attendance/export", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { year, month } = req.query;
      
      const records = await storage.getMonthlyAttendance(
        employeeId,
        parseInt(year as string),
        parseInt(month as string)
      );

      const csvHeaders = [
        '日付',
        '出社時刻',
        '退社時刻',
        '勤務時間',
        'ステータス',
        '出社場所',
        '退社場所'
      ].join(',');

      const csvRows = records.map(record => [
        record.date.toLocaleDateString('ja-JP'),
        record.clockInTime?.toLocaleTimeString('ja-JP') || '',
        record.clockOutTime?.toLocaleTimeString('ja-JP') || '',
        record.workHours ? `${Math.floor(record.workHours / 60)}時間${record.workHours % 60}分` : '',
        record.status,
        record.clockInLocation || '',
        record.clockOutLocation || ''
      ].join(','));

      const csv = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${year}-${month}.csv"`);
      res.send('\uFEFF' + csv); // Add BOM for proper UTF-8 encoding
    } catch (error) {
      console.error("Error exporting attendance data:", error);
      res.status(500).json({ message: "Failed to export attendance data" });
    }
  });

  return httpServer;
}
