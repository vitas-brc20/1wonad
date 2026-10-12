-- King of the Hill (점령전) 전광판용 스키마 추가/수정

-- 1. messages 테이블에 점령전 관련 컬럼 추가 (기존 컬럼이 있을 경우 누락된 것만 추가)
ALTER TABLE IF EXISTS messages 
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reign_seconds INTEGER DEFAULT 0;

-- 2. 새 테이블 생성 시 (초기 세팅용)
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    text VARCHAR(100) NOT NULL,
    nickname VARCHAR(30) NOT NULL,
    contact VARCHAR(100),
    amount INTEGER NOT NULL DEFAULT 1000,
    tid VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    replaced_at TIMESTAMPTZ,
    reign_seconds INTEGER DEFAULT 0
);

-- 인덱스 생성 (최신 점령 메시지 조회 속도 향상)
CREATE INDEX IF NOT EXISTS idx_messages_status_paid_at ON messages(status, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_amount ON messages(amount DESC);

-- 3. 실시간 변경사항 구독(Supabase Realtime) 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
