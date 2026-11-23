// ================================================================
//  봉곡중 1-5 탄소중립 · Firebase Firestore 연동 공유 모듈
//  (firebaseConfig는 bonggok-carbon-neutrality 프로젝트 값으로 설정 완료)
// ================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ────────────────────────────────────────────────────────────────
//  🔥 Firebase 설정 (Firebase Console → 프로젝트 설정 → 앱 추가에서 복사)
// ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBtUnIx0_PH3VCZk8wYlcLPQfnZ7r5vrz4",
  authDomain:        "bonggok-carbon-neutrality.firebaseapp.com",
  projectId:         "bonggok-carbon-neutrality",
  storageBucket:     "bonggok-carbon-neutrality.firebasestorage.app",
  messagingSenderId: "742763830070",
  appId:             "1:742763830070:web:2b458f95c40d220ffff197",
  measurementId:     "G-B0S6EY43DX"

};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ────────────────────────────────────────────────────────────────
//  상수
// ────────────────────────────────────────────────────────────────
const ADMIN_PW = "2781"; // ← 비밀번호 변경 시 여기만 수정
const STUDENTS = [
  "강예솔","권예은","김서윤","권정훈","김세혁","김예은","김온유","김태윤",
  "나수인","박규연","박승준","박지우","배종혁","송민솔","양나경","오은율",
  "유민서","이민성","이승민","이태현","임효린","정해지","차경호","최진리",
  "최하안","황승준"
];

// 예전 버전/오타로 저장된 이름도 같은 번호로 보이게 하는 별칭표
const NAME_ALIAS = { "송민슬":"송민솔", "이송민":"이승민", "최하얀":"최하안" };
const _idx = STUDENTS.reduce((a,s,i)=>{ a[s]=i; return a; }, {});
/** 이름 → 0부터 시작하는 번호 (없으면 -1) */
function studentIndex(name) {
  const n = String(name||"").trim();
  if (n in _idx) return _idx[n];
  if (NAME_ALIAS[n] in _idx) return _idx[NAME_ALIAS[n]];
  return -1;
}
/** HTML 특수문자 처리 (학생이 쓴 글이 화면을 깨뜨리지 않게) */
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

// ────────────────────────────────────────────────────────────────
//  관리자 인증
// ────────────────────────────────────────────────────────────────
function isAdmin() { return sessionStorage.getItem("adminMode") === "true"; }

function openAdminModal() {
  if (isAdmin()) { exitAdmin(); return; }
  document.getElementById("adminModal").classList.add("show");
  const inp = document.getElementById("adminPwInput");
  inp.value = "";
  document.getElementById("adminErr").style.display = "none";
  setTimeout(() => inp.focus(), 100);
}
function closeAdminModal() { document.getElementById("adminModal").classList.remove("show"); }

function checkAdmin() {
  if (document.getElementById("adminPwInput").value === ADMIN_PW) {
    sessionStorage.setItem("adminMode", "true");
    closeAdminModal();
    applyAdminUI();
    showToast("🔐 관리자 모드 활성화됨");
    if (typeof window.renderAll === "function") window.renderAll();
  } else {
    document.getElementById("adminErr").style.display = "block";
  }
}
function exitAdmin() {
  sessionStorage.removeItem("adminMode");
  applyAdminUI();
  showToast("관리자 모드 종료됨");
  if (typeof window.renderAll === "function") window.renderAll();
}
function applyAdminUI() {
  const on = isAdmin();
  document.getElementById("adminBar")?.classList.toggle("visible", on);
  document.getElementById("adminToggleBtn")?.classList.toggle("active", on);
  const btn = document.getElementById("adminToggleBtn");
  if (btn) btn.textContent = on ? "🔓 관리자 ON" : "🔐 관리자";
  document.body.classList.toggle("admin-mode", on);
}

// ────────────────────────────────────────────────────────────────
//  Firestore CRUD
// ────────────────────────────────────────────────────────────────

/** 실시간 구독 – 데이터 변경 시 renderFn(items[]) 자동 호출 */
function subscribeCollection(colName, renderFn, orderField = "createdAt") {
  const q = query(collection(db, colName), orderBy(orderField, "asc"));
  return onSnapshot(q,
    snap => renderFn(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error(err); showToast("⚠️ 데이터를 불러오지 못했습니다"); }
  );
}

/** 문서 추가 */
async function addItem(colName, data) {
  try {
    await addDoc(collection(db, colName), { ...data, createdAt: Date.now() });
    return true;
  } catch (e) { console.error(e); showToast("⚠️ 저장에 실패했습니다"); return false; }
}

/** 문서 수정 */
async function updateItem(colName, id, data) {
  try {
    await updateDoc(doc(db, colName, id), data);
    return true;
  } catch (e) { console.error(e); showToast("⚠️ 수정에 실패했습니다"); return false; }
}

/** 문서 삭제 */
async function deleteItem(colName, id) {
  if (!confirm("정말 삭제할까요?")) return;
  try {
    await deleteDoc(doc(db, colName, id));
    showToast("🗑️ 삭제되었습니다");
  } catch (e) { console.error(e); showToast("⚠️ 삭제에 실패했습니다"); }
}

// ────────────────────────────────────────────────────────────────
//  관리자 편집 모달
// ────────────────────────────────────────────────────────────────
function showEditModal(title, fields, onSave) {
  const s = `width:100%;padding:10px;border:2px solid rgba(76,175,125,.22);border-radius:12px;font-family:'Noto Sans KR',sans-serif;font-size:.86rem;color:#333;outline:none;margin-bottom:10px;`;
  let html = `<h3>✏️ ${title} 수정</h3><p>내용을 수정한 후 저장하세요</p>`;
  fields.forEach(f => {
    const lbl = `<label style="font-size:.77rem;color:#555;font-weight:600;display:block;margin-bottom:4px;text-align:left">${f.label}</label>`;
    if (f.type === "textarea")
      html += `<div>${lbl}<textarea id="ef_${f.id}" style="${s}resize:none;height:78px">${esc(f.value)}</textarea></div>`;
    else if (f.type === "select")
      html += `<div>${lbl}<select id="ef_${f.id}" style="${s}">${f.options.map(o=>`<option value="${esc(o.v)}"${String(o.v)===String(f.value)?" selected":""}>${esc(o.l)}</option>`).join("")}</select></div>`;
    else
      html += `<div>${lbl}<input type="${f.type||"text"}" id="ef_${f.id}" value="${esc(f.value)}" style="${s}"></div>`;
  });
  document.getElementById("editModalBody").innerHTML = html;
  document.getElementById("editSaveBtn").onclick = onSave;
  document.getElementById("editModal").classList.add("show");
}
function closeEditModal() { document.getElementById("editModal").classList.remove("show"); }

function adminActions(colName, item, editFnName) {
  return `<div class="admin-actions">
    <button class="admin-edit-btn" onclick="${editFnName}('${item.id}')">✏️ 수정</button>
    <button class="admin-del-btn" onclick="deleteItem('${colName}','${item.id}')">🗑️ 삭제</button>
  </div>`;
}

// ────────────────────────────────────────────────────────────────
//  UI 유틸
// ────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2700);
}
function formatDate(d) { return d ? String(d).replace(/-/g, ".") : ""; }
function nowDate() {            // 한국 시간 기준 오늘 날짜 (오전 9시 전에도 날짜가 하루 밀리지 않음)
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getStudentSelect(id, label) {
  return `<div class="fg"><label>${label||"이름"}</label>
    <select id="${id}"><option value="">-- 이름 선택 --</option>
    ${STUDENTS.map((s,i)=>`<option value="${s}">${i+1}번 ${s}</option>`).join("")}
    </select></div>`;
}

// ────────────────────────────────────────────────────────────────
//  DOMContentLoaded 공통
// ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyAdminUI();
  const btn = document.getElementById("scrollTop");
  if (btn) window.addEventListener("scroll", () => {
    btn.style.opacity       = scrollY > 180 ? "1" : "0";
    btn.style.pointerEvents = scrollY > 180 ? "auto" : "none";
  });
});

// ────────────────────────────────────────────────────────────────
//  전역 노출
// ────────────────────────────────────────────────────────────────
export {
  db, STUDENTS, ADMIN_PW, studentIndex, esc,
  isAdmin, openAdminModal, closeAdminModal, checkAdmin, exitAdmin, applyAdminUI,
  subscribeCollection, addItem, updateItem, deleteItem,
  showEditModal, closeEditModal, adminActions,
  showToast, formatDate, nowDate, getStudentSelect
};
