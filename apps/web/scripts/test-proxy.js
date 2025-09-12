// 测试反向代理功能的脚本
// 使用方法: node scripts/test-proxy.js

const API_BASE = 'http://localhost:3000/vibegate/api';

async function testAuth() {
  console.log('\n=== 测试认证系统 ===');
  
  // 注册测试用户
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    })
  });
  
  const registerData = await registerRes.json();
  console.log('注册结果:', registerData);
  
  // 登录获取 token
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginRes.json();
  console.log('登录结果:', loginData);
  
  return loginData.token;
}

async function testProxyRoutes(token) {
  console.log('\n=== 测试代理路由管理 ===');
  
  // 创建代理路由
  const createRes = await fetch(`${API_BASE}/admin/routes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      path: '/api/test',
      target: 'http://localhost:3001',
      requireAuth: false,
      enabled: true
    })
  });
  
  const createData = await createRes.json();
  console.log('创建路由结果:', createData);
  
  // 获取所有路由
  const getRes = await fetch(`${API_BASE}/admin/routes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const getData = await getRes.json();
  console.log('所有路由:', getData);
}

async function main() {
  try {
    console.log('开始测试 VibeGate 反向代理功能...');
    
    // 测试认证
    const token = await testAuth();
    
    if (token) {
      // 测试代理路由管理
      await testProxyRoutes(token);
      
      console.log('\n=== 测试完成 ===');
      console.log('现在你可以：');
      console.log('1. 启动一个测试服务器在 http://localhost:3001');
      console.log('2. 访问 http://localhost:3000/api/test 来测试代理功能');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

main();