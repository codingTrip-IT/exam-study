// 공통 유틸리티

async function loadQuestions() {
  const inModes = location.pathname.includes('/modes/');
  const path = (inModes ? '../' : '') + 'data/questions.json';
  const res = await fetch(path);
  return await res.json();
}

async function loadExam() {
  const inModes = location.pathname.includes('/modes/');
  const path = (inModes ? '../' : '') + 'data/exam.json';
  const res = await fetch(path);
  return await res.json();
}

// 진도/점수 저장 (localStorage)
function getStats() {
  return JSON.parse(localStorage.getItem('stats') || '{"attempts":0,"bestScore":null}');
}

function saveAttempt(scorePercent) {
  const stats = getStats();
  stats.attempts = (stats.attempts || 0) + 1;
  if (stats.bestScore === null || scorePercent > stats.bestScore) {
    stats.bestScore = scorePercent;
  }
  localStorage.setItem('stats', JSON.stringify(stats));
}

function saveProgress(mode, data) {
  localStorage.setItem(`progress_${mode}`, JSON.stringify(data));
}

function loadProgress(mode) {
  const raw = localStorage.getItem(`progress_${mode}`);
  return raw ? JSON.parse(raw) : null;
}

function clearProgress(mode) {
  localStorage.removeItem(`progress_${mode}`);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(text) {
  return (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// 핵심 키워드 추출 (괄호/구두점 제거)
function keyWords(text) {
  return normalize(text)
    .replace(/\([^)]*\)/g, '')
    .replace(/[,./·、\-~]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

// 빈칸 채점: 핵심 키워드 일치율로 판단
function fuzzyMatch(userInput, correctAnswer) {
  const u = normalize(userInput);
  const c = normalize(correctAnswer);
  if (!u) return false;
  if (u === c) return true;
  // 사용자가 정답의 핵심 키워드를 포함하는지 (또는 그 반대)
  const cKeys = keyWords(c);
  if (cKeys.length === 0) return false;
  const matched = cKeys.filter(k => u.includes(k)).length;
  // 핵심 키워드의 절반 이상 일치하면 정답 인정
  return matched / cKeys.length >= 0.5;
}

// 객관식 보기 자동 생성 (해당 문제 정답 + 다른 문제 정답 3개 무작위)
function buildChoices(currentQuestion, allQuestions) {
  if (currentQuestion.choices && currentQuestion.choices.length) {
    return currentQuestion.choices;
  }
  const others = allQuestions
    .filter(q => q.id !== currentQuestion.id && q.answer !== currentQuestion.answer)
    .map(q => q.answer);
  const distractors = shuffle(others).slice(0, 3);
  return shuffle([currentQuestion.answer, ...distractors]);
}

// 결과 PDF / 이미지 저장
async function downloadResultPDF(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!window.html2pdf) {
    alert('PDF 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  await html2pdf().set({
    margin: 10,
    filename: filename || `시험결과_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(el).save();
}

async function downloadResultImage(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!window.html2canvas) {
    alert('이미지 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
  const link = document.createElement('a');
  link.download = filename || `시험결과_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
