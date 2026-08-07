let parsedData = [];

const rawLog = document.getElementById("rawLog");
const preview = document.getElementById("preview");
const characterList = document.getElementById("characterList");
const stats = document.getElementById("stats");

document
.getElementById("parseBtn")
.addEventListener("click", parseLog);

document
.getElementById("cleanBtn")
.addEventListener("click", cleanText);

document
.getElementById("htmlBtn")
.addEventListener("click", exportHTML);

document
.getElementById("searchInput")
.addEventListener("input", searchText);

function parseLog(){

const text = rawLog.value;

const lines = text.split("\n");

parsedData = [];

for(let line of lines){

line = line.trim();

if(!line) continue;

if(
line.includes("This message has been hidden")
){
continue;
}

const match =
line.match(/^([^:]+):(.*)$/);

if(match){

parsedData.push({
type:"dialog",
speaker:match[1].trim(),
text:match[2].trim()
});

}else{

parsedData.push({
type:"narration",
text:line
});

}
}

render();
buildCharacters();
buildStats();
}

function render(){

preview.innerHTML = "";

parsedData.forEach(item=>{

const div =
document.createElement("div");

div.classList.add("message");

if(item.type==="dialog"){

div.innerHTML = `
<div class="speaker">
${item.speaker}
</div>
<div>
${item.text}
</div>
`;

}else{

div.innerHTML = `
<div class="narration">
${item.text}
</div>
`;

}

preview.appendChild(div);

});

}

function buildCharacters(){

const chars = {};

parsedData.forEach(item=>{

if(item.speaker){

chars[item.speaker] =
(chars[item.speaker]||0)+1;

}

});

characterList.innerHTML="";

Object.keys(chars).forEach(name=>{

const div =
document.createElement("div");

div.className="char-item";

div.textContent=
`${name} (${chars[name]})`;

characterList.appendChild(div);

});

}

function buildStats(){

let total = 0;

parsedData.forEach(item=>{

if(item.text){

total += item.text.length;

}

});

stats.innerHTML = `
총 글자 수
<br><br>
<b>${total.toLocaleString()}</b>
`;

}

function cleanText(){

let text = rawLog.value;

text =
text.replace(/\.{6}/g,"⋯⋯");

text =
text.replace(/\.{3}/g,"⋯");

text =
text.replace(/-{2,}/g,"─");

rawLog.value = text;
}

function exportHTML(){

let html =
`<div class="trpg-log">\n`;

parsedData.forEach(item=>{

if(item.type==="dialog"){

html += `
<div class="dialog">
<b>${item.speaker}</b>
${item.text}
</div>
`;

}else{

html += `
<div class="narration">
${item.text}
</div>
`;

}

});

html += "</div>";

navigator.clipboard.writeText(html);

alert("HTML 복사 완료");
}

function searchText(e){

const keyword = e.target.value;

const messages =
document.querySelectorAll(".message");

messages.forEach(msg=>{

if(
msg.textContent.includes(keyword)
){
msg.style.background="#fff8cc";
}else{
msg.style.background="";
}

});

}
