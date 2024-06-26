let timeTr = document.getElementById("time");
let skillTr = document.getElementById("skill");
let dotTr = document.getElementById("dot");
let removeBtn = document.getElementsByClassName("removeBtn")[0];

let skillCnt = 0;

let options = {
    group: {
        name: "skill",
        put: "skillpanel",
        pull: false
    },
    animation: 100
};

let clicked = (e) => {
    skillCnt++;
    let duplicated = e.currentTarget.cloneNode(true);
    duplicated.addEventListener("mouseenter", (e) => {
        e.currentTarget.getElementsByClassName("removeBtn")[0].style = "";
    });
    duplicated.addEventListener("mouseleave", (e) => {
        e.currentTarget.getElementsByClassName("removeBtn")[0].style = "display:none;";
    });
    duplicated.getElementsByClassName("removeBtn")[0].onclick = (e) => {
        e.currentTarget.parentNode.parentNode.remove();
        let sameIds = document.getElementsByClassName(cls);
        while(0 < sameIds.length){
            sameIds[0].remove();
        }
    };
    let newTd = document.createElement("td");
    newTd.appendChild(duplicated);
    skillTr.append(newTd);

    let cls = "s" + skillCnt.toString();
    let cls2, width;
    if(e.currentTarget.classList.contains("gcd")){
        cls2 = "gcd";
        width = "48px";
    }
    else{
        cls2 = "abi";
        width = "31.672px";
    }
    newTd.classList.add(cls, cls2);
    newTd = document.createElement("td");
    newTd.innerHTML = "&nbsp;";
    newTd.style.width = width;
    newTd.classList.add(cls, cls2);
    timeTr.appendChild(newTd);
    newTd = document.createElement("td");
    newTd.innerHTML = "&nbsp;";
    newTd.style.width = width;
    newTd.classList.add(cls, cls2);
    dotTr.appendChild(newTd);
};

options["onAdd"] = (e) => {
    e.item.onclick = () => {};
    skillCnt++;
    let cls = "s" + skillCnt.toString();
    e.item.addEventListener("mouseenter", (e) => {
        e.currentTarget.getElementsByClassName("removeBtn")[0].style = "";
    });
    e.item.addEventListener("mouseleave", (e) => {
        e.currentTarget.getElementsByClassName("removeBtn")[0].style = "display:none;";
    });
    e.item.getElementsByClassName("removeBtn")[0].onclick = (e) => {
        e.currentTarget.parentNode.parentNode.remove();
        let sameIds = document.getElementsByClassName(cls);
        while(0 < sameIds.length){
            sameIds[0].remove();
        }
    };
    let newTd = document.createElement("td");
    e.item.parentNode.insertBefore(newTd, e.item);
    newTd.appendChild(e.item);

    e.clone.onclick = clicked;

    let cls2, width;
    if(e.clone.classList.contains("gcd")){
        cls2 = "gcd";
        width = "48px";
    }
    else{
        cls2 = "abi";
        width = "31.672px";
    }
    newTd.classList.add(cls, cls2);
    newTd = document.createElement("td");
    newTd.innerHTML = "&nbsp;";
    newTd.style.width = width;
    newTd.classList.add(cls, cls2);
    timeTr.appendChild(newTd);
    newTd = document.createElement("td");
    newTd.innerHTML = "&nbsp;";
    newTd.style.width = width;
    newTd.classList.add(cls, cls2);
    dotTr.appendChild(newTd);
}

Sortable.create(skill, options);
Sortable.create(skillpanel, {
    group:{
        name: "skillpanel",
        pull: "clone",
        revertClone: false
    }
});

let names = {
    "pve_action__01": "刃風",
    "pve_action__02": "陣風",
    "pve_action__03": "心眼",
    "pve_action__04": "燕飛",
    "pve_action__05": "士風",
    "pve_action__06": "風雅",
    "pve_action__07": "月光",
    "pve_action__08": "居合術",
    "pve_action__09": "満月",
    "pve_action__10": "花車",
    "pve_action__11": "桜花",
    "pve_action__12": "雪風",
    "pve_action__13": "明鏡止水",
    "pve_action__14": "必殺剣・震天",
    "pve_action__15": "必殺剣・暁天",
    "pve_action__16": "必殺剣・夜天",
    "pve_action__17": "黙想",
    "pve_action__18": "必殺剣・九天",
    "pve_action__19": "葉隠",
    "pve_action__20": "意気衝天",
    "pve_action__21": "必殺剣・紅蓮",
    "pve_action__22": "必殺剣・閃影",
    "pve_action__23": "燕返し",
    "pve_action__24": "照破",
    "pve_action__25": "無明照破",
    "pve_action__26": "風光",
    "pve_action__27": "奥義波切",
    "pve_action__28": "返し波切",
    "pve_jyutsu_action__01": "彼岸花",
    "pve_jyutsu_action__02": "天下五剣",
    "pve_jyutsu_action__03": "乱れ雪月花",
    "pve_jyutsu_action__04": "返し彼岸花",
    "pve_jyutsu_action__05": "返し五剣",
    "pve_jyutsu_action__06": "返し雪月花",
    "melee_action__01": "内丹",
    "melee_action__02": "レッグスウィープ",
    "melee_action__03": "ブラッドバス",
    "melee_action__04": "牽制",
    "melee_action__05": "アームズレングス",
    "melee_action__06": "トゥルーノース"
}

// Initialize

let skills = document.getElementById("skillpanel").getElementsByClassName("wrapper");
for(let i = 0; i < skills.length; i++){
    skills[i].appendChild(removeBtn.cloneNode(true));
    skills[i].setAttribute("title", names[skills[i].getAttribute("id")]);
    skills[i].onclick = clicked;
}

// SkS to GCD

let gcd = 2.47;
let gcdi = 2.14;

document.getElementById("sks").addEventListener("change", (e) => {
    let sks = e.target.value;
    gcd = Math.floor(2500 * (1000 + Math.ceil(130 * (400 - sks) / 1900)) / 10000) / 100;
    gcdi = Math.floor(2500 * 0.87 * (1000 + Math.ceil(130 * (400 - sks) / 1900)) / 10000) / 100;
    document.getElementById("gcd").value = gcd;
    document.getElementById("gcdi").value = gcdi;
});
