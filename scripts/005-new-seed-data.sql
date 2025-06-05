-- Insert sample test cases with new structure
INSERT INTO test_cases (hang_muc, tinh_nang, so_lan_phai_test, created_by) VALUES
('Đăng nhập', 'Kiểm tra đăng nhập với email và mật khẩu hợp lệ', 3, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Đăng nhập', 'Kiểm tra đăng nhập với thông tin không hợp lệ', 2, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Đăng ký', 'Kiểm tra form đăng ký với thông tin đầy đủ', 3, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Đăng ký', 'Kiểm tra validation form đăng ký', 4, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Dashboard', 'Kiểm tra hiển thị dữ liệu trên dashboard', 2, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Dashboard', 'Kiểm tra tốc độ tải trang dashboard', 3, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Tìm kiếm', 'Kiểm tra tìm kiếm với từ khóa hợp lệ', 2, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Tìm kiếm', 'Kiểm tra tìm kiếm với từ khóa đặc biệt', 3, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Thanh toán', 'Kiểm tra quy trình thanh toán thành công', 5, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Thanh toán', 'Kiểm tra xử lý lỗi thanh toán', 4, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Mobile', 'Kiểm tra responsive trên điện thoại', 3, (SELECT id FROM users WHERE email = 'admin@testcase.com')),
('Mobile', 'Kiểm tra responsive trên tablet', 2, (SELECT id FROM users WHERE email = 'admin@testcase.com'))
ON CONFLICT DO NOTHING;

-- Assign test cases to testers
INSERT INTO user_test_assignments (user_id, test_case_id) 
SELECT u.id, tc.id 
FROM users u 
CROSS JOIN test_cases tc 
WHERE u.role = 'tester'
ON CONFLICT (user_id, test_case_id) DO NOTHING;

-- Insert sample test executions with new structure
INSERT INTO test_executions (test_case_id, tester_id, so_lan_da_test, cam_nhan, loi) VALUES
((SELECT id FROM test_cases WHERE tinh_nang LIKE '%đăng nhập với email%'), 
 (SELECT id FROM users WHERE email = 'tester1@testcase.com'), 
 2, 'Chức năng hoạt động ổn định', ''),

((SELECT id FROM test_cases WHERE tinh_nang LIKE '%đăng nhập với thông tin không hợp lệ%'), 
 (SELECT id FROM users WHERE email = 'tester1@testcase.com'), 
 1, 'Cần cải thiện thông báo lỗi', 'Thông báo lỗi không rõ ràng khi nhập sai email'),

((SELECT id FROM test_cases WHERE tinh_nang LIKE '%form đăng ký với thông tin đầy đủ%'), 
 (SELECT id FROM users WHERE email = 'tester2@testcase.com'), 
 3, 'Hoạt động tốt', ''),

((SELECT id FROM test_cases WHERE tinh_nang LIKE '%validation form đăng ký%'), 
 (SELECT id FROM users WHERE email = 'tester2@testcase.com'), 
 2, 'Có một số vấn đề nhỏ', 'Validation email không hoạt động với một số ký tự đặc biệt'),

((SELECT id FROM test_cases WHERE tinh_nang LIKE '%hiển thị dữ liệu trên dashboard%'), 
 (SELECT id FROM users WHERE email = 'tester3@testcase.com'), 
 2, 'Dữ liệu hiển thị chính xác', ''),

((SELECT id FROM test_cases WHERE tinh_nang LIKE '%tốc độ tải trang dashboard%'), 
 (SELECT id FROM users WHERE email = 'tester3@testcase.com'), 
 1, 'Tải hơi chậm', 'Trang tải mất khoảng 3-4 giây, cần tối ưu')
ON CONFLICT DO NOTHING;
