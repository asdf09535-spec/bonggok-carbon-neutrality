// ===== 봉곡중 1-5 탄소중립 공유 시스템 =====
const ADMIN_PW = '1234'; // ← 비밀번호 변경 시 여기를 수정
const STUDENTS = ['강예솔','권예은','김서윤','권정훈','김세혁','김예은','김온유','김태윤','나수인','박규연','박승준','박지우','배종혁','송민슬','양나경','오은율','유민서','이민성','이승민','이태현','임효린','정해지','차경호','최진리','최하안','황승준'];

// ---------- 관리자 ----------
function isAdmin(){ return sessionStorage.getItem('adminMode')==='true'; }

function openAdminModal(){
  if(isAdmin()){ exitAdmin(); return; }
  document.getElementById('adminModal').classList.add('show');
  const inp = document.getElementById('adminPwInput');
  inp.value='';
  document.getElementById('adminErr').style.display='none';
  setTimeout(()=>inp.focus(),120);
}
function closeAdminModal(){ document.getElementById('adminModal').classList.remove('show'); }
function checkAdmin(){
  if(document.getElementById('adminPwInput').value===ADMIN_PW){
    sessionStorage.setItem('adminMode','true');
    closeAdminModal();
    applyAdminUI();
    showToast('🔐 관리자 모드 활성화됨');
    if(typeof renderAll==='function') renderAll();
  } else {
    document.getElementById('adminErr').style.display='block';
  }
}
function exitAdmin(){
  sessionStorage.removeItem('adminMode');
  applyAdminUI();
  showToast('관리자 모드 종료됨');
  if(typeof renderAll==='function') renderAll();
}
function applyAdminUI(){
  const on=isAdmin();
  document.getElementById('adminBar').classList.toggle('visible',on);
  document.getElementById('adminToggleBtn').classList.toggle('active',on);
  document.getElementById('adminToggleBtn').textContent=on?'🔓 관리자 ON':'🔐 관리자';
  document.body.classList.toggle('admin-mode',on);
}

// ---------- 유틸 ----------
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function nowDate(){ return new Date().toISOString().slice(0,10); }
function formatDate(d){ return d?d.replace(/-/g,'.'):''; }

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2600);
}

function getStudentSelect(id,label){
  return `<div class="fg"><label>${label||'이름'}</label><select id="${id}"><option value="">-- 이름 선택 --</option>${STUDENTS.map((s,i)=>`<option value="${s}">${i+1}번 ${s}</option>`).join('')}</select></div>`;
}

// ---------- LocalStorage helpers ----------
function getData(key){ return JSON.parse(localStorage.getItem(key)||'[]'); }
function setData(key,arr){ localStorage.setItem(key,JSON.stringify(arr)); }

function deleteItem(key,id){
  if(!confirm('정말 삭제할까요?')) return;
  setData(key, getData(key).filter(x=>x.id!==id));
  showToast('🗑️ 삭제되었습니다');
  if(typeof renderAll==='function') renderAll();
}

// ---------- 공통 admin actions HTML ----------
function adminActions(key, item, editFn){
  return `<div class="admin-actions">
    <button class="admin-edit-btn" onclick="${editFn}('${item.id}')">✏️ 수정</button>
    <button class="admin-del-btn" onclick="deleteItem('${key}','${item.id}')">🗑️ 삭제</button>
  </div>`;
}

// ---------- 공통 편집 모달 ----------
function showEditModal(title, fields, onSave){
  // fields: [{id, label, type, value, options?}]
  let html = `<h3>✏️ ${title} 수정</h3><p>내용을 수정한 후 저장하세요</p>`;
  fields.forEach(f=>{
    if(f.type==='textarea'){
      html+=`<div style="text-align:left;margin-bottom:10px"><label style="font-size:0.78rem;color:#555;font-weight:600;display:block;margin-bottom:5px">${f.label}</label><textarea id="ef_${f.id}" style="width:100%;padding:10px;border:2px solid rgba(76,175,125,0.22);border-radius:12px;font-family:'Noto Sans KR',sans-serif;font-size:0.86rem;color:#333;outline:none;resize:none;height:80px">${f.value||''}</textarea></div>`;
    } else if(f.type==='select'){
      html+=`<div style="text-align:left;margin-bottom:10px"><label style="font-size:0.78rem;color:#555;font-weight:600;display:block;margin-bottom:5px">${f.label}</label><select id="ef_${f.id}" style="width:100%;padding:10px;border:2px solid rgba(76,175,125,0.22);border-radius:12px;font-family:'Noto Sans KR',sans-serif;font-size:0.86rem;color:#333;outline:none">${f.options.map(o=>`<option value="${o.v}" ${o.v===f.value?'selected':''}>${o.l}</option>`).join('')}</select></div>`;
    } else {
      html+=`<div style="text-align:left;margin-bottom:10px"><label style="font-size:0.78rem;color:#555;font-weight:600;display:block;margin-bottom:5px">${f.label}</label><input type="${f.type||'text'}" id="ef_${f.id}" value="${f.value||''}" style="width:100%;padding:10px;border:2px solid rgba(76,175,125,0.22);border-radius:12px;font-family:'Noto Sans KR',sans-serif;font-size:0.86rem;color:#333;outline:none"></div>`;
    }
  });
  const m = document.getElementById('editModal');
  document.getElementById('editModalBody').innerHTML = html;
  document.getElementById('editSaveBtn').onclick = onSave;
  m.classList.add('show');
}
function closeEditModal(){ document.getElementById('editModal').classList.remove('show'); }

// ---------- DOMContentLoaded 공통 ----------
document.addEventListener('DOMContentLoaded',()=>{
  applyAdminUI();
  const btn=document.getElementById('scrollTop');
  if(btn){
    window.addEventListener('scroll',()=>{
      btn.style.opacity=scrollY>180?'1':'0';
      btn.style.pointerEvents=scrollY>180?'auto':'none';
    });
  }
});
