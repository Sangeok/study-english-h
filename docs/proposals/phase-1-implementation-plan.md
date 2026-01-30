# Phase 1: 핵심 학습 기능 구현 계획서

## 📋 문서 정보
- **작성일**: 2026-01-30
- **프로젝트명**: study-eng-h
- **버전**: v1.0
- **목표**: 어휘 학습 특화 MVP 개발 (4-6주)
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **타겟 사용자**: 한국 영어 학습자 (출퇴근족, 직장인, 학생)

---

## 🎯 Phase 1 핵심 목표

### 우선순위: **어휘 학습 특화 (말해보카 스타일)**

Phase 1은 **한글→영어 퀴즈** 중심의 빠른 어휘 학습 경험을 제공하며, 게이미피케이션을 통해 한국 사용자에게 최적화된 학습 동기부여 시스템을 구축합니다.

**핵심 가치 제안**:
- ✅ **3-5분 마이크로 러닝**: 바쁜 일상에서 즉시 학습
- ✅ **AI 개인화**: 20문제로 현재 레벨 파악 후 맞춤형 학습
- ✅ **소리 없이 학습**: 지하철, 사무실 등 어디서나 가능
- ✅ **게이미피케이션**: 리그 시스템, 실시간 랭킹으로 지속적 동기부여

---

## 📊 Phase 1 기능 범위

### ✅ 포함되는 기능 (MVP)

| 기능 | 설명 | 우선순위 | 완성도 |
|------|------|---------|--------|
| **사용자 인증** | 이메일/카카오/네이버 소셜 로그인 | P1 | 필수 |
| **AI 레벨 진단** | 20문제로 5분 내 레벨 파악 | P1 | 필수 |
| **한글→영어 퀴즈** | 한글 뜻 제시 후 영어 단어/문장 선택 | P1 | 필수 |
| **어휘 학습** | 플래시카드 + Spaced Repetition | P1 | 필수 |
| **발음 정밀 진단** | Web Speech API 활용 음소별 분석 | P1 | 필수 |
| **진행도 대시보드** | 학습량, 습득 단어, 레벨 시각화 | P1 | 필수 |
| **일일 스트릭** | 연속 학습일 추적 및 보상 | P1 | 필수 |
| **글로벌 리그** | Bronze~Gold 6단계 리그 시스템 | P1 | 필수 |
| **텍스트 모드** | 음성 없이 텍스트로만 학습 | P1 | 필수 |
| **기본 배지** | 성취 배지 시스템 (20개 기본 배지) | P2 | 선택 |

### ❌ Phase 1에서 제외되는 기능

- 🔄 스픽 3단계 구조 (Phase 2)
- 🔄 AI 프리토킹 (Phase 2)
- 🔄 커뮤니티 피드백 (Phase 3)
- 🔄 실시간 리더보드 (Phase 3)
- 🔄 모바일 네이티브 앱 (Phase 4)
- 🔄 프리미엄 구독 결제 시스템 (Phase 3)

---

## 🏗️ 기술 아키텍처

### 프론트엔드 스택
```
┌─────────────────────────────────────┐
│   Next.js 16 (App Router)           │
├─────────────────────────────────────┤
│ React 19 + TypeScript 5             │
├─────────────────────────────────────┤
│ Tailwind CSS 4 + shadcn/ui          │
├─────────────────────────────────────┤
│ State: Zustand / Jotai              │
│ Forms: React Hook Form              │
│ Charts: Recharts                    │
│ Auth: next-auth v5                  │
├─────────────────────────────────────┤
│ Speech: Web Speech API              │
│ Animation: Framer Motion            │
└─────────────────────────────────────┘
```

### 백엔드 스택 (필수 추가 개발)
```
┌─────────────────────────────────────┐
│   Next.js API Routes                │
├─────────────────────────────────────┤
│ Database: PostgreSQL + Prisma ORM   │
├─────────────────────────────────────┤
│ Cache: Redis (세션, 캐싱)           │
├─────────────────────────────────────┤
│ Auth: NextAuth v5 + JWT             │
├─────────────────────────────────────┤
│ Storage: AWS S3 (음성 파일)         │
│ Speech API: Google Cloud             │
└─────────────────────────────────────┘
```

### 데이터베이스 스키마 (핵심 테이블)
```typescript
// 사용자 관련
Users (id, email, kakaoId, naverId, name, createdAt)
UserProfiles (userId, level, totalXP, currentStreak, longestStreak)
UserStatistics (userId, totalWordLearned, masteredWords, reviewNeeded)

// 학습 콘텐츠
Lessons (id, type, difficulty, title, content)
Vocabularies (id, word, meaning, example, category, level)
QuizQuestions (id, koreanHint, sentence, options, correctAnswer)

// 학습 진행도
UserProgress (userId, lessonId, status, completedAt, accuracy)
UserVocabulary (userId, vocabularyId, masteryLevel, lastReviewDate, nextReviewDate)
UserQuizAttempts (userId, questionId, selectedAnswer, isCorrect, timeSpent)

// 게이미피케이션
UserLeague (userId, leaguePoints, tier, joinedAt)
UserStreak (userId, currentStreak, longestStreak, lastStudyDate)
UserAchievements (userId, achievementId, unlockedAt)

// 발음 분석
PronunciationAttempts (userId, word, audioUrl, overallScore, phonemeScores, timestamp)
```

---

## 📱 핵심 기능 상세 설계

### 1. 사용자 인증 시스템

#### 1.1 지원 로그인 방식
```typescript
interface AuthMethods {
  email: {
    signup: boolean;        // 이메일 회원가입
    signin: boolean;        // 이메일 로그인
    passwordReset: boolean; // 비밀번호 재설정
  };
  socialLogin: {
    kakao: {
      enable: true;
      redirectUrl: 'https://study-eng-h.com/api/auth/kakao/callback';
    };
    naver: {
      enable: true;
      redirectUrl: 'https://study-eng-h.com/api/auth/naver/callback';
    };
  };
}
```

#### 1.2 회원가입 플로우
```
1. 로그인 선택 (이메일/카카오/네이버)
2. 기본 정보 입력 (이름, 이메일)
3. 학습 목표 설정 (선택사항)
4. AI 레벨 진단 실시 (아래 1.3 참고)
5. 홈 대시보드로 이동
```

#### 1.3 프로필 관리
- 사용자 프로필 이미지
- 닉네임 (학습용 공개 닉네임)
- 학습 목표
- 선호 카테고리

---

### 2. AI 레벨 진단 시스템

#### 2.1 초기 진단 (회원가입 직후)
```typescript
interface AILevelDiagnosis {
  testConfig: {
    questionCount: 20;           // 총 20문제
    timeLimit: 300;              // 5분 (초 단위)
    questionTypes: [
      'koreanToEnglish',         // 한글→영어 선택
      'multipleChoice',          // 4지선다형
      'sentenceCompletion'       // 문장 빈칸 채우기
    ];
  };

  aiAnalysis: {
    ctoScore: number;            // CEFR 환산 점수 (0-100)
    cefrlevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    weaknessAreas: {
      category: string;          // 예: "동사", "형용사"
      accuracy: number;          // 정확도 %
    }[];
    recommendedStartPoint: number; // 추천 시작 단계
  };

  immediateAction: {
    customQuizGeneration: true;  // 즉시 맞춤형 퀴즈 생성
    focusAreas: string[];        // 약점 우선 출제
  };
}
```

**진단 알고리즘**:
```
1. 20문제 풀이 (3단계 난이도 혼합)
2. 각 문제별 정확도 계산
3. 약점 영역 식별 (정확도 < 60%)
4. CEFR 레벨 매핑:
   - 0-20점: A1 (완전 초보)
   - 21-40점: A2 (초등)
   - 41-60점: B1 (중급)
   - 61-80점: B2 (중상)
   - 81-95점: C1 (상급)
   - 96-100점: C2 (최상급)
5. 맞춤형 퀴즈 생성 (약점 영역 50%, 일반 영역 50%)
```

#### 2.2 재진단 (월 1회 권장)
- 진행도 확인용 간단한 테스트
- 10문제, 3분
- 레벨 변화 감지

---

### 3. 한글→영어 퀴즈 학습

#### 3.1 퀴즈 구조
```typescript
interface KoreanToEnglishQuiz {
  // 기본 정보
  quizId: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: 'daily' | 'business' | 'toeic' | 'travel' | 'idioms';

  // 학습 내용
  koreanHint: '사과';                              // 한글 힌트
  englishWord: 'apple';                            // 정답 영어
  sentence: 'I ate an _____ for breakfast.';       // 문맥 문장

  // 선택지
  options: [
    { text: 'apple', isCorrect: true },
    { text: 'orange', isCorrect: false },
    { text: 'banana', isCorrect: false },
    { text: 'grape', isCorrect: false }
  ];

  // 부가 정보
  exampleSentence: 'An apple a day keeps the doctor away.';
  pronunciation: 'əˈpəl';
  audioUrl: 'https://s3.aws.com/audio/apple.mp3';

  // 학습 모드
  textOnlyMode: boolean;              // 소리 없이 학습
  showPronunciation: boolean;         // 발음 표시
  showExample: boolean;               // 예문 표시
}
```

#### 3.2 퀴즈 플로우
```
화면 1: 한글 힌트 표시 (3초)
        ↓ (선택사항) 발음 듣기
화면 2: 영어 문장 + 4개 선택지
        사용자 선택
        ↓
화면 3: 정답 표시 및 피드백
        - 정답: 축하 애니메이션 + XP 획득
        - 오답: 정답 설명 + 예문 표시
        ↓
화면 4: 다음 문제 또는 세션 종료
```

#### 3.3 퀴즈 자동 생성
- 사용자 레벨 기반 난이도 자동 조정
- 약점 영역 우선 출제 (AI 분석)
- 매일 6AM 자동 생성 (일일 신선한 컨텐츠)
- 사용자별 맞춤 풀 (1000+ 문제)

---

### 4. 어휘 학습 시스템 (Spaced Repetition)

#### 4.1 플래시카드 뷰
```
앞면:     [영어 단어]
          apple

배면:     [한글 뜻]
          사과

          [예문]
          I like eating apples.

          [발음]
          /ˈæpəl/

          [음성 버튼]
          🔊 들으려면 클릭
```

#### 4.2 SRS (Spaced Repetition System) 알고리즘
```typescript
interface SRSSchedule {
  masteryLevels: {
    new: {
      description: '처음 배운 단어',
      nextReview: '1일 후'
    };
    learning: {
      description: '복습 필요',
      nextReview: '3일 → 7일 → 14일'
    };
    reviewing: {
      description: '주기적 복습',
      nextReview: '30일 → 60일 → 90일'
    };
    mastered: {
      description: '완벽 습득',
      nextReview: '180일'
    };
  };

  algorithm: `
    1. 새 단어 추가 → 1일 후 첫 복습
    2. 정답: easy(+7일), normal(+3일), hard(+1일)
    3. 오답: 레벨 리셋 → 1일 후 재학습
    4. 연속 정답 3회 → 마스터 레벨로 승격
    5. 마스터 단어도 180일마다 복습 필수
  `;
}
```

#### 4.3 학습 모드 옵션
```
1️⃣ 매칭 모드: 한글 뜻과 영어 단어 짝맞추기
2️⃣ 선택 모드: 정답을 4개 선택지에서 선택
3️⃣ 타이핑 모드: 영어 단어 직접 입력
4️⃣ 듣기 모드: 영어 발음 듣고 선택
5️⃣ 플래시카드 모드: 앞뒤 넘기기
```

---

### 5. 발음 정밀 진단 시스템

#### 5.1 음성 인식 & 분석
```typescript
interface PronunciationDiagnosis {
  recordingConfig: {
    duration: 30;              // 최대 30초 녹음
    format: 'webm' | 'wav';
    sampleRate: 44100;
  };

  analysisResults: {
    overallScore: number;      // 0-100 전체 점수

    phonemeAnalysis: {
      phoneme: 'æ' | 'p' | 'əl';  // IPA 음소
      accuracy: number;        // 정확도 %
      severity: 'excellent' | 'good' | 'fair' | 'needs-improvement';
    }[];

    timing: {
      speakingRate: number;    // WPM (단어/분)
      pausePattern: 'natural' | 'hesitant' | 'fluent';
    };

    feedback: {
      strengths: string[];     // 잘한 부분
      areasToImprove: string[]; // 개선 필요 부분
      nextPracticeFocus: string; // 다음 연습 추천
    };
  };

  visualization: {
    format: 'table';           // 음소별 표 형식
    colorCoding: 'green' | 'yellow' | 'red';
    waveformComparison: boolean; // 원어민 vs 사용자 파형
  };
}
```

#### 5.2 표 형식 결과 (UI)
```
┌─────────┬─────────┬─────────┬──────────┐
│ 음소    │ 정확도  │ 상태    │ 피드백   │
├─────────┼─────────┼─────────┼──────────┤
│ æ (a)   │ 92%     │ ✅      │ 우수     │
│ p (p)   │ 78%     │ ⚠️      │ 개선필요 │
│ əl (ul) │ 65%     │ ❌      │ 집중     │
└─────────┴─────────┴─────────┴──────────┘

전체 점수: 78/100
```

#### 5.3 기술 구현
```
프론트엔드:
- Web Speech API (기본, 무료)
- MediaRecorder API (녹음)

백엔드:
- Google Cloud Speech-to-Text (고급, 유료)
- 음소 분석 라이브러리 (phoneme-recognizer)

폴백:
- Web Speech API만으로 기본 분석
- 정확도 제한적이나 MVP에서는 충분
```

---

### 6. 진행도 대시보드

#### 6.1 메인 대시보드 구성
```
┌──────────────────────────────────┐
│    오늘의 학습: 32/50 XP 달성   │
│                                  │
│  [████████░░] 64%               │
│                                  │
├──────────────────────────────────┤
│ 📚 학습 통계                     │
│                                  │
│ 총 학습 단어: 324개              │
│ 마스터한 단어: 156개 (48%)      │
│ 복습 필요: 89개                  │
│                                  │
├──────────────────────────────────┤
│ 🔥 연속 학습: 7일                │
│ 🏆 현재 리그: Silver (1,245/2000) │
│                                  │
├──────────────────────────────────┤
│ 📊 이번 주 활동                  │
│ 월: 45분, 화: 32분, 수: 28분    │
│ 목: 56분, 금: 0분, 토: 15분    │
│                                  │
└──────────────────────────────────┘
```

#### 6.2 상세 통계
- 일일/주간/월간 학습 시간
- 카테고리별 학습 현황
- 정확도 추이 그래프
- 레벨 진행도 (A1 → A2 진행 중)
- 습득한 단어 목록 (내보내기 가능)

#### 6.3 데이터 시각화
```typescript
interface DashboardCharts {
  learningTime: {
    type: 'line';              // 일일 학습 시간 추이
    period: '7일' | '30일' | '전체';
  };

  vocabularyProgress: {
    type: 'pie';               // 단어 습득도 분포
    labels: ['마스터', '복습필요', '학습중', '새로운'];
  };

  categoryBreakdown: {
    type: 'bar';               // 카테고리별 학습량
    categories: ['일상', '비즈니스', 'TOEIC', '여행'];
  };

  accuracyTrend: {
    type: 'area';              // 정확도 추이
    threshold: 70;             // 목표 정확도 라인
  };
}
```

---

### 7. 일일 스트릭 & 목표 시스템

#### 7.1 스트릭 메커니즘
```typescript
interface DailyStreak {
  currentStreak: {
    count: number;             // 현재 연속일
    lastStudyDate: Date;
    streakStartDate: Date;
  };

  longestStreak: {
    count: number;             // 최장 연속일
    achievedAt: Date;
  };

  streakFreeze: {
    available: 3;              // 3회 사용 가능
    earnedBy: '7일 연속 달성';
    canUseWhen: '하루 못 할 때';
  };

  milestones: {
    7: { reward: '🔥 Week Warrior 배지 + 50 XP' };
    14: { reward: '⚡ Two Weeks Strong 배지 + 100 XP' };
    30: { reward: '⚡ Month Master 배지 + 프리미엄 3일' };
    100: { reward: '💯 Century Learner 배지 + 프리미엄 7일' };
    365: { reward: '🌟 Year Champion 배지 + 프리미엄 30일' };
  };
}
```

#### 7.2 스트릭 UI
```
🔥 7일 연속 학습 중!
┌─ 🌕 🌕 🌕 🌕 🌕 🌕 ◯ ─┐
└────────────────────────┘
내일 학습하면 8일!

🎯 미션 진행률
  ├─ 오늘 15분 학습 ✅
  └─ 10개 단어 학습 ✅
```

#### 7.3 일일 목표
```
사용자가 설정 가능:
- 학습 시간: 5분, 10분, 15분, 20분, 30분
- 단어 목표: 10, 15, 20, 30, 50개
- 퀴즈 목표: 10, 20, 30문제

기본값: 10분 학습 + 15개 단어
```

---

### 8. 글로벌 리그 시스템 (6단계)

#### 8.1 리그 구조
```typescript
interface LeagueSystem {
  tiers: [
    {
      tier: 1,
      name: 'Bronze',
      pointRange: '0-999',
      icon: '🥉',
      color: '#CD7F32',
      rewards: '기본 배지'
    },
    {
      tier: 2,
      name: 'Silver',
      pointRange: '1000-1999',
      icon: '🥈',
      color: '#C0C0C0',
      rewards: '실버 배지 + 프리미엄 1일'
    },
    {
      tier: 3,
      name: 'Gold',
      pointRange: '2000-3999',
      icon: '🥇',
      color: '#FFD700',
      rewards: '골드 배지 + 프리미엄 3일'
    },
    {
      tier: 4,
      name: 'Platinum',
      pointRange: '4000-5999',
      icon: '💎',
      color: '#E5E4E2',
      rewards: '플래티넘 배지 + 특별 아바타'
    },
    {
      tier: 5,
      name: 'Diamond',
      pointRange: '6000-7999',
      icon: '💠',
      color: '#B9F2FF',
      rewards: '다이아 배지 + 프리미엄 7일'
    },
    {
      tier: 6,
      name: 'Master',
      pointRange: '8000+',
      icon: '🌟',
      color: '#9C27B0',
      rewards: '마스터 배지 + 프리미엄 14일'
    }
  ];

  pointSystem: {
    lessonComplete: 100,       // 레슨 완료
    perfectScore: 150,         // 만점 달성
    dailyStreak: 50,           // 연속 학습일
    dailyGoalAchieved: 200,    // 일일 목표 달성
    weeklyGoal: 300,           // 주간 목표 달성
  };

  promotion: {
    automatic: true;           // 포인트 도달 시 자동 승급
    demotion: false;           // 강등 없음
    seasonalReset: false;      // 시즌 리셋 없음 (계속 누적)
  };
}
```

#### 8.2 리그 UI
```
┌─────────────────────────────────┐
│ 🥈 Silver 리그                  │
│ 1,245 / 2,000 포인트           │
│ [████████░░] 62%              │
│                                 │
│ 목표: Gold 달성 (남은 양: 755)  │
│ 예상 도달: 1주일               │
└─────────────────────────────────┘

📊 리그 내 순위
┌────┬─────────────┬─────────┐
│ 순 │ 닉네임      │ 포인트  │
├────┼─────────────┼─────────┤
│ 1  │ StudyKing   │ 1,890   │
│ 2  │ WordMaster  │ 1,756   │
│ 3  │ 나 (YOU)    │ 1,245   │
│ 4  │ LearnerPro  │ 1,100   │
└────┴─────────────┴─────────┘
```

#### 8.3 승급 조건 (예시)
```
Bronze → Silver: 1000 포인트 도달
Silver → Gold: 2000 포인트 도달
Gold → Platinum: 4000 포인트 도달

일반 사용자 예상 진행:
- Bronze: 초기 (0-1주)
- Silver: 초보 (1-2주)
- Gold: 중급 (2-4주)
- Platinum+: 고급 (4주 이상)
```

---

### 9. 텍스트 모드 (Silent Mode)

#### 9.1 기능 설명
```typescript
interface SilentMode {
  enabled: true;

  features: {
    voiceRecording: false;     // 음성 녹음 비활성화
    audioPlayback: false;      // 음성 재생 비활성화
    textInput: true;           // 텍스트 입력 활성화
    readingMode: true;         // 텍스트 읽기 모드

    // 퀴즈에서
    koreanHintShown: true;     // 한글 힌트 텍스트
    sentenceShown: true;       // 영어 문장 텍스트
    pronunciationText: true;   // 발음 기호 텍스트 (예: /ˈæpəl/)

    // 플래시카드에서
    cardFlip: true;            // 앞뒤 넘기기
    exampleText: true;         // 예문 텍스트
  };

  useCases: [
    '지하철 출퇴근',
    '사무실',
    '도서관',
    '카페',
    '수업 중',
    '회의실',
    '늦은 밤 공부'
  ];

  completionCredit: {
    sameAsNormal: true;        // 정상 학습으로 인정
    pointsAwarded: true;       // 동일 포인트 제공
    streakCounted: true;       // 스트릭에 포함
  };
}
```

#### 9.2 UI 전환
```
[🔊 음성] [🔇 텍스트] ← 오른쪽 버튼 클릭하면
                     텍스트 모드로 전환

텍스트 모드 UI:
- 모든 음성 버튼 숨김
- 발음 기호로 표시
- 타이핑으로 답변 입력
- 음성 피드백 없음 (텍스트만)
```

#### 9.3 음성 없는 발음 진단
```
텍스트 모드에서 발음 진단 선택:
1. 단어 텍스트 표시
2. "녹음할 준비 되셨나요?" 메시지
3. 음성 녹음 요청
4. 음성만으로 진단 (해석은 텍스트로 표시)
```

---

### 10. 기본 배지 시스템 (선택사항)

#### 10.1 Phase 1 배지 (20개 기본)
```typescript
interface Badges {
  learning: {
    '🏆 First Step': '첫 레슨 완료',
    '📚 Vocab 10': '10개 단어 학습',
    '📚 Vocab 50': '50개 단어 학습',
    '📚 Vocab 100': '100개 단어 학습',
    '📚 Vocab 500': '500개 단어 학습',
    '🎓 Grammar Start': '첫 문법 레슨',
    '🎓 Grammar 10': '10개 문법 레슨'
  };

  streak: {
    '🔥 7-Day': '7일 연속',
    '⚡ 14-Day': '14일 연속',
    '⚡ 30-Day': '30일 연속',
    '💯 100-Day': '100일 연속'
  };

  accuracy: {
    '✨ Accuracy 80': '정확도 80% 이상',
    '✨ Perfect Day': '하루 완벽 정확도',
    '🎯 Focus Master': '약점 영역 10회 연속 정답'
  };

  league: {
    '🥉 Bronze': '브론즈 도달',
    '🥈 Silver': '실버 도달',
    '🥇 Gold': '골드 도달'
  };

  special: {
    '🎁 Early Adopter': '초기 가입자',
    '🌏 Global Learner': '글로벌 리그 참여'
  };
}
```

#### 10.2 배지 표시
```
프로필에 최근 획득 배지 3개 표시
배지 클릭하면 상세 정보 표시:
- 배지 이름
- 획득 조건
- 획득 일시
- 진행도 (예: 50/100 단어)
```

---

## 📂 프로젝트 구조

```
study-eng-h/
├── app/
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── page.tsx                   # 홈페이지
│   ├── auth/                      # 인증 관련
│   │   ├── signup/page.tsx
│   │   ├── signin/page.tsx
│   │   ├── callback/[provider]    # OAuth 콜백
│   │   └── reset-password/page.tsx
│   ├── dashboard/                 # 메인 대시보드
│   │   ├── page.tsx               # 대시보드 메인
│   │   ├── quiz/page.tsx          # 퀴즈 학습
│   │   ├── flashcard/page.tsx     # 플래시카드
│   │   ├── diagnosis/page.tsx     # 발음 진단
│   │   ├── profile/page.tsx       # 사용자 프로필
│   │   └── statistics/page.tsx    # 통계 상세
│   └── api/                       # API 라우트
│       ├── auth/
│       │   ├── [...nextauth].ts
│       │   ├── kakao/callback.ts
│       │   └── naver/callback.ts
│       ├── level-diagnosis/
│       │   └── route.ts
│       ├── quiz/
│       │   ├── route.ts           # 퀴즈 조회
│       │   └── submit.ts          # 퀴즈 제출
│       ├── vocabulary/
│       │   └── route.ts
│       ├── pronunciation/
│       │   └── analyze.ts
│       ├── progress/
│       │   └── route.ts
│       └── league/
│           ├── route.ts           # 리그 정보
│           └── leaderboard.ts     # 랭킹
│
├── components/
│   ├── shared/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── StreakBadge.tsx
│   │   └── LeagueCard.tsx
│   ├── quiz/
│   │   ├── QuizContainer.tsx
│   │   ├── QuizQuestion.tsx
│   │   ├── AnswerOptions.tsx
│   │   └── QuizFeedback.tsx
│   ├── flashcard/
│   │   ├── FlashcardDeck.tsx
│   │   ├── FlashcardCard.tsx
│   │   └── StudyMode.tsx
│   ├── pronunciation/
│   │   ├── RecordingButton.tsx
│   │   ├── PronunciationResult.tsx
│   │   └── PhonemeTable.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── ProgressCard.tsx
│   │   ├── StatisticsChart.tsx
│   │   └── LeagueProgress.tsx
│   └── auth/
│       ├── SignupForm.tsx
│       ├── SigninForm.tsx
│       └── OAuthButtons.tsx
│
├── lib/
│   ├── auth.ts                    # NextAuth 설정
│   ├── db.ts                      # Prisma 클라이언트
│   ├── api.ts                     # API 호출
│   ├── constants.ts               # 상수
│   ├── srs.ts                     # SRS 알고리즘
│   ├── pronunciation.ts           # 발음 분석
│   └── utils.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useQuiz.ts
│   ├── useProgress.ts
│   ├── useLeague.ts
│   ├── useVocabulary.ts
│   └── useSpeech.ts
│
├── types/
│   ├── index.ts
│   ├── auth.ts
│   ├── quiz.ts
│   ├── vocabulary.ts
│   ├── progress.ts
│   └── league.ts
│
├── styles/
│   ├── globals.css
│   ├── quiz.css
│   └── animations.css
│
├── public/
│   ├── images/
│   ├── icons/
│   └── audio/
│
├── prisma/
│   ├── schema.prisma              # DB 스키마
│   └── seed.ts                    # 초기 데이터
│
├── .env.local                     # 환경 변수
├── .env.example
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 🔄 개발 일정 (4-6주)

### Week 1-2: 기초 설계 & 인증
```
✅ 프로젝트 초기 설정
   - Next.js 16 프로젝트 생성
   - TypeScript 설정
   - Tailwind CSS 통합
   - Prisma ORM 설정
   - PostgreSQL 연동

✅ 인증 시스템
   - NextAuth v5 구현
   - 이메일 회원가입/로그인
   - 카카오/네이버 OAuth 연동
   - JWT 토큰 관리

✅ 기본 대시보드
   - 레이아웃 구성
   - 네비게이션 구현
   - 프로필 페이지
```

### Week 2-3: AI 레벨 진단 & 퀴즈
```
✅ AI 레벨 진단 시스템
   - 20문제 진단 문제 생성
   - 알고리즘 구현
   - 정확도 계산
   - CEFR 매핑

✅ 한글→영어 퀴즈
   - 퀴즈 컴포넌트 개발
   - 선택지 렌더링
   - 정오답 로직
   - 피드백 시스템
   - 문제 풀 구성 (초기 500문제)
```

### Week 3-4: 어휘 학습 & SRS
```
✅ 플래시카드 시스템
   - 카드 렌더링
   - 앞뒤 넘기기
   - 학습 모드

✅ Spaced Repetition
   - SRS 알고리즘 구현
   - 복습 스케줄
   - DB 저장

✅ 어휘 통계
   - 학습 단어 추적
   - 마스터도 계산
   - 복습 필요 표시
```

### Week 4-5: 발음 진단 & 스트릭
```
✅ 발음 정밀 진단
   - Web Speech API 통합
   - 음소 분석 (기본)
   - 표 형식 결과
   - 피드백 생성

✅ 일일 스트릭 시스템
   - 스트릭 추적
   - 마일스톤 보상
   - 스트릭 보호권

✅ 텍스트 모드
   - 음성 비활성화 옵션
   - UI 전환
```

### Week 5-6: 리그 시스템 & 최적화
```
✅ 글로벌 리그 시스템
   - 6단계 리그 구현
   - 포인트 시스템
   - 자동 승급
   - 리더보드

✅ 진행도 대시보드
   - 통계 대시보드
   - 차트 시각화
   - 일일/주간/월간 통계

✅ 배지 시스템 (기본 20개)
   - 배지 로직
   - 배지 표시

✅ 최적화 & QA
   - 성능 최적화
   - 버그 수정
   - 반응형 디자인 검증
```

---

## 🧪 테스트 전략

### 단위 테스트
```
- SRS 알고리즘 테스트
- 포인트 계산 로직
- CEFR 레벨 매핑
- 배지 언락 조건
```

### 통합 테스트
```
- 회원가입 → 레벨 진단 → 퀴즈 학습 플로우
- 어휘 학습 → SRS 복습 플로우
- 발음 녹음 → 분석 → 결과 표시
```

### E2E 테스트
```
- 전체 사용자 여정 테스트 (Playwright)
- 각 주요 기능 시나리오
- 모바일 반응형 테스트
```

### 성능 테스트
```
- 페이지 로드 시간 < 2초
- 첫 번째 콘텐츠 렌더링 < 1초
- 퀴즈 응답 < 500ms
```

---

## 📊 성공 지표 (Phase 1)

### 기술적 성공 지표
```
✅ 기능 완성도 > 95%
✅ 버그 심각도: Critical 0건, High < 3건
✅ 테스트 커버리지 > 70%
✅ Lighthouse 점수 > 85
✅ 페이지 로드 시간 < 2초
```

### 사용자 경험 지표
```
✅ 회원가입 완료율 > 80%
✅ AI 진단 완료율 > 90%
✅ 첫 퀴즈 완료율 > 85%
✅ 7일 리텐션 > 40%
✅ 평균 세션 시간 > 10분
```

### 학습 효과 지표
```
✅ 평균 정확도 > 65%
✅ 레슨 완료율 > 70%
✅ 일일 스트릭 평균 > 3일
✅ 단어 습득 > 월 50개
```

---

## 🚀 출시 전략 (Soft Launch)

### 3주 미니 MVP (테스트 런칭)
```
✅ 필수 기능만 구현
   - 소셜 로그인 (카카오)
   - 20문제 AI 진단
   - 한글→영어 퀴즈 (100문제)
   - 기본 리그 시스템 (Bronze, Silver, Gold)
   - 일일 스트릭
   - 반응형 디자인

✅ 베타 테스터 모집: 100명
   - 한국 영어 학습자
   - 20-50대 직장인/학생
   - 피드백 수집

✅ 피드백 수집 & 개선
   - 사용성 이슈 개선
   - 퀴즈 난이도 조정
   - 버그 수정

✅ 정식 출시: 6주 후
```

### 정식 출시 (Phase 1 완성)
```
✅ 모든 Phase 1 기능 완성
✅ 발음 진단 시스템 통합
✅ 텍스트 모드 추가
✅ 마케팅 캠페인 시작
✅ 초기 100명 → 1000명 확대
```

---

## 💡 주요 기술 결정사항

### 1. Web Speech API vs 고급 음성 인식
**결정**: Phase 1은 Web Speech API 사용
- ✅ 무료 (비용 없음)
- ✅ 클라이언트 사이드 처리 (빠름)
- ✅ MVP에 충분한 정확도
- ⚠️ 정확도 제한적 (Google Cloud로 Phase 2 업그레이드)

### 2. SRS 알고리즘 직접 구현
**결정**: SM-2 기반 커스텀 구현
- ✅ 비용 없음
- ✅ 완전 제어 가능
- ✅ 한국 학습자 맞춤화 가능

### 3. 실시간 리더보드
**결정**: Phase 1은 기본 리더보드만 (5초마다 갱신)
- ✅ 개발 복잡도 낮음
- ✅ 서버 부하 적음
- 🔄 Phase 3에서 WebSocket 실시간 업그레이드

### 4. 초기 콘텐츠
**결정**: 500-1000개 수작업 문제 생성 + AI 자동 생성
- ✅ 퀄리티 보증
- ✅ 다양성 확보
- 🔄 Phase 2에서 콘텐츠 풀 확대 (5000+)

---

## 🔐 보안 & 프라이버시

### 데이터 보호
```
✅ HTTPS 전용
✅ 비밀번호: bcrypt 해싱 (salt rounds: 10)
✅ JWT 토큰: 15분 유효기간, Refresh 토큰 7일
✅ 민감정보 암호화 (Redis + TLS)
```

### 음성 데이터 처리
```
✅ 로컬 처리: Web Speech API로 사용자 브라우저에서 처리
✅ 서버 전송 전 암호화
✅ 분석 후 즉시 삭제 (30분 이내)
✅ 사용자 동의 필수
✅ 개인정보보호법 준수
```

### OAuth 보안
```
✅ PKCE 흐름 사용
✅ State 파라미터 검증
✅ Scope 최소화
✅ 정기 토큰 갱신
```

---

## 📚 참고 자료 & 의존성

### 핵심 라이브러리
```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^4.0.0",
  "next-auth": "^5.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "zustand": "^4.0.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "recharts": "^2.10.0",
  "framer-motion": "^10.0.0"
}
```

### 외부 API & 서비스
```
- Google Cloud Speech-to-Text (Phase 2)
- OpenAI API (Phase 2+)
- AWS S3 (음성 파일 저장)
- Redis (캐싱/세션)
- PostgreSQL (데이터베이스)
```

---

## 🎓 학습 자료 & 참고

### 영어 학습 플랫폼
- [Duolingo](https://www.duolingo.com)
- [말해보카](https://epop.ai/)
- [스픽](https://www.speak.com/)
- [Babbel](https://www.babbel.com/)

### 기술 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Prisma 가이드](https://www.prisma.io/docs/)
- [NextAuth.js 문서](https://next-auth.js.org/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### CEFR & 학습 이론
- [Common European Framework of Reference](https://www.coe.int/en/web/common-european-framework-reference-languages)
- [Spaced Repetition System](https://en.wikipedia.org/wiki/Spaced_repetition)

---

## 📝 체크리스트

### 개발 시작 전
- [ ] 팀 역할 분담 (FE, BE, DevOps)
- [ ] 개발 환경 설정
- [ ] Git 리포지토리 생성
- [ ] CI/CD 파이프라인 구성
- [ ] 디자인 시스템 확정

### 개발 중
- [ ] 주 2회 스프린트 미팅
- [ ] 일일 진행도 업데이트
- [ ] 버그 추적 (Issue)
- [ ] 코드 리뷰 (PR)

### 출시 전
- [ ] 최종 QA 완료
- [ ] 성능 최적화 완료
- [ ] 보안 감사 완료
- [ ] 개인정보보호 정책 작성
- [ ] 이용약관 작성

---

## 🔄 다음 단계

### Phase 1 완료 후 (6주)
1. ✅ 베타 테스트 피드백 수집
2. ✅ 초기 1000명 사용자 확보
3. ✅ 마케팅 캠페인 시작
4. ✅ Phase 2 계획 수립 (말하기 연습)

### Phase 2 준비 (동시 진행 가능)
- 스픽 3단계 학습 구조 설계
- ChatGPT API 연동 계획
- 롤플레이 시나리오 작성
- 음성 처리 고도화

---

## 📞 문의 & 협업

본 Phase 1 계획에 대한 질문이나 제안사항이 있으시면:
1. GitHub Issue 생성
2. 프로젝트 Slack 채널
3. 주간 기획 미팅

---

**최종 업데이트**: 2026-01-30
**문서 버전**: v1.0 (Phase 1 초기 계획)
