new Sortable(skill, { // 入れ替わる要素を格納している親要素のid
    animation: 150, // 入れ替わる時の速度
});

let skills = {
    "01": "刃風",
    "02": "陣風",
    "03": "心眼",
    "04": "燕飛",
    "05": "士風",
    "06": "風雅",
    "07": "月光",
    "08": "居合術",
    "09": "満月",
    "10": "花車",
    "11": "桜花",
    "12": "雪風",
    "13": "明鏡止水",
    "14": "必殺剣・震天",
    "15": "必殺剣・暁天",
    "16": "必殺剣・夜天",
    "17": "黙想",
    "18": "必殺剣・九天",
    "19": "葉隠",
    "20": "意気衝天",
    "21": "必殺剣・紅蓮",
    "22": "必殺剣・閃影",
    "23": "燕返し",
    "24": "照破",
    "25": "無明照破",
    "26": "風光",
    "27": "奥義波切",
    "28": "返し波切"
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

