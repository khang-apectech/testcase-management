-- Reset and recreate tables
DROP TABLE IF EXISTS test_execution_history CASCADE;
DROP TABLE IF EXISTS test_executions CASCADE;
DROP TABLE IF EXISTS user_test_assignments CASCADE;
DROP TABLE IF EXISTS test_case_history CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'tester')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_cases table
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hang_muc VARCHAR(255) NOT NULL,
    tinh_nang TEXT NOT NULL,
    so_lan_phai_test INTEGER DEFAULT 1 NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Create test_case_history table to track changes
CREATE TABLE test_case_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    hang_muc VARCHAR(255) NOT NULL,
    tinh_nang TEXT NOT NULL,
    so_lan_phai_test INTEGER NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE')),
    change_note TEXT
);

-- Create user_test_assignments table
CREATE TABLE user_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_case_id)
);

-- Create test_executions table
CREATE TABLE test_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    tester_id UUID REFERENCES users(id),
    so_lan_da_test INTEGER DEFAULT 0,
    cam_nhan TEXT,
    loi TEXT,
    execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_execution_history table to track each test attempt
CREATE TABLE test_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_execution_id UUID REFERENCES test_executions(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    tester_id UUID REFERENCES users(id),
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cam_nhan TEXT,
    loi TEXT,
    test_attempt_number INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX idx_test_executions_test_case_id ON test_executions(test_case_id);
CREATE INDEX idx_test_executions_tester_id ON test_executions(tester_id);
CREATE INDEX idx_user_test_assignments_user_id ON user_test_assignments(user_id);
CREATE INDEX idx_user_test_assignments_test_case_id ON user_test_assignments(test_case_id);
CREATE INDEX idx_test_case_history_test_case_id ON test_case_history(test_case_id);
CREATE INDEX idx_test_execution_history_test_execution_id ON test_execution_history(test_execution_id);
CREATE INDEX idx_test_execution_history_test_case_id ON test_execution_history(test_case_id);
CREATE INDEX idx_test_execution_history_tester_id ON test_execution_history(tester_id);

-- Insert users with bcrypt hashed passwords (password123)
INSERT INTO users (email, password, name, role) VALUES
('admin@testcase.com', '$2a$10$zNZHm.Wv8wNKGRZ5YkVZUOu.7jx4p3qKB1xxhH1QYrk0.qXQX5ZYi', 'Admin User', 'admin'),
('tester1@testcase.com', '$2a$10$zNZHm.Wv8wNKGRZ5YkVZUOu.7jx4p3qKB1xxhH1QYrk0.qXQX5ZYi', 'Tester One', 'tester'),
('tester2@testcase.com', '$2a$10$zNZHm.Wv8wNKGRZ5YkVZUOu.7jx4p3qKB1xxhH1QYrk0.qXQX5ZYi', 'Tester Two', 'tester'),
('tester3@testcase.com', '$2a$10$zNZHm.Wv8wNKGRZ5YkVZUOu.7jx4p3qKB1xxhH1QYrk0.qXQX5ZYi', 'Tester Three', 'tester')
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Insert test cases and their history
DO $$ 
DECLARE
    admin_id UUID;
    test_case_id UUID;
BEGIN
    -- Get admin ID
    SELECT id INTO admin_id FROM users WHERE email = 'admin@testcase.com';

    -- Insert test case and history for Đăng nhập/Đăng ký
    INSERT INTO test_cases (hang_muc, tinh_nang, so_lan_phai_test, created_by, updated_by)
    VALUES ('Đăng nhập', 'Kiểm tra đăng nhập với email và mật khẩu hợp lệ', 3, admin_id, admin_id)
    RETURNING id INTO test_case_id;
    
    INSERT INTO test_case_history (test_case_id, hang_muc, tinh_nang, so_lan_phai_test, changed_by, change_type, change_note)
    VALUES (test_case_id, 'Đăng nhập', 'Kiểm tra đăng nhập với email và mật khẩu hợp lệ', 3, admin_id, 'CREATE', 'Tạo mới test case');

    -- Thêm các test case khác tương tự...
    -- (Giữ nguyên phần INSERT test_cases như cũ nhưng thêm updated_by)
END $$;

-- Assign test cases to testers
INSERT INTO user_test_assignments (user_id, test_case_id) 
SELECT u.id, tc.id 
FROM users u 
CROSS JOIN test_cases tc 
WHERE u.role = 'tester'
ON CONFLICT (user_id, test_case_id) DO NOTHING;

-- Insert test executions with detailed history
DO $$ 
DECLARE
    tester1_id UUID;
    test_case_id UUID;
    execution_id UUID;
BEGIN
    -- Get tester1 ID
    SELECT id INTO tester1_id FROM users WHERE email = 'tester1@testcase.com';
    
    -- Get test case ID
    SELECT id INTO test_case_id FROM test_cases WHERE tinh_nang LIKE '%đăng nhập với email%';
    
    -- Insert main execution record
    INSERT INTO test_executions (test_case_id, tester_id, so_lan_da_test, cam_nhan, loi, execution_date)
    VALUES (test_case_id, tester1_id, 2, 'Chức năng hoạt động ổn định', '', NOW())
    RETURNING id INTO execution_id;
    
    -- Insert execution history records
    INSERT INTO test_execution_history (
        test_execution_id, test_case_id, tester_id, 
        execution_time, cam_nhan, loi, test_attempt_number
    ) VALUES 
    (execution_id, test_case_id, tester1_id, 
     NOW() - INTERVAL '2 days' + INTERVAL '10 hours', 
     'Lần test đầu tiên - OK', '', 1),
    (execution_id, test_case_id, tester1_id, 
     NOW() - INTERVAL '1 day' + INTERVAL '14 hours', 
     'Lần test thứ hai - Hoạt động ổn định', '', 2);

    -- Thêm các test execution khác tương tự...
END $$;

-- Example of updating a test case by admin
DO $$ 
DECLARE
    admin_id UUID;
    test_case_id UUID;
BEGIN
    -- Get admin ID
    SELECT id INTO admin_id FROM users WHERE email = 'admin@testcase.com';
    
    -- Get test case ID for update
    SELECT id INTO test_case_id FROM test_cases WHERE tinh_nang LIKE '%đăng nhập với email%';
    
    -- Update test case
    UPDATE test_cases 
    SET so_lan_phai_test = 4,
        updated_at = NOW(),
        updated_by = admin_id
    WHERE id = test_case_id;
    
    -- Record the change in history
    INSERT INTO test_case_history (
        test_case_id, hang_muc, tinh_nang, so_lan_phai_test,
        changed_by, change_type, change_note
    )
    SELECT 
        id, hang_muc, tinh_nang, so_lan_phai_test,
        admin_id, 'UPDATE', 'Tăng số lần test yêu cầu từ 3 lên 4'
    FROM test_cases 
    WHERE id = test_case_id;
END $$; 