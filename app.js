console.log("Cook Once, Live Free v07 loaded");

document.querySelectorAll(".choice").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const parent = btn.parentElement;
    parent.querySelectorAll(".choice").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

document.querySelector(".btn.primary").addEventListener("click",()=>{
  alert("Weekly plan engine coming next. Templates will drive this.");
});
