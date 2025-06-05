-- Assign App test cases to ALL testers
INSERT INTO user_test_assignments (user_id, test_case_id, assigned_at)
SELECT u.id, tc.id, NOW()
FROM users u
JOIN test_cases tc ON tc.hang_muc LIKE 'App%'
WHERE u.email IN (
  'trankieu@testcase.com',
  'camly@testcase.com',
  'thanhtuyen@testcase.com',
  'hoanlong@testcase.com',
  'quandung@testcase.com',
  'thanhdat@testcase.com',
  'quocdu@testcase.com'
)
ON CONFLICT (user_id, test_case_id) DO NOTHING;

-- Assign CMS test cases to 4 testers: Dũng, Long, Du, Đạt
INSERT INTO user_test_assignments (user_id, test_case_id, assigned_at)
SELECT u.id, tc.id, NOW()
FROM users u
JOIN test_cases tc ON tc.hang_muc LIKE 'CMS%'
WHERE u.email IN (
  'quandung@testcase.com',
  'hoanlong@testcase.com',
  'thanhdat@testcase.com',
  'quocdu@testcase.com'
)
ON CONFLICT (user_id, test_case_id) DO NOTHING;
