const CFG = window.CLUB_CONFIG || {};

const TEAMS = [
  {name:"Vice President",cat:"LEADERSHIP",desc:"Co-leads the club and keeps teams aligned and accountable.",items:["Cross-team follow-up","Weekly board operations","President backup & escalation"]},
  {name:"Secretary & Coordination",cat:"GOVERNANCE",desc:"Keeps the club organized, documented and ready for university processes.",items:["Minutes & records","Calendar & documentation","Official coordination"]},
  {name:"Finance & Treasury",cat:"FINANCE",desc:"Tracks budgets, expenses, reimbursements and financial records.",items:["Budget tracking","Expense records","Funding documentation"]},
  {name:"Technical Team",cat:"TECHNICAL",desc:"Owns workshops, demos, technical content and mentoring.",items:["AI / LLM Mentor","Backend / API Builder","Agents / MCP Builder","Cloud / DevOps Support"]},
  {name:"Events & Operations",cat:"EXECUTION",desc:"Turns ideas into events that run smoothly.",items:["Logistics","Registration","Venue & equipment","Run-of-show"]},
  {name:"Marketing & Media",cat:"BRAND",desc:"Builds the public identity and storytelling engine of the club.",items:["Graphic Design","Social Media","Content Writing","Photo / Video"]},
  {name:"PR & Partnerships",cat:"EXTERNAL",desc:"Connects the club with speakers, communities, sponsors and collaborators.",items:["Sponsor outreach","Speaker relations","Club collaborations","External communications"]},
  {name:"Community & Membership",cat:"PEOPLE",desc:"Keeps members engaged, supported and connected.",items:["Onboarding","Engagement","Feedback & retention","Member database"]},
  {name:"Projects & Hackathons",cat:"BUILD",desc:"Helps members form teams, ship projects and prepare for challenges.",items:["Project coordination","Hackathon support","Demo Day","Team matching"]},
  {name:"HR / People & Culture",cat:"PEOPLE OPS",desc:"Owns internal recruitment, interviews, performance follow-up and culture.",items:["Recruitment","Interview coordination","Performance follow-up","Recognition"]},
  {name:"General Member / Volunteer",cat:"GENERAL",desc:"Contribute without taking a leadership role yet.",items:["Event volunteering","Project participation","Community support"]}
];

const QUESTIONS = {
  "Vice President":[
    ["leadership_exp","Tell us about a time you coordinated multiple people or teams.","textarea"],
    ["vp_priority","What should a Vice President protect most: speed, quality, team health, or accountability? Why?","textarea"]
  ],
  "Secretary & Coordination":[["coord_exp","How do you keep meetings, tasks and documentation organized?","textarea"]],
  "Finance & Treasury":[["finance_exp","What tools or methods would you use to track club expenses?","textarea"]],
  "Technical Team":[
    ["technical_stack","What technologies are you strongest in?","input"],
    ["technical_demo","Describe one AI/software project you could demo to students.","textarea"]
  ],
  "Events & Operations":[
    ["event_exp","Describe an event you helped organize, even informally.","textarea"],
    ["ops_strength","Which are you strongest at: logistics, registration, venue, run-of-show, or coordination?","input"]
  ],
  "Marketing & Media":[
    ["marketing_sample","What type of content are you best at producing?","input"],
    ["campaign_idea","Give us one campaign idea to launch the club on campus.","textarea"]
  ],
  "PR & Partnerships":[
    ["outreach_exp","Have you contacted companies, speakers or communities before? Explain.","textarea"],
    ["partner_target","Name three organizations or communities you would approach first and why.","textarea"]
  ],
  "Community & Membership":[
    ["community_idea","How would you keep members engaged after the first event?","textarea"],
    ["member_support","How would you handle an inactive or frustrated member?","textarea"]
  ],
  "Projects & Hackathons":[
    ["hackathon_exp","Tell us about a project or hackathon experience.","textarea"],
    ["project_system","How would you track five student teams building at the same time?","textarea"]
  ],
  "HR / People & Culture":[
    ["people_exp","What experience do you have with recruitment, interviews or team coordination?","textarea"],
    ["conflict","How would you handle conflict between two strong team members?","textarea"]
  ],
  "General Member / Volunteer":[["volunteer_interest","Which activities would you most like to support?","textarea"]]
};

const modal = document.querySelector("#modal");
const form = document.querySelector("#applicationForm");
const progress = document.querySelector("#progress");
const backBtn = document.querySelector("#backBtn");
const nextBtn = document.querySelector("#nextBtn");
const teamFirst = document.querySelector("#teamFirst");
const teamSecond = document.querySelector("#teamSecond");
const conditional = document.querySelector("#conditional");
const success = document.querySelector("#success");
const launchNote = document.querySelector("#launchNote");
let currentPage = 1;
let latestSubmission = null;

function renderRoles(){
  document.querySelector("#rolesGrid").innerHTML = TEAMS.map(t => `
    <article class="role">
      <small>${t.cat}</small>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
      <ul>${t.items.map(x=>`<li>${x}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function fillTeams(){
  const html = `<option value="">Select a team</option>` + TEAMS.map(t=>`<option>${t.name}</option>`).join("");
  teamFirst.innerHTML = html;
  teamSecond.innerHTML = html;
}

function recruitmentOpen(){
  if(!CFG.IS_LIVE) return false;
  if(!CFG.SUBMISSION_ENDPOINT) return false;
  if(CFG.APPLICATIONS_CLOSE_AT){
    const close = new Date(CFG.APPLICATIONS_CLOSE_AT);
    if(!Number.isNaN(close.valueOf()) && Date.now() > close.valueOf()) return false;
  }
  return true;
}

function setLaunchState(){
  const open = recruitmentOpen();
  const statusText = open
    ? "Applications are open"
    : (CFG.IS_LIVE ? "Applications are currently closed" : "Applications opening soon");

  document.querySelectorAll(".js-apply").forEach(b=>{
    if(open){
      b.hidden = false;
      b.disabled = false;
      b.textContent = b.dataset.openLabel || "Apply";
    }else{
      b.hidden = true;
    }
  });

  const navStatus = document.querySelector("#navStatus");
  if(navStatus){
    navStatus.hidden = open;
    navStatus.textContent = statusText;
  }

  const heroStatus = document.querySelector("#heroStatus");
  if(heroStatus){
    heroStatus.textContent = statusText;
    heroStatus.classList.toggle("live", open);
  }

  const footerMeta = document.querySelector("#footerMeta");
  if(CFG.CONTACT_EMAIL){
    footerMeta.textContent = `Founding Team Recruitment · ${CFG.CONTACT_EMAIL}`;
  }
}

function openModal(){
  if(!recruitmentOpen()) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function closeModal(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}
document.querySelectorAll(".js-apply").forEach(b=>b.addEventListener("click",openModal));
document.querySelector("#closeModal").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{ if(e.target===modal) closeModal(); });

teamFirst.addEventListener("change",()=>{
  const qs = QUESTIONS[teamFirst.value] || [];
  conditional.innerHTML = qs.map(([name,label,type]) => `
    <label>${label} *
      ${type==="textarea" ? `<textarea name="${name}" required></textarea>` : `<input name="${name}" required />`}
    </label>
  `).join("");
});

function showPage(n){
  currentPage = n;
  document.querySelectorAll(".form-page").forEach(p=>p.classList.remove("active"));
  document.querySelector(`.form-page[data-page="${n}"]`).classList.add("active");
  progress.style.width = `${n*20}%`;
  backBtn.style.visibility = n===1 ? "hidden":"visible";
  nextBtn.textContent = n===5 ? "Submit application →":"Continue →";
  document.querySelector(".modal-card").scrollTop=0;
}

function validateCurrentPage(){
  const page = document.querySelector(`.form-page[data-page="${currentPage}"]`);
  for(const el of page.querySelectorAll("[required]")){
    if(!el.checkValidity()){
      el.reportValidity();
      el.focus();
      return false;
    }
  }
  if(currentPage===2 && teamFirst.value && teamFirst.value===teamSecond.value){
    alert("Please choose two different team preferences.");
    teamSecond.focus();
    return false;
  }
  return true;
}

backBtn.addEventListener("click",()=>showPage(Math.max(1,currentPage-1)));
nextBtn.addEventListener("click",()=>{
  if(!validateCurrentPage()) return;
  if(currentPage<5) showPage(currentPage+1);
  else submitApplication();
});

function formObject(){
  const fd = new FormData(form);
  const data = {};
  for(const [k,v] of fd.entries()) data[k] = v==="on" ? true : String(v).trim();
  data.client_submitted_at = new Date().toISOString();
  data.user_agent = navigator.userAgent;
  data.form_version = "CBC-AOU-Founding-Team-v2";
  return data;
}

async function submitApplication(){
  if(!recruitmentOpen()){
    alert("Applications are not open.");
    return;
  }

  nextBtn.disabled = true;
  nextBtn.textContent = "Submitting...";

  const payload = formObject();
  const nonce = "cbc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 12);
  payload._transport = "iframe";
  payload._nonce = nonce;

  let frame = null;
  let submitForm = null;
  let timer = null;

  const cleanup = () => {
    window.removeEventListener("message", onMessage);
    if(timer) clearTimeout(timer);
    if(submitForm) submitForm.remove();
    if(frame) frame.remove();
  };

  const finishButtons = () => {
    nextBtn.disabled = false;
    nextBtn.textContent = "Submit application →";
  };

  const onMessage = (event) => {
    const allowedOrigin =
      event.origin.includes("googleusercontent.com") ||
      event.origin.includes("script.google.com");

    if(!allowedOrigin) return;
    if(!event.data || event.data.type !== "CBC_APPLICATION_RESULT") return;
    if(event.data.nonce !== nonce) return;

    const result = event.data;
    cleanup();
    finishButtons();

    if(result.ok === false){
      alert(result.message || "Submission failed. Please try again.");
      return;
    }

    latestSubmission = {...payload, ...result};
    delete latestSubmission._transport;
    delete latestSubmission._nonce;

    form.style.display = "none";
    success.classList.add("show");

    const appId = result.application_id || "Submitted";
    document.querySelector("#applicationId").textContent = appId;
    document.querySelector("#successMessage").textContent =
      result.duplicate
        ? "We already have an application with this Student ID or email. Your existing application was not duplicated."
        : "Thank you. Keep your application ID for reference.";
  };

  try{
    window.addEventListener("message", onMessage);

    frame = document.createElement("iframe");
    frame.name = "cbc-submit-" + nonce.replace(/[^a-z0-9-]/gi, "");
    frame.style.display = "none";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);

    submitForm = document.createElement("form");
    submitForm.method = "POST";
    submitForm.action = CFG.SUBMISSION_ENDPOINT;
    submitForm.target = frame.name;
    submitForm.style.display = "none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "application_payload";
    input.value = JSON.stringify(payload);
    submitForm.appendChild(input);

    document.body.appendChild(submitForm);

    timer = setTimeout(() => {
      cleanup();
      finishButtons();
      alert("The submission is taking too long. Please check your internet connection and try again.");
    }, 30000);

    submitForm.submit();
  }catch(err){
    cleanup();
    finishButtons();
    console.error(err);
    alert("We could not submit your application. Please try again.");
  }
}

document.querySelector("#downloadCopy").addEventListener("click",()=>{
  if(!latestSubmission) return;
  const safeName = (latestSubmission.full_name || "application").replace(/[^a-z0-9_-]+/gi,"_");
  const blob = new Blob([JSON.stringify(latestSubmission,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=`${safeName}_application.json`; a.click();
  URL.revokeObjectURL(url);
});

renderRoles();
fillTeams();
showPage(1);
setLaunchState();
