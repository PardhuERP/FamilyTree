const API_URL = "https://script.google.com/macros/s/AKfycbytM7snXYUkPLqdkIb9z-CQkUyDVRoUx1ef7-r02duWq139BWq1xWgg8m11BMgEOgVB/exec";
const FAMILY_ID = "F001";

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#tree")
  .attr("width", width)
  .attr("height", height)
  .call(
    d3.zoom().scaleExtent([0.3, 3]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    })
  );

const g = svg.append("g")
  .attr("transform", `translate(${width / 4}, ${height / 2})`);

const treeLayout = d3.tree().nodeSize([80, 180]);

let root;
let i = 0;
let map = {};

// Load data
fetch(`${API_URL}?action=getTree&familyId=${FAMILY_ID}`)
  .then((r) => r.json())
  .then((res) => {
    if (res.status === "OK") {
      buildTree(res.data);
    } else {
      alert("API error");
    }
  })
  .catch(() => alert("Cannot connect to server"));

// Build tree from flat data
function buildTree(rows) {
  if (!rows || rows.length === 0) {
    alert("No members found. Add founder.");
    return;
  }

  map = {};
  rows.forEach((p) => (map[p.personId] = { ...p, children: [] }));

  rows.forEach((p) => {
    if (p.fatherId && map[p.fatherId]) {
      map[p.fatherId].children.push(map[p.personId]);
    }
  });

  const founder = rows.find((r) => !r.fatherId);
  root = d3.hierarchy(map[founder.personId]);

  root.x0 = height / 2;
  root.y0 = 0;

  root.children && root.children.forEach(collapse);
  update(root);
}

// Collapse children
function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

// Draw tree
function update(source) {
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  nodes.forEach((d) => (d.y = d.depth * 180));

  const node = g.selectAll(".node")
    .data(nodes, (d) => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", `translate(${source.y0},${source.x0})`)
    .on("click", toggle);

  nodeEnter.append("rect")
    .attr("width", 100)
    .attr("height", 30)
    .attr("x", -50)
    .attr("y", -15);

  nodeEnter.append("text")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text((d) => d.data.name);

  nodeEnter.merge(node)
    .transition().duration(400)
    .attr("transform", (d) => `translate(${d.y},${d.x})`);

  const link = g.selectAll(".link")
    .data(links, (d) => d.target.id);

  link.enter().insert("path", "g")
    .attr("class", "link")
    .merge(link)
    .transition().duration(400)
    .attr("d", (d) => diagonal(d.source, d.target));

  nodes.forEach((d) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Curved link
function diagonal(s, d) {
  return `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`;
}
function addPerson(){
  const name = document.getElementById("pname").value;
  const gender = document.getElementById("pgender").value;
  const dob = document.getElementById("pdob").value;
  const place = document.getElementById("pplace").value;
  const fatherId = document.getElementById("pfather").value;

  if(!name){
    alert("Enter name");
    return;
  }

  const gen = fatherId && map[fatherId]
    ? Number(map[fatherId].generation) + 1
    : 1;

  fetch(
    API_URL +
      "?action=addPerson" +
      "&familyId=" + FAMILY_ID +
      "&name=" + encodeURIComponent(name) +
      "&gender=" + gender +
      "&dob=" + dob +
      "&place=" + encodeURIComponent(place) +
      "&fatherId=" + fatherId +
      "&generation=" + gen
  )
  .then(r => r.json())
  .then(res => {
    if(res.status === "OK"){
      alert("Added!");
      location.reload();
    } else {
      alert("Error adding");
    }
  });
    }

// Toggle children
function toggle(event, d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

// Buttons
document.getElementById("collapseBtn").onclick = () => {
  root.children && root.children.forEach(collapse);
  update(root);
};

document.getElementById("expandBtn").onclick = () => {
  root.each((d) => {
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }
  });
  update(root);
};

document.getElementById("addBtn").addEventListener("click", addPerson);
