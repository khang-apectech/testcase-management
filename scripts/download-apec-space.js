// Script để tải xuống kết quả test APEC SPACE
// Chạy với: node scripts/download-apec-space.js

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function downloadApecSpaceResults() {
  try {
    console.log('🔍 Kết nối đến cơ sở dữ liệu...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL không tìm thấy trong biến môi trường');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Tìm dự án APEC SPACE
    console.log('🔍 Tìm dự án APEC SPACE...');
    const projectResult = await sql`
      SELECT id, name FROM projects WHERE name LIKE ${'%Apec Space%'} OR name LIKE ${'%APEC SPACE%'} OR name LIKE ${'%APEC-SPACE%'} LIMIT 1
    `;
    
    if (projectResult.length === 0) {
      throw new Error('Không tìm thấy dự án APEC SPACE');
    }
    
    const projectId = projectResult[0].id;
    const projectName = projectResult[0].name;
    console.log(`✅ Đã tìm thấy dự án: ${projectName} (${projectId})`);
    
    // Lấy tất cả test case và kết quả thực thi cho dự án APEC SPACE
    console.log('🔍 Đang lấy dữ liệu test case và kết quả thực thi...');
    const testResults = await sql`
      SELECT 
        tc.id as test_case_id,
        tc.hang_muc,
        tc.tinh_nang,
        tc.mo_ta,
        tc.so_lan_phai_test,
        tc.priority,
        tc.platform,
        tc.preconditions,
        tc.steps,
        tc.expected_result,
        te.id as execution_id,
        te.so_lan_da_test,
        te.cam_nhan,
        te.loi,
        te.execution_date,
        u.name as tester_name,
        u.email as tester_email
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      LEFT JOIN users u ON te.tester_id = u.id
      WHERE tc.project_id = ${projectId}
      ORDER BY tc.hang_muc, tc.tinh_nang, te.execution_date DESC
    `;
    
    if (testResults.length === 0) {
      throw new Error('Không tìm thấy kết quả test cho dự án APEC SPACE');
    }
    
    console.log(`✅ Đã tìm thấy ${testResults.length} kết quả test`);
    
    // Tạo nội dung CSV
    console.log('📝 Đang tạo file CSV...');
    const headers = [
      "ID",
      "Hạng mục",
      "Tính năng",
      "Mô tả",
      "Số lần phải test",
      "Độ ưu tiên",
      "Nền tảng",
      "Điều kiện tiên quyết",
      "Các bước thực hiện",
      "Kết quả mong đợi",
      "Số lần đã test",
      "Cảm nhận",
      "Lỗi",
      "Ngày test",
      "Người test",
      "Email người test"
    ];
    
    // Thêm BOM cho UTF-8
    let csvContent = "\uFEFF" + headers.join(",") + "\n";
    
    testResults.forEach(result => {
      const row = [
        `"${result.test_case_id || ""}"`,
        `"${(result.hang_muc || "").replace(/"/g, '""')}"`,
        `"${(result.tinh_nang || "").replace(/"/g, '""')}"`,
        `"${(result.mo_ta || "").replace(/"/g, '""')}"`,
        `"${result.so_lan_phai_test || ""}"`,
        `"${result.priority || ""}"`,
        `"${result.platform || ""}"`,
        `"${(result.preconditions || "").replace(/"/g, '""')}"`,
        `"${(result.steps || "").replace(/"/g, '""')}"`,
        `"${(result.expected_result || "").replace(/"/g, '""')}"`,
        `"${result.so_lan_da_test || ""}"`,
        `"${(result.cam_nhan || "").replace(/"/g, '""')}"`,
        `"${(result.loi || "").replace(/"/g, '""')}"`,
        `"${result.execution_date ? new Date(result.execution_date).toLocaleDateString('vi-VN') : ""}"`,
        `"${(result.tester_name || "").replace(/"/g, '""')}"`,
        `"${(result.tester_email || "").replace(/"/g, '""')}"`,
      ];
      
      csvContent += row.join(",") + "\n";
    });
    
    // Lưu file CSV
    const fileName = `APEC-SPACE-test-results-${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(__dirname, '..', fileName);
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`✅ Đã lưu file CSV tại: ${filePath}`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

downloadApecSpaceResults();