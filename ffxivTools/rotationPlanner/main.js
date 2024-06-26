new Sortable(skill, { // 入れ替わる要素を格納している親要素のid
    animation: 150, // 入れ替わる時の速度
});

let skills = {
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

let skillDiv = document.getElementById("skill");
let imgs = document.getElementById("skillpanel").getElementsByTagName("img");
for(let i = 0; i < imgs.length; i++){
    imgs[i].setAttribute("title", skills[imgs[i].getAttribute("id")]);
    imgs[i].onclick = (e) => {
        console.log(e.target);
        skillDiv.append(e.target.cloneNode(true));
    }
}

