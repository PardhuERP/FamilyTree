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
      <div style="padding:12px;
                  border-radius:12px;
                  background:#f3f4f6">
        <b>Family:</b> ${r.familyId}<br>
        <b>User:</b> ${r.requesterId}<br><br>

        <button onclick="approve('${r.requestId}')">
          ✅ Approve
        </button>

        <button onclick="reject('${r.requestId}')">
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
