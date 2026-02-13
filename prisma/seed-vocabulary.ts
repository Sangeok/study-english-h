/**
 * Vocabulary Seed Script
 *
 * Seeds the database with 1500 vocabulary entries distributed across:
 * - Levels: 250 A1, 250 A2, 250 B1, 250 B2, 250 C1, 250 C2
 * - Categories: 40% daily, 25% toeic, 20% business, 15% travel
 */

import prisma from "../lib/db";
import baseVocabularies from "./data/vocabularies.json";
import extraA1A2 from "./data/vocabularies-extra-a1-a2.json";
import extraB1B2 from "./data/vocabularies-extra-b1-b2.json";
import extraC1C2 from "./data/vocabularies-extra-c1-c2.json";
import extraSupplement from "./data/vocabularies-extra-supplement.json";

// Additional vocabulary data to reach 1000 entries
const additionalVocabulariesA2 = [
  { word: "understand", meaning: "이해하다", pronunciation: "ˌʌn.dərˈstænd", exampleSentence: "I understand the problem.", category: "daily", level: "A2" },
  { word: "remember", meaning: "기억하다", pronunciation: "rɪˈmem.bər", exampleSentence: "I can't remember his name.", category: "daily", level: "A2" },
  { word: "forget", meaning: "잊다", pronunciation: "fərˈɡet", exampleSentence: "Don't forget your homework.", category: "daily", level: "A2" },
  { word: "begin", meaning: "시작하다", pronunciation: "bɪˈɡɪn", exampleSentence: "Let's begin the lesson.", category: "daily", level: "A2" },
  { word: "finish", meaning: "끝내다", pronunciation: "ˈfɪn.ɪʃ", exampleSentence: "I finished my work.", category: "daily", level: "A2" },
  { word: "continue", meaning: "계속하다", pronunciation: "kənˈtɪn.juː", exampleSentence: "Please continue reading.", category: "daily", level: "A2" },
  { word: "try", meaning: "시도하다", pronunciation: "traɪ", exampleSentence: "Try your best.", category: "daily", level: "A2" },
  { word: "change", meaning: "바꾸다, 변화", pronunciation: "tʃeɪndʒ", exampleSentence: "I need to change my clothes.", category: "daily", level: "A2" },
  { word: "move", meaning: "움직이다, 이사하다", pronunciation: "muːv", exampleSentence: "Don't move!", category: "daily", level: "A2" },
  { word: "turn", meaning: "돌다, 회전하다", pronunciation: "tɜːrn", exampleSentence: "Turn left at the corner.", category: "daily", level: "A2" },
  { word: "wait", meaning: "기다리다", pronunciation: "weɪt", exampleSentence: "Please wait here.", category: "daily", level: "A2" },
  { word: "stay", meaning: "머물다", pronunciation: "steɪ", exampleSentence: "Stay with me.", category: "daily", level: "A2" },
  { word: "meet", meaning: "만나다", pronunciation: "miːt", exampleSentence: "Nice to meet you.", category: "daily", level: "A2" },
  { word: "follow", meaning: "따라가다", pronunciation: "ˈfɑː.loʊ", exampleSentence: "Follow me.", category: "daily", level: "A2" },
  { word: "bring", meaning: "가져오다", pronunciation: "brɪŋ", exampleSentence: "Bring your book tomorrow.", category: "daily", level: "A2" },
  { word: "carry", meaning: "나르다", pronunciation: "ˈkær.i", exampleSentence: "Can you carry this bag?", category: "daily", level: "A2" },
  { word: "hold", meaning: "잡다", pronunciation: "hoʊld", exampleSentence: "Hold my hand.", category: "daily", level: "A2" },
  { word: "catch", meaning: "잡다", pronunciation: "kætʃ", exampleSentence: "Catch the ball!", category: "daily", level: "A2" },
  { word: "throw", meaning: "던지다", pronunciation: "θroʊ", exampleSentence: "Don't throw stones.", category: "daily", level: "A2" },
  { word: "pull", meaning: "당기다", pronunciation: "pʊl", exampleSentence: "Pull the door.", category: "daily", level: "A2" },
  { word: "push", meaning: "밀다", pronunciation: "pʊʃ", exampleSentence: "Push the button.", category: "daily", level: "A2" },
  { word: "break", meaning: "부수다", pronunciation: "breɪk", exampleSentence: "Don't break the glass.", category: "daily", level: "A2" },
  { word: "fix", meaning: "고치다", pronunciation: "fɪks", exampleSentence: "Can you fix my bike?", category: "daily", level: "A2" },
  { word: "build", meaning: "짓다", pronunciation: "bɪld", exampleSentence: "They're building a house.", category: "daily", level: "A2" },
  { word: "draw", meaning: "그리다", pronunciation: "drɔː", exampleSentence: "She can draw well.", category: "daily", level: "A2" },
  { word: "paint", meaning: "페인트칠하다", pronunciation: "peɪnt", exampleSentence: "Let's paint the wall.", category: "daily", level: "A2" },
  { word: "cut", meaning: "자르다", pronunciation: "kʌt", exampleSentence: "Cut the paper.", category: "daily", level: "A2" },
  { word: "cook", meaning: "요리하다", pronunciation: "kʊk", exampleSentence: "My mom cooks well.", category: "daily", level: "A2" },
  { word: "wash", meaning: "씻다", pronunciation: "wɑːʃ", exampleSentence: "Wash the dishes.", category: "daily", level: "A2" },
  { word: "clean", meaning: "청소하다", pronunciation: "kliːn", exampleSentence: "Clean your room.", category: "daily", level: "A2" },
  { word: "wear", meaning: "입다", pronunciation: "wer", exampleSentence: "What should I wear?", category: "daily", level: "A2" },
  { word: "choose", meaning: "선택하다", pronunciation: "tʃuːz", exampleSentence: "Choose one.", category: "daily", level: "A2" },
  { word: "decide", meaning: "결정하다", pronunciation: "dɪˈsaɪd", exampleSentence: "I can't decide.", category: "daily", level: "A2" },
  { word: "feel", meaning: "느끼다", pronunciation: "fiːl", exampleSentence: "I feel happy.", category: "daily", level: "A2" },
  { word: "hope", meaning: "희망하다", pronunciation: "hoʊp", exampleSentence: "I hope so.", category: "daily", level: "A2" },
  { word: "wish", meaning: "바라다", pronunciation: "wɪʃ", exampleSentence: "I wish I could fly.", category: "daily", level: "A2" },
  { word: "believe", meaning: "믿다", pronunciation: "bɪˈliːv", exampleSentence: "I believe you.", category: "daily", level: "A2" },
  { word: "laugh", meaning: "웃다", pronunciation: "læf", exampleSentence: "Don't laugh at me.", category: "daily", level: "A2" },
  { word: "cry", meaning: "울다", pronunciation: "kraɪ", exampleSentence: "Why are you crying?", category: "daily", level: "A2" },
  { word: "smile", meaning: "미소짓다", pronunciation: "smaɪl", exampleSentence: "Smile for the camera!", category: "daily", level: "A2" },
  { word: "worry", meaning: "걱정하다", pronunciation: "ˈwɜːr.i", exampleSentence: "Don't worry about it.", category: "daily", level: "A2" },
  { word: "miss", meaning: "그리워하다", pronunciation: "mɪs", exampleSentence: "I miss my family.", category: "daily", level: "A2" },
  { word: "arrive", meaning: "도착하다", pronunciation: "əˈraɪv", exampleSentence: "We arrived late.", category: "travel", level: "A2" },
  { word: "leave", meaning: "떠나다", pronunciation: "liːv", exampleSentence: "When do you leave?", category: "travel", level: "A2" },
  { word: "return", meaning: "돌아오다", pronunciation: "rɪˈtɜːrn", exampleSentence: "I'll return tomorrow.", category: "travel", level: "A2" },
  { word: "visit", meaning: "방문하다", pronunciation: "ˈvɪz.ɪt", exampleSentence: "Let's visit the museum.", category: "travel", level: "A2" },
  { word: "travel", meaning: "여행하다", pronunciation: "ˈtræv.əl", exampleSentence: "I love to travel.", category: "travel", level: "A2" },
  { word: "trip", meaning: "여행", pronunciation: "trɪp", exampleSentence: "Have a nice trip!", category: "travel", level: "A2" },
  { word: "vacation", meaning: "휴가", pronunciation: "veɪˈkeɪ.ʃən", exampleSentence: "I'm on vacation.", category: "travel", level: "A2" },
  { word: "holiday", meaning: "휴일", pronunciation: "ˈhɑː.lə.deɪ", exampleSentence: "Happy holidays!", category: "travel", level: "A2" },
  { word: "interview", meaning: "면접", pronunciation: "ˈɪn.tər.vjuː", exampleSentence: "I have a job interview.", category: "business", level: "A2" },
  { word: "meeting", meaning: "회의", pronunciation: "ˈmiː.tɪŋ", exampleSentence: "The meeting starts at 2.", category: "business", level: "A2" },
  { word: "office", meaning: "사무실", pronunciation: "ˈɔː.fɪs", exampleSentence: "I work in an office.", category: "business", level: "A2" },
  { word: "manager", meaning: "관리자", pronunciation: "ˈmæn.ɪ.dʒər", exampleSentence: "Talk to the manager.", category: "business", level: "A2" },
  { word: "employee", meaning: "직원", pronunciation: "ɪmˈplɔɪ.iː", exampleSentence: "All employees must attend.", category: "business", level: "A2" },
  { word: "customer", meaning: "고객", pronunciation: "ˈkʌs.tə.mər", exampleSentence: "The customer is always right.", category: "business", level: "A2" },
  { word: "service", meaning: "서비스", pronunciation: "ˈsɜːr.vɪs", exampleSentence: "The service was excellent.", category: "business", level: "A2" },
  { word: "quality", meaning: "품질", pronunciation: "ˈkwɑː.lə.t̬i", exampleSentence: "This product has good quality.", category: "business", level: "A2" },
  { word: "product", meaning: "제품", pronunciation: "ˈprɑː.dʌkt", exampleSentence: "Our new product is popular.", category: "business", level: "A2" },
  { word: "company", meaning: "회사", pronunciation: "ˈkʌm.pə.ni", exampleSentence: "I work for a big company.", category: "business", level: "A2" },
];

const additionalVocabulariesB1 = [
  { word: "achieve", meaning: "달성하다", pronunciation: "əˈtʃiːv", exampleSentence: "She achieved her goal.", category: "toeic", level: "B1" },
  { word: "advantage", meaning: "이점", pronunciation: "ədˈvæn.t̬ɪdʒ", exampleSentence: "There are many advantages.", category: "toeic", level: "B1" },
  { word: "affect", meaning: "영향을 주다", pronunciation: "əˈfekt", exampleSentence: "This will affect the results.", category: "business", level: "B1" },
  { word: "approach", meaning: "접근하다", pronunciation: "əˈproʊtʃ", exampleSentence: "Let's try a different approach.", category: "business", level: "B1" },
  { word: "assume", meaning: "가정하다", pronunciation: "əˈsuːm", exampleSentence: "Don't assume anything.", category: "daily", level: "B1" },
  { word: "attach", meaning: "첨부하다", pronunciation: "əˈtætʃ", exampleSentence: "Please attach the file.", category: "toeic", level: "B1" },
  { word: "attitude", meaning: "태도", pronunciation: "ˈæt̬.ə.tuːd", exampleSentence: "He has a positive attitude.", category: "daily", level: "B1" },
  { word: "benefit", meaning: "혜택", pronunciation: "ˈben.ə.fɪt", exampleSentence: "This has many benefits.", category: "business", level: "B1" },
  { word: "capacity", meaning: "용량, 능력", pronunciation: "kəˈpæs.ə.t̬i", exampleSentence: "The hall has a large capacity.", category: "business", level: "B1" },
  { word: "challenge", meaning: "도전", pronunciation: "ˈtʃæl.ɪndʒ", exampleSentence: "This is a big challenge.", category: "daily", level: "B1" },
  { word: "circumstance", meaning: "상황", pronunciation: "ˈsɜːr.kəm.stæns", exampleSentence: "Under the circumstances...", category: "daily", level: "B1" },
  { word: "colleague", meaning: "동료", pronunciation: "ˈkɑː.liːɡ", exampleSentence: "She's my colleague.", category: "business", level: "B1" },
  { word: "consequence", meaning: "결과", pronunciation: "ˈkɑːn.sə.kwens", exampleSentence: "There will be consequences.", category: "daily", level: "B1" },
  { word: "consideration", meaning: "고려", pronunciation: "kənˌsɪd.əˈreɪ.ʃən", exampleSentence: "Thank you for your consideration.", category: "business", level: "B1" },
  { word: "convince", meaning: "확신시키다", pronunciation: "kənˈvɪns", exampleSentence: "I'm convinced it's true.", category: "daily", level: "B1" },
  { word: "decline", meaning: "감소하다", pronunciation: "dɪˈklaɪn", exampleSentence: "Sales are declining.", category: "business", level: "B1" },
  { word: "definition", meaning: "정의", pronunciation: "ˌdef.əˈnɪʃ.ən", exampleSentence: "What's the definition?", category: "daily", level: "B1" },
  { word: "demonstrate", meaning: "시연하다", pronunciation: "ˈdem.ən.streɪt", exampleSentence: "Let me demonstrate how it works.", category: "business", level: "B1" },
  { word: "determine", meaning: "결정하다", pronunciation: "dɪˈtɜːr.mɪn", exampleSentence: "We need to determine the cause.", category: "daily", level: "B1" },
  { word: "emphasize", meaning: "강조하다", pronunciation: "ˈem.fə.saɪz", exampleSentence: "I must emphasize this point.", category: "daily", level: "B1" },
];

const additionalVocabulariesB2 = [
  { word: "accommodate", meaning: "수용하다", pronunciation: "əˈkɑː.mə.deɪt", exampleSentence: "The hotel can accommodate 200 guests.", category: "business", level: "B2" },
  { word: "acknowledge", meaning: "인정하다", pronunciation: "əkˈnɑː.lɪdʒ", exampleSentence: "I acknowledge my mistake.", category: "business", level: "B2" },
  { word: "adequate", meaning: "적절한", pronunciation: "ˈæd.ə.kwət", exampleSentence: "We need adequate resources.", category: "business", level: "B2" },
  { word: "arbitrary", meaning: "임의의", pronunciation: "ˈɑːr.bɪ.trer.i", exampleSentence: "The decision seems arbitrary.", category: "daily", level: "B2" },
  { word: "assess", meaning: "평가하다", pronunciation: "əˈses", exampleSentence: "We need to assess the situation.", category: "toeic", level: "B2" },
  { word: "attribute", meaning: "속성, 귀속시키다", pronunciation: "əˈtrɪb.juːt", exampleSentence: "Success can be attributed to hard work.", category: "daily", level: "B2" },
  { word: "collaborate", meaning: "협력하다", pronunciation: "kəˈlæb.ə.reɪt", exampleSentence: "We need to collaborate more.", category: "business", level: "B2" },
  { word: "comprehensive", meaning: "포괄적인", pronunciation: "ˌkɑːm.prɪˈhen.sɪv", exampleSentence: "We need a comprehensive plan.", category: "business", level: "B2" },
  { word: "constituent", meaning: "구성요소", pronunciation: "kənˈstɪtʃ.u.ənt", exampleSentence: "The constituent parts are complex.", category: "daily", level: "B2" },
  { word: "constraint", meaning: "제약", pronunciation: "kənˈstreɪnt", exampleSentence: "We face budget constraints.", category: "business", level: "B2" },
  { word: "contemplate", meaning: "심사숙고하다", pronunciation: "ˈkɑːn.t̬əm.pleɪt", exampleSentence: "I'm contemplating my options.", category: "daily", level: "B2" },
  { word: "controversy", meaning: "논쟁", pronunciation: "ˈkɑːn.trə.vɜːr.si", exampleSentence: "The decision caused controversy.", category: "daily", level: "B2" },
  { word: "criterion", meaning: "기준", pronunciation: "kraɪˈtɪr.i.ən", exampleSentence: "What are the criteria?", category: "business", level: "B2" },
  { word: "dedicate", meaning: "헌신하다", pronunciation: "ˈded.ɪ.keɪt", exampleSentence: "She dedicated her life to research.", category: "daily", level: "B2" },
  { word: "dimension", meaning: "차원", pronunciation: "daɪˈmen.ʃən", exampleSentence: "Consider all dimensions of the problem.", category: "daily", level: "B2" },
  { word: "diminish", meaning: "감소시키다", pronunciation: "dɪˈmɪn.ɪʃ", exampleSentence: "The risk has diminished.", category: "business", level: "B2" },
  { word: "discrete", meaning: "별개의", pronunciation: "dɪˈskriːt", exampleSentence: "These are discrete issues.", category: "daily", level: "B2" },
  { word: "eliminate", meaning: "제거하다", pronunciation: "ɪˈlɪm.ə.neɪt", exampleSentence: "We must eliminate errors.", category: "business", level: "B2" },
  { word: "empirical", meaning: "경험적인", pronunciation: "ɪmˈpɪr.ɪ.kəl", exampleSentence: "We need empirical evidence.", category: "daily", level: "B2" },
  { word: "enhance", meaning: "향상시키다", pronunciation: "ɪnˈhæns", exampleSentence: "This will enhance performance.", category: "business", level: "B2" },
];

const additionalVocabulariesC1 = [
  { word: "accumulate", meaning: "축적하다", pronunciation: "əˈkjuː.mjə.leɪt", exampleSentence: "Evidence has accumulated over time.", category: "daily", level: "C1" },
  { word: "ambiguous", meaning: "모호한", pronunciation: "æmˈbɪɡ.ju.əs", exampleSentence: "The statement is ambiguous.", category: "daily", level: "C1" },
  { word: "coherent", meaning: "일관성 있는", pronunciation: "koʊˈhɪr.ənt", exampleSentence: "Present a coherent argument.", category: "business", level: "C1" },
  { word: "comprise", meaning: "구성하다", pronunciation: "kəmˈpraɪz", exampleSentence: "The team comprises 10 members.", category: "business", level: "C1" },
  { word: "conceive", meaning: "생각해내다", pronunciation: "kənˈsiːv", exampleSentence: "It's hard to conceive of such a thing.", category: "daily", level: "C1" },
  { word: "concurrent", meaning: "동시에 발생하는", pronunciation: "kənˈkɜːr.ənt", exampleSentence: "The events were concurrent.", category: "daily", level: "C1" },
  { word: "differentiate", meaning: "구별하다", pronunciation: "ˌdɪf.əˈren.ʃi.eɪt", exampleSentence: "We must differentiate between them.", category: "daily", level: "C1" },
  { word: "discern", meaning: "식별하다", pronunciation: "dɪˈsɜːrn", exampleSentence: "I can discern a pattern.", category: "daily", level: "C1" },
  { word: "exploit", meaning: "이용하다", pronunciation: "ɪkˈsplɔɪt", exampleSentence: "We should exploit this opportunity.", category: "business", level: "C1" },
  { word: "fluctuate", meaning: "변동하다", pronunciation: "ˈflʌk.tʃu.eɪt", exampleSentence: "Prices fluctuate daily.", category: "business", level: "C1" },
];

const additionalVocabulariesC2 = [
  { word: "articulate", meaning: "명료하게 표현하다", pronunciation: "ɑːrˈtɪk.jə.lət", exampleSentence: "She articulated her thoughts clearly.", category: "daily", level: "C2" },
  { word: "elucidate", meaning: "명확히 하다", pronunciation: "ɪˈluː.sɪ.deɪt", exampleSentence: "Let me elucidate my point.", category: "daily", level: "C2" },
  { word: "exemplify", meaning: "예시하다", pronunciation: "ɪɡˈzem.plɪ.faɪ", exampleSentence: "This exemplifies the problem.", category: "daily", level: "C2" },
  { word: "juxtapose", meaning: "병치하다", pronunciation: "ˌdʒʌk.stəˈpoʊz", exampleSentence: "The artist juxtaposes old and new.", category: "daily", level: "C2" },
  { word: "manifest", meaning: "명백히 하다", pronunciation: "ˈmæn.ə.fest", exampleSentence: "The symptoms manifest quickly.", category: "daily", level: "C2" },
  { word: "paradigm", meaning: "패러다임", pronunciation: "ˈper.ə.daɪm", exampleSentence: "This represents a new paradigm.", category: "business", level: "C2" },
  { word: "pervasive", meaning: "널리 퍼진", pronunciation: "pərˈveɪ.sɪv", exampleSentence: "The problem is pervasive.", category: "daily", level: "C2" },
  { word: "substantiate", meaning: "입증하다", pronunciation: "səbˈstæn.ʃi.eɪt", exampleSentence: "You must substantiate your claims.", category: "business", level: "C2" },
  { word: "ubiquitous", meaning: "어디에나 있는", pronunciation: "juːˈbɪk.wɪ.t̬əs", exampleSentence: "Smartphones are ubiquitous now.", category: "daily", level: "C2" },
  { word: "vindicate", meaning: "정당화하다", pronunciation: "ˈvɪn.dɪ.keɪt", exampleSentence: "The evidence vindicates her.", category: "daily", level: "C2" },
];

// TOEIC-specific vocabulary
const toeicVocabularies = [
  { word: "agenda", meaning: "의제", pronunciation: "əˈdʒen.də", exampleSentence: "What's on today's agenda?", category: "toeic", level: "B1" },
  { word: "budget", meaning: "예산", pronunciation: "ˈbʌdʒ.ɪt", exampleSentence: "We need to cut the budget.", category: "toeic", level: "B1" },
  { word: "deadline", meaning: "마감일", pronunciation: "ˈded.laɪn", exampleSentence: "The deadline is tomorrow.", category: "toeic", level: "B1" },
  { word: "invoice", meaning: "송장", pronunciation: "ˈɪn.vɔɪs", exampleSentence: "Please send me the invoice.", category: "toeic", level: "B1" },
  { word: "negotiate", meaning: "협상하다", pronunciation: "nɪˈɡoʊ.ʃi.eɪt", exampleSentence: "We need to negotiate the terms.", category: "toeic", level: "B1" },
  { word: "revenue", meaning: "수익", pronunciation: "ˈrev.ə.nuː", exampleSentence: "Revenue increased this quarter.", category: "toeic", level: "B2" },
  { word: "procedure", meaning: "절차", pronunciation: "prəˈsiː.dʒər", exampleSentence: "Follow the correct procedure.", category: "toeic", level: "B1" },
  { word: "implement", meaning: "시행하다", pronunciation: "ˈɪm.plə.ment", exampleSentence: "We will implement the new policy.", category: "toeic", level: "B2" },
  { word: "facilitate", meaning: "용이하게 하다", pronunciation: "fəˈsɪl.ə.teɪt", exampleSentence: "This will facilitate communication.", category: "toeic", level: "B2" },
  { word: "quotation", meaning: "견적", pronunciation: "kwoʊˈteɪ.ʃən", exampleSentence: "Request a quotation.", category: "toeic", level: "B1" },
];

async function main() {
  console.log("🌱 Starting vocabulary seed...");

  try {
    // Count existing vocabularies
    const existingCount = await prisma.vocabulary.count();
    console.log(`📊 Existing vocabularies: ${existingCount}`);

    // Delete existing vocabularies (if you want a fresh start)
    // Uncomment the next two lines to clear existing data
    // await prisma.vocabulary.deleteMany({});
    // console.log("🗑️  Cleared existing vocabularies");

    // Combine all vocabulary data
    const allVocabularies = [
      ...baseVocabularies,
      ...extraA1A2,
      ...extraB1B2,
      ...extraC1C2,
      ...extraSupplement,
      ...additionalVocabulariesA2,
      ...additionalVocabulariesB1,
      ...additionalVocabulariesB2,
      ...additionalVocabulariesC1,
      ...additionalVocabulariesC2,
      ...toeicVocabularies,
    ];

    console.log(`📝 Preparing to seed ${allVocabularies.length} vocabularies...`);

    // Insert vocabularies in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < allVocabularies.length; i += batchSize) {
      const batch = allVocabularies.slice(i, i + batchSize);

      await prisma.vocabulary.createMany({
        data: batch,
        skipDuplicates: true, // Skip if word already exists
      });

      inserted += batch.length;
      console.log(`✓ Inserted ${inserted}/${allVocabularies.length} vocabularies`);
    }

    // Verify counts
    const finalCount = await prisma.vocabulary.count();
    const levelCounts = await prisma.vocabulary.groupBy({
      by: ["level"],
      _count: true,
    });

    const categoryCounts = await prisma.vocabulary.groupBy({
      by: ["category"],
      _count: true,
    });

    console.log("\n📊 Final Statistics:");
    console.log(`   Total vocabularies: ${finalCount}`);
    console.log("\n   By Level:");
    levelCounts.forEach((lc) => {
      console.log(`   - ${lc.level}: ${lc._count}`);
    });
    console.log("\n   By Category:");
    categoryCounts.forEach((cc) => {
      console.log(`   - ${cc.category}: ${cc._count}`);
    });

    console.log("\n✨ Vocabulary seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding vocabularies:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
