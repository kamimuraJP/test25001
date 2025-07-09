import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertEmployeeStatusSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
// Simple in-memory token store for authentication
const activeTokens = new Map<string, any>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    console.log('Auth check - Token:', token?.substring(0, 10) + '...');
    
    if (token && activeTokens.has(token)) {
      req.user = activeTokens.get(token);
      console.log('Auth success - User:', req.user.username);
      return next();
    }
    
    console.log('Auth failed - Invalid or missing token');
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

      const marketingDept = await storage.createDepartment({
        name: 'Marketing',
        nameJa: 'マーケティング部',
        icon: 'megaphone'
      });

      const financeDept = await storage.createDepartment({
        name: 'Finance',
        nameJa: '経理部',
        icon: 'calculator'
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
        },
        {
          firstName: 'Koji',
          lastName: 'Nakamura',
          firstNameJa: '康二',
          lastNameJa: '中村',
          email: 'nakamura@company.com',
          position: 'Marketing Manager',
          positionJa: 'マーケティング部長',
          departmentId: marketingDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Emi',
          lastName: 'Takahashi',
          firstNameJa: '恵美',
          lastNameJa: '高橋',
          email: 'takahashi@company.com',
          position: 'Marketing Specialist',
          positionJa: 'マーケティング担当',
          departmentId: marketingDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Hideki',
          lastName: 'Ito',
          firstNameJa: '英樹',
          lastNameJa: '伊藤',
          email: 'ito@company.com',
          position: 'Finance Manager',
          positionJa: '経理部長',
          departmentId: financeDept.id,
          profileImageUrl: null,
          isActive: true
        },
        {
          firstName: 'Satomi',
          lastName: 'Kobayashi',
          firstNameJa: '智美',
          lastNameJa: '小林',
          email: 'kobayashi@company.com',
          position: 'Accountant',
          positionJa: '経理担当',
          departmentId: financeDept.id,
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
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || !user.isActive) {
        return res.status(401).json({ 
          message: "ユーザー名またはパスワードが正しくありません" 
        });
      }

      // Generate token and store user (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken();
      activeTokens.set(token, userWithoutPassword);
      
      console.log('Login successful for user:', userWithoutPassword.username);
      console.log('Generated token:', token.substring(0, 10) + '...');
      
      res.json({ 
        message: "ログインに成功しました",
        user: userWithoutPassword,
        token: token
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

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token && activeTokens.has(token)) {
      activeTokens.delete(token);
      console.log('Token deleted for logout');
    }
    
    res.json({ message: "ログアウトしました" });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json(req.user);
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

  // Employee statuses API
  app.get("/api/employee-statuses", async (req, res) => {
    try {
      const statuses = await storage.getAllEmployeeStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching employee statuses:", error);
      res.status(500).json({ message: "Failed to fetch employee statuses" });
    }
  });

  return httpServer;
}
