-- BaseEntity 상속 테이블 전체에 created_by 컬럼 추가 (@CreatedBy 감사 필드)
-- 기존 행은 감사 정보가 없으므로 'SYSTEM'으로 채운다 (JpaAuditingConfig의 미인증 기본값과 동일).
--
-- 조건부(PREPARE)로 작성한 이유:
--   - 신규 환경: Flyway가 Hibernate(ddl-auto)보다 먼저 실행되어 테이블이 아직 없음 → 스킵
--   - 기존 환경: 테이블은 있고 컬럼만 없음 → ALTER 실행
--   (MySQL은 ADD COLUMN IF NOT EXISTS를 지원하지 않음)

SET @stmt = IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = 'users')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'created_by'),
    'ALTER TABLE users ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT ''SYSTEM''',
    'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt = IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = 'projects')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'created_by'),
    'ALTER TABLE projects ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT ''SYSTEM''',
    'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt = IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = 'partners')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'partners' AND column_name = 'created_by'),
    'ALTER TABLE partners ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT ''SYSTEM''',
    'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt = IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = 'partner_contacts')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'partner_contacts' AND column_name = 'created_by'),
    'ALTER TABLE partner_contacts ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT ''SYSTEM''',
    'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt = IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = 'schedules')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'schedules' AND column_name = 'created_by'),
    'ALTER TABLE schedules ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT ''SYSTEM''',
    'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt = IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema = DATABASE() AND table_name = 'files')
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'files' AND column_name = 'created_by'),
    'ALTER TABLE files ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT ''SYSTEM''',
    'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
