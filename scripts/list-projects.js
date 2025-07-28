// Script để liệt kê các dự án
// Chạy với: node scripts/list-projects.js

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function listProjects() {
  try {
    console.log('🔍 Kết nối đến cơ sở dữ liệu...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL không tìm thấy trong biến môi trường');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Lấy danh sách dự án
    console.log('🔍 Đang lấy danh sách dự án...');
    const projects = await sql`
      SELECT id, name, description, created_at FROM projects ORDER BY created_at DESC
    `;
    
    if (projects.length === 0) {
      console.log('❌ Không có dự án nào trong cơ sở dữ liệu');
      return;
    }
    
    console.log(`✅ Đã tìm thấy ${projects.length} dự án:`);
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (${project.id})`);
      console.log(`   Mô tả: ${project.description || 'Không có mô tả'}`);
      console.log(`   Ngày tạo: ${new Date(project.created_at).toLocaleString()}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

listProjects();