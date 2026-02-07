const API_URL =
"https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";

const userId = localStorage.getItem("userId");

if(!userId){
  location.href = "login.html";
}

/* LOAD REQUESTS */
fetch(API_URL + "?action=getFamilyRequests&userId=" + userId)
  .then(r=>r.json())
  .then(res=>{
    if(res.status==="OK"){
      showRequests(res.requests);
    }
  });

function showRequests(list){

  const box = document.getElementById("requestList");
  box.innerHTML = "";

  if(!list.length){
    box.innerHTML = "<p>No requests</p>";
    return;
  }

  list.forEach(r=>{
    const div = document.createElement("div");
    div.style.marginBottom = "10px";

    div.innerHTML = `
  <div style="
      padding:14px;
      border-radius:14px;
      background:#ffffff;
      box-shadow:0 3px 8px rgba(0,0,0,.08);
      border-left:4px solid #2563eb;
  ">

    <div style="font-weight:600; font-size:15px; margin-bottom:6px;">
      📩 Family Access Request
    </div>

    <div style="margin-bottom:6px;">
      <b>Family:</b> ${r.familyName}
    </div>

    <div style="margin-bottom:6px;">
  <b>Requested by:</b><br>
  ${r.requesterEmail}<br>
  <small style="color:#6b7280">
    (${r.requesterFamilyName || "Family not set"})
  </small>
</div>

    <div style="color:#6b7280; font-size:12px; margin-bottom:10px;">
      ${new Date(r.requestTime).toLocaleString()}
    </div>

    <div style="display:flex; gap:8px;">
      <button onclick="approve('${r.requestId}')"
        style="
          flex:1;
          background:#16a34a;
          color:#fff;
          border:none;
          padding:8px;
          border-radius:8px;
        ">
        ✅ Approve
      </button>

      <button onclick="reject('${r.requestId}')"
        style="
          flex:1;
          background:#dc2626;
          color:#fff;
          border:none;
          padding:8px;
          border-radius:8px;
        ">
        ❌ Reject
      </button>
    </div>
    
    `;

    box.appendChild(div);
  });
}

/* APPROVE */
function approve(id){
  fetch(API_URL +
    "?action=approveRequest&requestId=" + id)
    .then(r=>r.json())
    .then(res=>{
      alert(res.message);
      location.reload();
    });
}

/* REJECT */
function reject(id){
  fetch(API_URL +
    "?action=rejectRequest&requestId=" + id)
    .then(r=>r.json())
    .then(res=>{
      alert(res.message);
      location.reload();
    });
}
