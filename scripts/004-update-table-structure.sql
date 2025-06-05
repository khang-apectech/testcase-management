-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS test_executions CASCADE;
DROP TABLE IF EXISTS user_test_assignments CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;

-- Create new test_cases table with updated structure
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hang_muc VARCHAR(255) NOT NULL,  -- Hạng mục
    tinh_nang TEXT NOT NULL,         -- Tính năng
    so_lan_phai_test INTEGER DEFAULT 1 NOT NULL,  -- Số lần phải test (admin quy định)
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create new test_executions table
CREATE TABLE test_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    tester_id UUID REFERENCES users(id),
    so_lan_da_test INTEGER DEFAULT 0,  -- Số lần đã test (user điền)
    cam_nhan TEXT,                     -- Cảm nhận
    loi TEXT,                          -- Lỗi
    execution_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate user_test_assignments table
CREATE TABLE user_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_case_id)
);

-- Create indexes
CREATE INDEX idx_test_executions_test_case_id ON test_executions(test_case_id);
CREATE INDEX idx_test_executions_tester_id ON test_executions(tester_id);
CREATE INDEX idx_user_test_assignments_user_id ON user_test_assignments(user_id);
CREATE INDEX idx_user_test_assignments_test_case_id ON user_test_assignments(test_case_id);
