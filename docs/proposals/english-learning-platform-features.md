# 영어 학습 플랫폼 기능 기획서

## 📋 문서 정보
- **작성일**: 2026-01-30
- **버전**: v2.0 (한국 앱 통합)
- **프로젝트명**: study-eng-h
- **목적**: 글로벌 & 한국 영어 학습 앱 분석 기반 기능 기획
- **분석 대상**:
  - 🌍 글로벌: Duolingo, Babbel, Busuu, Memrise
  - 🇰🇷 한국: 말해보카, 스픽
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **타겟 시장**: 한국 영어 학습자 (출퇴근족, 직장인, 학생)

---

## 🎯 프로젝트 개요

본 프로젝트는 현대적인 영어 학습 경험을 제공하는 웹 기반 플랫폼입니다. Duolingo, Babbel, Busuu, Memrise 등 글로벌 서비스와 **말해보카**, **스픽(Speak)** 등 한국 시장 선도 앱의 핵심 기능을 분석하여 한국 학습자에게 최적화된 효과적이고 매력적인 학습 경험을 설계합니다.

### 한국 시장 특화 전략
- **짧은 학습 시간 최적화**: 출퇴근 시간 활용 가능한 3-10분 마이크로 학습
- **AI 기반 맞춤형 학습**: 20문제로 레벨 파악 후 개인화된 커리큘럼 제공
- **소리 없이 학습 가능**: 지하철, 사무실 등 어디서나 학습 가능한 텍스트 모드
- **게이미피케이션 극대화**: 리그 시스템, 실시간 랭킹, 보상 시스템으로 학습 동기 부여

---

## 🔍 시장 분석

### 주요 경쟁 서비스 분석

#### [Duolingo](https://blog.duolingo.com/duolingo-updates/)
- **강점**: 게임화, AI 기반 개인화, CEFR 레벨 연동
- **핵심 기능**: Video Call with Lily (AI 대화), Duolingo Score, 스트릭 시스템
- **2026 업데이트**: 172개 신규 코스, 향상된 말하기/듣기 레슨

#### [Babbel](https://testprepinsight.com/comparisons/busuu-vs-babbel/)
- **강점**: 체계적 문법 설명, 실생활 대화 중심
- **핵심 기능**: Babbel Speak (AI 말하기 연습), 정확한 발음 피드백
- **레슨 구조**: 5-15분 짧은 인터랙티브 드릴

#### [Busuu](https://testprepinsight.com/comparisons/busuu-vs-babbel/)
- **강점**: 커뮤니티 피드백, CEFR A1-B2 명시적 커버리지
- **핵심 기능**: 네이티브 스피커 피드백, 다양한 드릴 형식, 비디오 클립
- **차별점**: 실제 사용자 간 상호작용

#### [Memrise](https://testprepinsight.com/comparisons/memrise-vs-babbel/)
- **강점**: Spaced Repetition, 네이티브 스피커 짧은 비디오
- **핵심 기능**: 실제 현지인 발음 영상, 빠른 어휘 확장
- **한계**: 심화 문법 부족 (보완 필요)

---

### 🇰🇷 한국 영어 학습 앱 분석

#### [말해보카 (MalhaeBoca)](https://epop.ai/)
- **슬로건**: "영어, 문제는 단어야" - 어휘 중심 학습 철학
- **핵심 전략**: 게임 개발자 출신이 만든 게이미피케이션 극대화
- **가격**: 월 19,500원 (1인 멤버십)

**주요 기능**:
- **AI 레벨 진단**: 20문제만 풀면 개인 수준 파악, 맞춤형 퀴즈 제공
- **발음 정밀 진단**: 음성 인식으로 발음별 정확도 측정, 표 형식 시각화
- **한글→영어 퀴즈**: 한글 뜻 제시 → 영어 문장 빈칸 채우기 방식
- **글로벌 리그 시스템**: 브론즈~그랜드마스터 12단계, 학습량 기반 순위
- **실전회화 베타**: 어휘부터 실전 회화까지 통합 학습
- **빠른 진도**: 짧은 학습 시간으로 성취감 극대화
- **텍스트 학습 모드**: 소리 없이도 학습 가능

**차별점**:
- 단어 암기 특화 (반복 학습 최적화)
- 게임처럼 재미있는 UX (2025년 대만 앱스토어 전체 1위)
- 자투리 시간 활용 최적화

**적합 대상**: 토익 단어, 어휘력 강화, 빠른 진도 선호 학습자

출처: [말해보카 나무위키](https://namu.wiki/w/%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4), [데일리팝 비교 기사](https://www.dailypop.kr/news/articleView.html?idxno=78193)

---

#### [스픽 (Speak)](https://www.speak.com/)
- **슬로건**: "올해는 트일 것이다" - 말하기 돌파 중심
- **핵심 전략**: ChatGPT 기반 AI 튜터 프리토킹
- **가격**: 연간 129,000원 (월 약 10,750원), 7일 무료 체험

**주요 기능**:
- **AI 튜터**: OpenAI ChatGPT 유료버전 탑재, 플로팅 형태로 언제든 대화
- **3단계 학습 구조**:
  1. 학습 (개념/표현 습득)
  2. 스피킹 연습 (가이드 연습)
  3. 실전 연습 (프리토킹)
- **나만의 수업**: 개인 상황에 맞춘 커스텀 학습 (예: "내일 필요한 영어 면접 준비")
- **롤플레이 프리토킹**: 실생활 상황 시뮬레이션 (카페 주문, 면접, 회의 등)
- **AI 피드백**: 대화 후 어색한 표현, 자연스러운 대안 제시
- **지하철 모드**: 음성 없이 텍스트로만 수강 가능
- **대화형 AI**: 음성 인식을 넘어 '이해하고 반응하는' 네트워크

**차별점**:
- 원어민 없는 프리토킹 (AI와 무제한 대화)
- 실전 회화 중심 (단어 암기보다 말하기 우선)
- 체계적 수업 구성 (일반 AI 앱 대비 구조화)

**적합 대상**: 영어 스피킹, 회화, 프리토킹 실력 향상 목표 학습자

출처: [스픽 공식 사이트](https://www.speak.com/ko/ai-tutor), [스픽 파트너 - AI 튜터 기능](https://speakpartner.kr/ai-%EC%8A%A4%ED%94%BD-%ED%8A%9C%ED%84%B0-%EA%B8%B0%EB%8A%A5-%EC%82%AC%EC%9A%A9%EB%B2%95-%ED%9B%84%EA%B8%B0/)

---

### 한국 vs 글로벌 앱 비교 인사이트

| 요소 | 글로벌 앱 | 한국 앱 | 우리 전략 |
|------|----------|---------|----------|
| **학습 철학** | 종합적 학습 | 전문화 (어휘 or 회화) | 통합 + 선택 집중 옵션 |
| **게이미피케이션** | 기본적 (스트릭, XP) | 극대화 (리그, 실시간 랭킹) | 한국식 강화 |
| **AI 활용** | 보조 기능 | 핵심 기능 (튜터, 진단) | AI 중심 설계 |
| **학습 시간** | 15-20분 권장 | 3-10분 최적화 | 유연한 시간 설정 |
| **소리 없는 학습** | 제한적 | 핵심 기능 | 필수 지원 |
| **가격 정책** | $8-15/월 | ₩10,000-30,000/월 | 한국 시장 맞춤 |

출처: [포도스피킹 - AI 회화 앱 3종 비교](https://blog.podospeaking.com/AI-%ED%9A%8C%ED%99%94-%EC%95%B1-3%EC%A2%85-%EB%B9%84%EA%B5%90-%EC%8A%A4%ED%94%BD,-%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4,-%ED%8F%AC%EB%8F%84%EC%8A%A4%ED%94%BC%ED%82%B9/)

---

### 2026 영어 학습 트렌드
출처: [English Study Helper](https://englishstudyhelper.com/english-learning-trends-2026/)

1. **AI 개인화 학습**: 스트레스 감소, 맞춤형 학습 경로
2. **시각적 학습**: 빠른 이해를 위한 비주얼 콘텐츠
3. **마이크로 연습**: 바쁜 일상에서도 가능한 15분 일일 패턴
4. **멀티모달 학습**: 어휘, 말하기, 쓰기, 시각 예제 통합

---

## 🎨 핵심 기능 설계

### 1. 학습 경로 및 레벨 시스템

#### 1.1 CEFR 기반 레벨 체계
```
A1 (Beginner)     → 표지판, 메뉴의 친숙한 단어 인식
A2 (Elementary)   → 과거 활동에 대해 말하기
B1 (Intermediate) → 공식 이메일 작성, 회의 계획
B2 (Upper-Inter)  → 복잡한 논증 개발 (구두/서면)
C1 (Advanced)     → 전문적 의사소통
C2 (Proficient)   → 네이티브 수준
```

#### 1.2 진행도 추적 시스템
- **Duolingo Score 방식**: 0-120 점수로 어휘/문법 레벨 표시
- **CEFR 매핑**: 점수를 CEFR 레벨로 변환 (예: 59점 = A2)
- **학습 경로 시각화**: 진행률 바, 마일스톤 배지
- **일일 스트릭**: 연속 학습일 추적, 동기 부여

#### 1.3 개인화 학습 경로
- **레벨 테스트**: 초기 진단 평가로 적절한 시작점 결정
- **적응형 난이도**: 사용자 성과에 따른 동적 난이도 조정
- **약점 집중**: AI 분석으로 취약 영역 자동 보완

---

### 2. 어휘 학습 (Vocabulary) - 말해보카 스타일 강화

#### 2.0 **AI 레벨 진단 시스템** 🆕
```typescript
interface AILevelDiagnosis {
  initialTest: {
    questionCount: 20;           // 20문제로 빠른 진단
    timeLimit: '5분';
    questionTypes: ['빈칸채우기', '선다형', '듣고쓰기'];
  };
  aiAnalysis: {
    vocabularyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    weaknessAreas: string[];     // 취약 영역 자동 파악
    recommendedStartPoint: number;
    personalizedQuizGeneration: boolean;
  };
}
```
- **20문제 진단**: 5분 안에 현재 레벨 정확히 파악
- **즉시 맞춤형 학습**: 진단 직후 수준에 맞는 퀴즈 자동 생성
- **약점 집중 공략**: AI가 취약 영역 우선 출제

#### 2.1 **한글→영어 퀴즈 학습** 🆕
```typescript
// 말해보카 핵심 학습 방식
interface KoreanToEnglishQuiz {
  prompt: '한글 뜻';           // 예: "사과"
  sentence: 'I ate an _____ for breakfast.';
  options: ['apple', 'orange', 'banana', 'grape'];
  correctAnswer: 'apple';
  audioEnabled: boolean;        // 선택적 발음 듣기
  textOnlyMode: boolean;        // 소리 없이 학습 가능
}
```
- **한글 단서 제공**: 영어 단어의 한글 뜻 먼저 제시
- **문맥 속 학습**: 실제 문장 빈칸에 단어 채우기
- **빠른 진도**: 문제당 5-10초로 성취감 극대화
- **텍스트 모드**: 지하철, 사무실 등 소리 없이 학습

#### 2.2 **발음 정밀 진단** 🆕
```typescript
interface PronunciationDiagnosis {
  phoneticAnalysis: {
    phonemes: Phoneme[];         // 음소별 분석
    accuracyScore: number;       // 0-100% 정확도
    problemSounds: string[];     // 문제 발음 리스트
  };
  visualFeedback: {
    tableFormat: boolean;        // 표 형식 결과
    colorCoding: 'green' | 'yellow' | 'red';
    waveformComparison: boolean; // 파형 비교
  };
  improvement: {
    targetSounds: string[];      // 집중 연습 음소
    practiceWords: string[];     // 연습 단어 추천
  };
}
```
- **음소별 정확도**: 각 발음(th, r, l 등) 개별 측정
- **표 형식 시각화**: 한눈에 보는 발음 강약점
- **총점 표시**: 전체 발음 점수로 발전 추적
- **맞춤 연습**: 취약 발음 집중 트레이닝

#### 2.3 Spaced Repetition System (SRS)
- **알고리즘**: Memrise 스타일 간격 반복
- **복습 스케줄**: 1일 → 3일 → 7일 → 14일 → 30일
- **기억 강도 표시**: 시각적 인디케이터로 복습 필요도 표시
- **AI 최적화**: 개인별 망각 곡선 학습으로 복습 시점 조정

#### 2.4 인터랙티브 학습 방식
- **플래시카드**: 앞면(영어) / 뒷면(한국어 + 예문)
- **이미지 연상**: 시각적 학습 강화
- **발음 듣기**: 네이티브 발음 오디오 (Memrise 방식)
- **문맥 학습**: 실제 문장 속 단어 사용 예시
- **소리 ON/OFF**: 상황에 맞게 음성 기능 선택

#### 2.5 어휘 카테고리
```
📚 기본 어휘
- 일상 생활 (Daily Life)
- 여행 (Travel)
- 건강 (Health)
- 감정 표현 (Emotions)

💼 시험 대비
- 토익 (TOEIC) - 빈출 단어
- 토플 (TOEFL) - 학술 어휘
- 공무원 시험 - 기출 단어

🎯 실전 어휘
- 비즈니스 (Business)
- 기술 (Technology)
- 관용 표현 (Idioms)
- 구동사 (Phrasal Verbs)
```

#### 2.6 진행도 추적 및 성취 시스템
```typescript
interface VocabularyProgress {
  statistics: {
    totalLearned: number;        // 누적 학습 단어
    masteredWords: number;       // 완벽 습득 단어
    reviewNeeded: number;        // 복습 필요 단어
    dailyGoal: number;           // 일일 목표 (10-20개)
  };
  masteryLevel: {
    beginner: '익숙함';
    intermediate: '복습 필요';
    advanced: '완벽 습득';
  };
  achievements: {
    streak: number;              // 연속 학습일
    fastLearner: boolean;        // 빠른 진도 배지
    pronunciation: number;       // 발음 점수
  };
}
```
- **학습한 단어 수**: 누적 통계 및 시각화
- **숙달도 3단계**: 익숙함 / 복습 필요 / 완벽 습득
- **일일 목표**: 사용자 설정 가능 (기본 10-20개)
- **빠른 성취감**: 짧은 학습으로 즉각적 피드백

---

### 3. 문법 학습 (Grammar)

#### 3.1 체계적 문법 코스 (Babbel 방식)
- **명확한 설명**: 각 문법 포인트별 상세 설명
- **시각적 다이어그램**: 문법 구조 시각화
- **비교 학습**: 혼동하기 쉬운 문법 항목 대조

#### 3.2 인터랙티브 연습
```typescript
// 연습 유형
- Fill in the blanks (빈칸 채우기)
- Multiple choice (선다형)
- Sentence reordering (문장 순서 배열)
- Error correction (오류 수정)
- Transformation (문장 변형)
```

#### 3.3 실시간 피드백
- **즉각적 정답/오답 표시**
- **상세한 설명**: 왜 틀렸는지, 올바른 답은 무엇인지
- **관련 문법 규칙 링크**: 복습 자료 제공

#### 3.4 문법 레벨
```
A1: 기본 시제, 대명사, 관사
A2: 과거/미래 시제, 비교급
B1: 완료 시제, 수동태, 조건문
B2: 가정법, 복잡한 문장 구조
C1: 미묘한 뉘앙스, 고급 문법
```

---

### 4. 말하기 연습 (Speaking) - 스픽 스타일 혁신

#### 4.0 **스픽 3단계 학습 구조** 🆕
```typescript
interface ThreeStageLearningSys {
  stage1_learning: {
    name: '학습 (Learning)';
    duration: '3-5분';
    content: ['핵심 표현', '문법 포인트', '예문 학습'];
    mode: 'video' | 'text' | 'audio';
  };
  stage2_guidedPractice: {
    name: '스피킹 연습 (Guided Practice)';
    duration: '5-7분';
    activities: ['따라 읽기', '빈칸 채워 말하기', '변형 연습'];
    aiSupport: '실시간 발음 교정';
  };
  stage3_realConversation: {
    name: '실전 연습 (Real Practice)';
    duration: '5-10분';
    type: 'AI 프리토킹';
    scenarios: ['상황별 롤플레이', '자유 대화'];
    feedback: 'AI 피드백 제공';
  };
}
```
- **체계적 진행**: 학습 → 연습 → 실전 단계별 학습
- **점진적 난이도**: 안전한 환경에서 자유 대화까지
- **완성형 레슨**: 한 레슨에 모든 요소 통합

#### 4.1 **ChatGPT 기반 AI 튜터 프리토킹** 🆕
```typescript
interface AIFreeTalking {
  aiTutor: {
    model: 'GPT-4';              // OpenAI 최신 모델
    personality: '친근한 원어민 튜터';
    availability: '24/7 무제한';
    floatingUI: true;            // 플로팅 형태 UI
  };
  conversationTypes: {
    roleplay: {
      scenarios: ['카페 주문', '공항 체크인', '면접', '회의', '전화 통화'];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      contextAware: true;        // 상황별 맥락 이해
    };
    freeTalk: {
      topics: ['일상', '취미', '뉴스', '의견 토론'];
      length: 'flexible';
      naturalConversation: true;  // '이해하고 반응하는' 대화
    };
  };
  realTimeFeedback: {
    duringConversation: false;   // 대화 중 방해 없음
    afterConversation: {
      awkwardExpressions: string[];        // 어색한 부분
      betterAlternatives: string[];        // 자연스러운 대안
      grammarCorrections: string[];        // 문법 수정
      vocabularySuggestions: string[];     // 어휘 제안
    };
  };
}
```
- **무제한 프리토킹**: 원어민 없이 AI와 자유롭게 대화
- **실생활 시뮬레이션**: 당장 필요한 상황 연습
- **즉각적 AI 피드백**: 대화 후 어색한 표현, 더 나은 대안 제시
- **자연스러운 대화**: 단순 음성 인식을 넘어 맥락 이해

#### 4.2 **나만의 수업 (Custom Lessons)** 🆕
```typescript
interface CustomLesson {
  userInput: {
    situation: '내일 영어 면접이 있어요';
    specificNeeds: '자기소개와 강점 말하기 연습';
    urgency: 'high';
  };
  aiGeneration: {
    customizedLesson: {
      vocabulary: ['면접 필수 단어 10개'];
      expressions: ['면접에서 쓸 핵심 표현'];
      practice: ['모의 면접 롤플레이'];
      feedback: '면접 답변 평가 및 개선점';
    };
    realTimeAdaptation: true;    // 학습자 반응에 따라 조정
  };
  examples: [
    '후회 표현하는 법 배우기 → 내가 후회하는 일로 연습',
    '감사 인사 배우기 → 실제 감사할 일로 적용',
    '불만 표현하기 → 최근 불만 사항으로 연습'
  ];
}
```
- **개인 맞춤 수업**: 지금 당장 필요한 영어 학습
- **실제 상황 적용**: 학습자의 실제 경험으로 연습
- **즉시 생성**: AI가 몇 초 만에 맞춤 레슨 생성

#### 4.3 **지하철 모드 (Silent Mode)** 🆕
```typescript
interface SubwayMode {
  enabled: boolean;
  features: {
    voiceInput: false;           // 음성 입력 비활성화
    textInput: true;             // 텍스트로 답변 입력
    readingMaterial: true;       // 대화 내용 읽기
    silentCompletion: true;      // 수강 완료 인정
  };
  useCases: ['지하철', '사무실', '도서관', '카페', '늦은 밤'];
}
```
- **소리 없이 학습**: 어디서나 부담 없이 학습 가능
- **텍스트 기반 연습**: 타이핑으로도 회화 연습
- **수강 완료 인정**: 지하철 모드도 정상 학습으로 인정

#### 4.4 발음 평가 시스템 (Babbel Speak + 말해보카 발음 진단)
- **음성 인식**: Web Speech API 활용
- **발음 정확도 점수**: 0-100% 실시간 평가
- **음소별 피드백**: 개별 소리 교정 가이드 (th, r, l, v/b 등)
- **비교 재생**: 네이티브 vs 사용자 발음
- **표 형식 결과**: 발음별 강약점 시각화

#### 4.5 말하기 연습 유형
```typescript
interface SpeakingPracticeTypes {
  guided: {
    repeatAfterMe: '따라 읽기';
    fillInBlanks: '빈칸 채워 말하기';
    transformation: '문장 변형 연습';
  };
  interactive: {
    roleplay: '롤플레이 (카페, 공항, 면접 등)';
    qa: '질문 답변';
    imageDescription: '그림 설명';
  };
  advanced: {
    freeTalking: 'AI 프리토킹';
    debate: '토론';
    presentation: '발표 연습';
  };
}
```

#### 4.6 말하기 진행도 및 AI 분석
```typescript
interface SpeakingProgress {
  pronunciation: {
    overallScore: number;        // 전체 발음 점수
    improvementGraph: Chart;     // 시간별 정확도 추이
    problemSounds: string[];     // 계속 어려운 발음
  };
  fluency: {
    speakingSpeed: number;       // WPM (Words Per Minute)
    pausePattern: Analysis;      // 쉼 패턴 분석
    confidence: number;          // 유창성 점수
  };
  vocabulary: {
    diversityScore: number;      // 어휘 다양성
    newWordsUsed: string[];      // 새로 사용한 단어
    repetitiveWords: string[];   // 반복 사용 단어
  };
  aiInsights: {
    strengths: string[];         // 강점
    areasToImprove: string[];    // 개선 영역
    nextSteps: string[];         // 다음 학습 추천
  };
}
```
- **발음 개선 그래프**: 시간별 정확도 추이 시각화
- **유창성 점수**: 말하기 속도, 쉼 패턴, 자신감 종합 평가
- **어휘 다양성**: 사용한 어휘 범위 측정 및 개선 제안
- **AI 인사이트**: 강점과 약점 자동 분석, 맞춤 추천

---

### 5. 듣기 연습 (Listening)

#### 5.1 네이티브 스피커 콘텐츠 (Memrise + Busuu 방식)
- **짧은 비디오 클립**: 실제 현지인 일상 표현
- **다양한 억양**: 미국, 영국, 호주 등
- **자막 옵션**: 영어/한국어/자막 없음
- **속도 조절**: 0.5x ~ 1.5x 재생 속도

#### 5.2 듣기 이해 연습
```
- Dictation (받아쓰기)
- Multiple choice questions (이해도 문제)
- Summarization (요약하기)
- Fill in missing words (빈칸 채우기)
```

#### 5.3 콘텐츠 카테고리
- **팟캐스트**: 주제별 영어 팟캐스트 큐레이션
- **뉴스**: 일일 영어 뉴스 ([ELLLO](https://www.elllo.org/) 스타일)
- **대화**: 실제 대화 시나리오
- **강연**: TED Talk 스타일 짧은 강연

---

### 6. 읽기 연습 (Reading)

#### 6.1 레벨별 읽기 자료
```
A1-A2: 간단한 문장, 일상 텍스트
B1-B2: 기사, 짧은 에세이
C1-C2: 문학 작품, 학술 텍스트
```

#### 6.2 인터랙티브 리더
- **단어 클릭 사전**: 즉시 뜻 확인
- **하이라이트 & 메모**: 중요 부분 표시
- **읽기 속도 측정**: WPM (Words Per Minute)
- **이해도 퀴즈**: 읽은 내용 확인

#### 6.3 읽기 자료 유형
- Daily News (매일 뉴스)
- Short Stories (단편 소설)
- Blog Posts (블로그 글)
- Academic Articles (학술 기사)

---

### 7. 쓰기 연습 (Writing)

#### 7.1 가이드 쓰기
- **템플릿 기반**: 이메일, 에세이, 리포트 템플릿
- **문장 빌더**: 단어 조합으로 문장 만들기
- **번역 연습**: 한→영 번역 챌린지

#### 7.2 자유 작문
- **주제 프롬프트**: 매일 새로운 글쓰기 주제
- **AI 피드백**: 문법, 어휘, 구조 자동 평가
- **커뮤니티 피드백**: Busuu 방식 네이티브 교정

#### 7.3 쓰기 평가 기준
```
- Grammar accuracy (문법 정확성)
- Vocabulary range (어휘 범위)
- Coherence & cohesion (일관성)
- Task achievement (과제 달성)
```

---

### 8. 게임화 요소 (Gamification) - 말해보카 리그 시스템

#### 8.0 **글로벌 리그 시스템** 🆕
```typescript
interface GlobalLeagueSystem {
  tiers: [
    { name: 'Bronze', range: '0-999점', icon: '🥉', color: '#CD7F32' },
    { name: 'Silver', range: '1000-1999점', icon: '🥈', color: '#C0C0C0' },
    { name: 'Gold', range: '2000-3999점', icon: '🥇', color: '#FFD700' },
    { name: 'Platinum', range: '4000-5999점', icon: '💎', color: '#E5E4E2' },
    { name: 'Diamond', range: '6000-7999점', icon: '💠', color: '#B9F2FF' },
    { name: 'Master', range: '8000-9999점', icon: '🌟', color: '#9C27B0' },
    { name: 'Grand Master', range: '10000+점', icon: '👑', color: '#FF6B6B' }
  ];
  // 총 12단계 (각 티어 내 세부 등급 포함)

  scoring: {
    lessonComplete: 100,         // 레슨 완료
    perfectScore: 150,           // 만점 달성
    dailyStreak: 50,             // 연속 학습
    speaking10min: 200,          // 10분 말하기
    helpCommunity: 100,          // 커뮤니티 기여
    weeklyGoal: 300,             // 주간 목표 달성
  };

  promotion: {
    automatic: true;             // 점수 도달 시 자동 승급
    demotion: false;             // 강등 없음 (동기 부여)
    seasonalReset: false;        // 시즌 리셋 없음
  };

  rewards: {
    tierRewards: {
      bronze: '브론즈 배지',
      silver: '실버 배지 + 프리미엄 1일',
      gold: '골드 배지 + 프리미엄 3일',
      platinum: '플래티넘 배지 + 특별 아바타',
      diamond: '다이아 배지 + 프리미엄 7일',
      master: '마스터 배지 + 프리미엄 14일',
      grandMaster: '그랜드마스터 배지 + 프리미엄 30일 + VIP 채팅방'
    };
    seasonalRewards: '퍼펙트 골드 쿠키 컬렉션 (연 1회)';
  };
}
```
- **12단계 리그**: 브론즈 → 그랜드마스터까지 명확한 진급 시스템
- **학습량 기반 순위**: 공부한 만큼 리그 상승 (실력 + 노력 보상)
- **실시간 랭킹**: 같은 리그 내 경쟁, 상위 도전 의욕
- **시각적 보상**: 티어별 배지, 아이콘, 컬러로 성취감
- **게임처럼 재미**: 게임 개발자가 설계한 중독성 있는 진행감

#### 8.1 경험치(XP) 및 포인트 시스템
```typescript
interface PointSystem {
  xpActions: {
    completeLesson: 10,          // 레슨 완료
    perfectScore: 15,            // 만점
    dailyStreak: 5,              // 일일 연속
    speaking5min: 20,            // 5분 말하기
    helpCommunity: 10,           // 커뮤니티 도움
    reviewWords: 5,              // 단어 복습
    challengeWin: 30,            // 챌린지 승리
  };
  leaguePoints: {
    // 글로벌 리그 점수 (별도 계산)
    multiplier: 10,              // XP의 10배가 리그 포인트
    bonus: {
      perfectWeek: 500,          // 완벽한 주간
      monthlyGoal: 1000,         // 월간 목표
    };
  };
  levels: {
    xpPerLevel: 100,
    maxLevel: 999,
    rewards: Badge | AvatarItem | SpecialFeature | LeagueTierPromotion;
  };
}
```

#### 8.2 스트릭 & 목표 시스템
```typescript
interface StreakAndGoals {
  dailyStreak: {
    current: number;
    longest: number;
    milestones: [7, 14, 30, 60, 100, 365];
    rewards: {
      7일: '🔥 Week Warrior 배지',
      30일: '⚡ Month Master 배지 + 프리미엄 3일',
      100일: '💯 Century Learner 배지 + 프리미엄 7일',
      365일: '🌟 Year Champion 배지 + 프리미엄 30일'
    };
    streakFreeze: {
      available: 3,              // 스트릭 보호권 3개
      earnedBy: '연속 7일 학습';
    };
  };
  weeklyGoals: {
    types: ['시간 목표', '레슨 수', '단어 학습', '말하기 시간'];
    customizable: true;
    defaultGoal: '주 5일, 일 15분';
    rewards: {
      weeklyCompletion: 300 리그 포인트,
      perfectWeek: 500 리그 포인트 + 특별 배지
    };
  };
}
```
- **일일 스트릭**: 연속 학습일 추적, 마일스톤 보상
- **스트릭 보호권**: 하루 못 해도 스트릭 유지 (3회)
- **주간 목표**: 맞춤 설정 가능, 달성 시 리그 포인트
- **완벽한 주간**: 7일 연속 목표 달성 시 특별 보상

#### 8.3 성취 배지 시스템
```typescript
interface AchievementBadges {
  learning: {
    '🏆 First Steps': '첫 레슨 완료',
    '📚 Vocab Master': '1000단어 학습',
    '🎓 Grammar Guru': '50개 문법 레슨 완료',
    '📖 Reading Star': '100개 기사 읽기'
  };
  speaking: {
    '🎤 Speaker Pro': '100회 말하기 연습',
    '💬 Conversation King': '50회 AI 프리토킹',
    '🗣️ Pronunciation Perfect': '발음 평균 90점 이상'
  };
  streaks: {
    '🔥 Week Warrior': '7일 연속 학습',
    '⚡ Month Master': '30일 연속 학습',
    '💯 Century Learner': '100일 연속 학습',
    '🌟 Year Champion': '365일 연속 학습'
  };
  league: {
    '🥉 Bronze Achiever': '브론즈 리그 도달',
    '🥈 Silver Champion': '실버 리그 도달',
    '🥇 Gold Legend': '골드 리그 도달',
    '👑 Grand Master Elite': '그랜드마스터 리그 도달'
  };
  social: {
    '🤝 Community Helper': '10회 피드백 제공',
    '⭐ Top Reviewer': '월간 피드백 1위',
    '🏅 Challenge Winner': '주간 챌린지 우승'
  };
  special: {
    '🎁 Early Adopter': '초기 가입자',
    '💎 Premium Member': '프리미엄 구독 1년',
    '🌏 Global Learner': '글로벌 리그 참여',
    '🍪 Cookie Collector': '2026 퍼펙트 골드 쿠키 컬렉션'
  };
}
```

#### 8.4 리더보드 및 경쟁 시스템
```typescript
interface LeaderboardSystem {
  globalRanking: {
    scope: '전체 사용자';
    metric: '리그 포인트';
    refresh: 'real-time';
    rewards: {
      top10: '특별 배지 + 프리미엄 7일',
      top100: '특별 배지'
    };
  };
  leagueRanking: {
    scope: '동일 리그 내 사용자';
    visible: '상위 50명, 주변 10명';
    promotion: '상위 20% 자동 승급 가속';
  };
  friendsRanking: {
    scope: '친구 목록';
    weeklyChallenge: '주간 학습 시간 경쟁';
    rewards: '승자 특별 배지';
  };
  weeklyChampion: {
    criteria: '주간 최다 학습';
    rewards: '챔피언 배지 + 리그 포인트 보너스';
    hall of Fame: '역대 챔피언 명예의 전당';
  };
}
```
- **글로벌 랭킹**: 전체 사용자 대상 리그 포인트 순위
- **리그 내 랭킹**: 같은 리그 사용자끼리 경쟁
- **친구 랭킹**: 친구와 주간 학습 시간 경쟁
- **주간/월간 챔피언**: 기간별 1위 표창 및 명예의 전당

---

### 9. 커뮤니티 기능

#### 9.1 네이티브 피드백 (Busuu 방식)
- **작문 교정**: 커뮤니티 멤버가 쓰기 연습 교정
- **말하기 평가**: 녹음된 말하기에 대한 피드백
- **포인트 시스템**: 피드백 제공 시 보상

#### 9.2 스터디 그룹
- **관심사 기반 그룹**: 주제별 학습 그룹
- **언어 교환**: 한국어 배우는 영어권 사용자와 매칭
- **스터디 챌린지**: 그룹 목표 달성

#### 9.3 토론 포럼
- **Q&A**: 문법, 어휘 질문
- **학습 팁 공유**: 효과적인 학습 방법
- **리소스 공유**: 유용한 자료 추천

---

### 10. AI 개인화 학습

#### 10.1 적응형 학습 알고리즘
```typescript
interface AdaptiveLearning {
  trackMetrics: {
    accuracy: number;      // 정확도
    speed: number;         // 학습 속도
    retention: number;     // 기억 유지율
    engagement: number;    // 참여도
  };
  adjustDifficulty: 'increase' | 'decrease' | 'maintain';
  recommendContent: Content[];
}
```

#### 10.2 약점 분석
- **오답 패턴 분석**: 자주 틀리는 문법/어휘 식별
- **시간 분석**: 시간이 오래 걸리는 유형 파악
- **맞춤 복습**: 약점 집중 보완 코스

#### 10.3 학습 스타일 인식
```
- Visual learner (시각적): 이미지, 비디오 강조
- Auditory learner (청각적): 듣기, 말하기 강조
- Kinesthetic learner (체험적): 인터랙티브 연습 강조
```

#### 10.4 스마트 추천
- **Next Best Lesson**: AI가 추천하는 다음 레슨
- **Daily Practice Plan**: 개인 맞춤 15분 일일 계획
- **Review Reminders**: 복습이 필요한 콘텐츠 알림

---

## 🛠️ 기술 구현 고려사항

### 10.1 프론트엔드
```typescript
// 기술 스택 (현재)
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4

// 추가 권장 라이브러리
- Zustand / Jotai (상태 관리)
- React Query (서버 상태)
- Framer Motion (애니메이션)
- react-speech-recognition (음성 인식)
- Recharts (진행도 차트)
```

### 10.2 백엔드 (추가 필요)
```typescript
// 권장 스택
- Next.js API Routes / Serverless Functions
- Prisma (ORM)
- PostgreSQL (관계형 DB)
- Redis (캐싱, 세션)
- OpenAI API (AI 피드백)
- AWS S3 (미디어 스토리지)
```

### 10.3 핵심 기능별 기술 선택

#### 음성 인식 & TTS
```
- Web Speech API (기본)
- Google Cloud Speech-to-Text (고급)
- ElevenLabs / AWS Polly (TTS)
```

#### AI 기능
```
- OpenAI GPT-4 (대화, 피드백)
- Claude API (상세 설명, 튜터링)
- Anthropic Prompt Caching (비용 최적화)
```

#### Spaced Repetition
```
- SM-2 Algorithm (SuperMemo)
- Custom implementation with Next.js
```

---

## 📊 MVP (Minimum Viable Product) 우선순위 - 한국 시장 최적화

### Phase 1: 핵심 학습 기능 (4-6주) - 말해보카 스타일 기반
```
✅ 우선순위 1 - 어휘 학습 특화
- 사용자 인증 (이메일/카카오/네이버 소셜 로그인)
- AI 레벨 테스트 (20문제 진단) 🆕
- 한글→영어 퀴즈 시스템 🆕
- 어휘 학습 (플래시카드 + SRS)
- 발음 정밀 진단 기능 🆕
- 진행도 대시보드
- 일일 스트릭 시스템
- 글로벌 리그 시스템 (Bronze~Gold) 🆕
- 텍스트 모드 (소리 없이 학습) 🆕
```

### Phase 2: 말하기 & 인터랙티브 (4-6주) - 스픽 스타일 통합
```
✅ 우선순위 2 - 회화 학습 특화
- 스픽 3단계 학습 구조 🆕
  - Stage 1: 학습 (표현 습득)
  - Stage 2: 가이드 연습 (따라하기)
  - Stage 3: 실전 연습 (프리토킹)
- AI 프리토킹 (ChatGPT 기반) 🆕
- 롤플레이 시나리오 (카페, 공항, 면접) 🆕
- 지하철 모드 (음성 없이 텍스트로 학습) 🆕
- 듣기 연습 (네이티브 오디오)
- 읽기 자료 (5개 기사)
- 게임화 완성 (XP, 배지, 리그 상위 티어)
- 모바일 반응형 디자인
```

### Phase 3: AI 고도화 & 소셜 (6-8주)
```
✅ 우선순위 3 - AI 개인화 강화
- 나만의 수업 (개인 맞춤 레슨 생성) 🆕
- AI 피드백 시스템 (어색한 표현 교정) 🆕
- 커뮤니티 피드백
- 리더보드 (글로벌/리그/친구)
- 스터디 그룹
- 주간 챌린지
- 스트릭 보호권 시스템 🆕
```

### Phase 4: 고급 기능 (지속적)
```
✅ 우선순위 4 - 프리미엄 기능
- 완전 개인화 학습 알고리즘
- 비디오 콘텐츠 (네이티브 클립)
- 모바일 앱 (React Native)
- 오프라인 모드
- 프리미엄 독점 기능
- 그랜드마스터 리그 (Diamond, Master, GM)
- VIP 커뮤니티
```

### 🚀 빠른 출시 전략 (Soft Launch)
```
3주 미니 MVP (테스트 런칭)
- 카카오 로그인
- 20문제 AI 진단
- 한글→영어 퀴즈 100문제
- 기본 리그 시스템 (Bronze, Silver, Gold)
- 일일 스트릭
- 모바일 반응형

목표: 100명 베타 테스터, 피드백 수집
```

---

## 💰 수익 모델 - 한국 시장 맞춤 가격 정책

### 무료 플랜 (Free Tier)
```
기본 학습 제공 + 유료 전환 유도

✅ 포함 기능
- 20문제 AI 레벨 진단
- 기본 어휘/문법 레슨 (일 10단어)
- 한글→영어 퀴즈 (일 20문제)
- 일일 3회 말하기 연습
- 일일 2회 AI 프리토킹 (5분)
- 기본 리그 참여 (Bronze~Gold)
- 커뮤니티 접근
- 광고 포함 (비침습적)

❌ 제한 사항
- 나만의 수업 불가
- 발음 정밀 진단 제한 (주 1회)
- 상위 리그 접근 불가 (Platinum 이상)
- AI 피드백 간소화
- 오프라인 모드 불가
```

### 프리미엄 (₩19,900/월 또는 ₩129,000/년)
```
무제한 학습 + 모든 기능

💎 전체 기능 포함
- 무제한 모든 레슨
- 무제한 AI 프리토킹
- 나만의 수업 무제한 생성
- 발음 정밀 진단 무제한
- 전체 리그 참여 (Diamond~Grand Master)
- 광고 제거
- 오프라인 모드
- 프리미엄 독점 콘텐츠
- 우선 AI 피드백 (고급 분석)
- 상세 진행 리포트 (주간/월간)
- 스트릭 보호권 추가 제공

💰 가격
- 월 구독: ₩19,900 (말해보카와 동일)
- 연 구독: ₩129,000 (월 ₩10,750, 45% 할인 - 스픽과 동일)
- 첫 달 50% 할인: ₩9,950
```

### 프리미엄 플러스 (₩29,900/월)
```
프리미엄 + 1:1 맞춤 케어

⭐ 프리미엄 모든 기능 +
- 개인 AI 튜터 (24시간 질문 답변)
- 월 1회 실제 원어민 화상 수업 (30분)
- 맞춤형 학습 계획 수립
- 개인 진도 관리 및 피드백
- 우선 고객 지원
- 특별 이벤트 우선 참여
- VIP 배지 및 프로필
```

### 평생 이용권 (Lifetime - ₩299,000)
```
영구 프리미엄 + 모든 미래 기능

🏆 포함 내용
- 영구 프리미엄 액세스
- 모든 미래 기능 무료 제공
- VIP 커뮤니티 영구 멤버
- 특별 배지 (Lifetime Member)
- 우선 신기능 베타 테스트
- 연 1회 프리미엄 플러스 체험 (1개월)

💡 투자 가치
- 3년 사용 시 월 ₩8,305
- 5년 사용 시 월 ₩4,983
- 평생 사용 무제한
```

### 단체/기업 플랜 (B2B)
```
교육 기관 및 기업 대상

👥 10인 이상
- ₩15,000/월/인 (연간 계약)
- 관리자 대시보드
- 학습 진행도 모니터링
- 커스텀 학습 경로
- 전담 고객 지원

🏢 100인 이상
- ₩12,000/월/인 (연간 계약)
- 위 모든 기능 +
- API 연동 지원
- 맞춤 콘텐츠 제작
- 정기 리포트 제공
```

### 💳 결제 옵션
```
한국 사용자 편의성 최우선

✅ 지원 결제 수단
- 신용/체크카드
- 카카오페이
- 네이버페이
- 토스페이
- 휴대폰 소액결제
- 계좌이체

🎁 프로모션 전략
- 첫 7일 무료 체험
- 친구 추천 시 양측 1주 프리미엄
- 리그 승급 시 프리미엄 쿠폰
- 생일 할인 (20% 할인 쿠폰)
- 학생 할인 (20% 할인, 학생 인증 필요)
```

### 📊 가격 전략 근거
```
시장 분석 기반 설정

말해보카: ₩19,500/월 → 우리 ₩19,900/월 (유사)
스픽: ₩129,000/년 → 우리 ₩129,000/년 (동일)
듀오링고: $12.99/월 → 우리 ₩19,900/월 (경쟁력)

✅ 전략적 포지셔닝
- 무료 플랜: 높은 진입 장벽 해소, 바이럴 성장
- 월 구독: 말해보카 동급, 부담 없는 가격
- 연 구독: 스픽 동일, 장기 고객 확보
- 평생권: 얼리 어답터 보상, 초기 자금 확보
```

---

## 📈 성공 지표 (KPI)

### 사용자 참여도
```
- DAU/MAU ratio > 40%
- 평균 세션 시간 > 15분
- 7일 리텐션 > 50%
- 30일 리텐션 > 30%
```

### 학습 효과
```
- 평균 CEFR 레벨 향상: 3개월 내 1단계
- 어휘 습득: 월 100-200단어
- 레슨 완료율 > 70%
- 일일 스트릭 평균 > 7일
```

### 비즈니스
```
- Free to Premium 전환율 > 5%
- Churn rate < 10%/월
- NPS (Net Promoter Score) > 50
```

---

## 🎨 UI/UX 디자인 원칙

### 1. 직관적 네비게이션
- 명확한 메뉴 구조
- 학습 경로 시각화
- 빠른 액세스 퀵 메뉴

### 2. 동기부여 디자인
- 진행률 시각화
- 즉각적 피드백
- 성취 축하 애니메이션
- 밝고 친근한 컬러 팔레트

### 3. 모바일 퍼스트
- 터치 최적화
- 오프라인 지원
- 가벼운 번들 사이즈
- PWA 지원

### 4. 접근성
- WCAG 2.1 AA 준수
- 키보드 네비게이션
- 스크린 리더 지원
- 고대비 모드

---

## 🔐 보안 & 프라이버시

### 데이터 보호
```
- HTTPS 전용
- 비밀번호 bcrypt 해싱
- JWT 토큰 인증
- GDPR 준수
- 개인정보 최소 수집
```

### 음성 데이터
```
- 서버 전송 전 암호화
- 처리 후 즉시 삭제
- 사용자 동의 필수
- 로컬 처리 옵션 제공
```

---

## 📚 참고 자료

### 글로벌 서비스 출처
- [Duolingo Blog - 2026 Updates](https://blog.duolingo.com/duolingo-updates/)
- [Duolingo 2025 Product Highlights](https://blog.duolingo.com/product-highlights/)
- [Test Prep Insight - Busuu vs Babbel Comparison](https://testprepinsight.com/comparisons/busuu-vs-babbel/)
- [English Study Helper - 2026 Learning Trends](https://englishstudyhelper.com/english-learning-trends-2026/)
- [British Council - Speaking Practice](https://learnenglish.britishcouncil.org/skills/speaking)
- [ELLLO - Listening Lessons](https://www.elllo.org/)
- [SmallTalk2Me - AI Speaking Practice](https://smalltalk2.me/)

### 한국 서비스 출처 🇰🇷
- [말해보카 공식 웹사이트](https://epop.ai/)
- [말해보카 나무위키](https://namu.wiki/w/%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4)
- [말해보카 App Store](https://apps.apple.com/kr/app/%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4-%EC%98%81%EB%8B%A8%EC%96%B4-%EB%AC%B8%EB%B2%95-%EB%A6%AC%EC%8A%A4%EB%8B%9D-%EC%8A%A4%ED%94%BC%ED%82%B9-%EC%98%81%EC%96%B4-%EA%B3%B5%EB%B6%80/id1460766549)
- [스픽 공식 웹사이트](https://www.speak.com/)
- [스픽 AI 튜터 소개](https://www.speak.com/ko/ai-tutor)
- [스픽 나무위키](https://namu.wiki/w/%EC%8A%A4%ED%94%BD)
- [스픽 파트너 - AI 튜터 기능 리뷰](https://speakpartner.kr/ai-%EC%8A%A4%ED%94%BD-%ED%8A%9C%ED%84%B0-%EA%B8%B0%EB%8A%A5-%EC%82%AC%EC%9A%A9%EB%B2%95-%ED%9B%84%EA%B8%B0/)
- [데일리팝 - 영어 공부 앱 4종 비교](https://www.dailypop.kr/news/articleView.html?idxno=78193)
- [포도스피킹 - AI 회화 앱 3종 비교](https://blog.podospeaking.com/AI-%ED%9A%8C%ED%99%94-%EC%95%B1-3%EC%A2%85-%EB%B9%84%ED%91%9C-%EC%8A%A4%ED%94%BD,-%EB%A7%90%ED%95%B4%EB%B3%B4%EC%B9%B4,-%ED%8F%AC%EB%8F%84%EC%8A%A4%ED%94%BC%ED%82%B9/)

### 학습 방법론
- CEFR (Common European Framework of Reference)
- Spaced Repetition System (SRS)
- Comprehensible Input (Stephen Krashen)
- Task-Based Language Learning
- AI-Powered Adaptive Learning
- Gamification in Education

---

## 🚀 다음 단계

### 즉시 시작 가능
1. **프로젝트 구조 설계**: 폴더 구조, 라우팅
2. **디자인 시스템**: 컬러, 타이포그래피, 컴포넌트
3. **데이터베이스 스키마**: 사용자, 레슨, 진행도
4. **MVP 기능 개발**: Phase 1 우선순위 기능

### 추가 조사 필요
1. **라이센스**: 오디오/비디오 콘텐츠 저작권
2. **AI API 비용**: OpenAI, Anthropic 가격 분석
3. **인프라**: 호스팅, CDN, 스토리지 비용
4. **법률**: 교육 콘텐츠 관련 규제

---

## 📞 문의 및 협업
본 기획서에 대한 질문이나 제안사항이 있으시면 프로젝트 이슈를 생성해주세요.

---

## 📝 업데이트 히스토리

### v2.0 - 2026-01-30 (한국 앱 분석 반영)
- **말해보카** 핵심 기능 통합: AI 레벨 진단, 한글→영어 퀴즈, 발음 정밀 진단, 글로벌 리그 시스템
- **스픽** 핵심 기능 통합: ChatGPT 기반 AI 프리토킹, 3단계 학습 구조, 나만의 수업, 지하철 모드
- 한국 시장 맞춤 가격 정책 (₩19,900/월, ₩129,000/년)
- 게이미피케이션 강화 (12단계 리그 시스템)
- 한국 사용자 특화 기능 (소리 없이 학습, 짧은 학습 시간)

### v1.0 - 2026-01-30 (초기 버전)
- 글로벌 앱 분석 (Duolingo, Babbel, Busuu, Memrise)
- 기본 기능 설계 (어휘, 문법, 말하기, 듣기, 읽기, 쓰기)
- MVP 로드맵 수립

**최종 업데이트**: 2026-01-30 v2.0 (한국 앱 통합)
