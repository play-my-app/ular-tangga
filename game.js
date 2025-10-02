const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 700;

const boardImg = new Image(); boardImg.src = 'board.png';
const car1 = new Image(); car1.src = 'car1.png';
const car2 = new Image(); car2.src = 'car2.png';
const diceFrames = [];
for(let i=1;i<=6;i++){ diceFrames.push(`dice${i}.png`); }

// ===== Sound =====
const soundCard = new Audio('card-sound.wav');
const soundCorrect = new Audio('correct.wav');
const soundWrong = new Audio('wrong.wav');
const soundWin = new Audio('win.wav');
const soundRoll = new Audio('dice-roll.wav');

// ===== UI Elements =====
const cardAnim = document.getElementById('cardAnim');
const cardImg = document.getElementById('cardImg');
const cardText = document.getElementById('cardText');
const diceAnim = document.getElementById('diceAnim');
const diceImg = document.getElementById('diceImg');
const questionModal = document.getElementById('questionModal');
const modalQuestion = document.getElementById('modalQuestion');
const modalOptions = document.getElementById('modalOptions');
const modalClose = document.getElementById('modalClose');
const toastEl = document.getElementById('toast');

// ===== Toast =====
function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(()=>toastEl.classList.remove('show'),2000);
}

// ===== Koordinat papan (punya kamu) =====
const cellPositions = [
  {"x":318.58,"y":645.44},{"x":469.91,"y":639.48},{"x":553.54,"y":635.50},{"x":627.21,"y":639.48},
  {"x":690.93,"y":639.48},{"x":772.57,"y":625.56},{"x":824.34,"y":591.75},{"x":840.27,"y":536.07},
  {"x":838.27,"y":480.39},{"x":838.27,"y":418.74},{"x":794.47,"y":384.93},{"x":714.82,"y":384.93},
  {"x":643.14,"y":382.95},{"x":581.42,"y":402.83},{"x":543.58,"y":440.62},{"x":525.66,"y":496.30},
  {"x":487.83,"y":542.04},{"x":418.14,"y":565.90},{"x":344.47,"y":565.90},{"x":280.75,"y":569.88},
  {"x":205.09,"y":569.88},{"x":129.42,"y":551.98},{"x":75.66,"y":506.24},{"x":57.74,"y":450.56},
  {"x":65.71,"y":394.88},{"x":97.57,"y":333.23},{"x":169.25,"y":337.21},{"x":246.90,"y":339.20},
  {"x":308.63,"y":335.22},{"x":392.26,"y":329.25},{"x":465.93,"y":341.18},{"x":541.59,"y":339.20},
  {"x":617.26,"y":337.21},{"x":688.94,"y":333.23},{"x":754.65,"y":309.37},{"x":806.42,"y":259.65},
  {"x":806.42,"y":211.92},{"x":766.59,"y":162.21},{"x":714.82,"y":134.37},{"x":649.12,"y":132.38},
  {"x":587.39,"y":148.29},{"x":543.58,"y":184.08},{"x":517.70,"y":237.77},{"x":469.91,"y":265.62},
  {"x":398.23,"y":279.54},{"x":332.52,"y":257.66},{"x":268.81,"y":243.74},{"x":181.19,"y":225.84},
  {"x":121.46,"y":182.09},{"x":101.55,"y":128.40},{"x":123.45,"y":72.72}
];

// ===== Game State =====
let positions=[0,0],scores=[0,0],turn=0,skipTurn=[false,false],animating=false,extraTurn=false;
let shield=[0,0];         // kebal hukuman
let skipTurnCount=[0,0];  // skip beberapa giliran

// ===== Special Cells =====
const specialCells = {
  2:'penalty', 3:'luck', 5:'park', 8:'traffic',
  12:'stop', 13:'penalty', 15:'luck', 21:'park',
  22:'traffic', 23:'luck', 27:'luck', 28:'park',
  33:'penalty', 37:'luck', 39:'park', 44:'penalty',
  46:'luck', 48:'park'
};

// ===== Cards =====
const luckCards = [
  {text:"Mundur 1 langkah, -5 poin", move:-1, score:-5, image:'card-luck.png1.png'},
  {text:"Mundur 6 langkah, -15 poin", move:-6, score:-15, image:'card-luck.png2.png'},
  {text:"Kembali Ke start, -5 poin", move:0, score:-5, image:'card-luck.png3.png'},
  {text:"Berhenti 2 giliran", move:0, score:-5, image:'card-luck.png4.png'},
  {text:"Tutup mata sampai giliran mu, -10 poin", move:0, score:-10, image:'card-luck.png5.png'},
  {text:"Lempar dadu dan mundur sesuai angka dadu, -10 poin", move:0, score:-10, image:'card-luck.png6.png'}
];

const penaltyCards = [
  {text:"Maju 6 langkah, +10 poin", move:6, score:10, image:'card-penalty1.png'},
  {text:"Lempar dadu dan maju sesuai angka dadu, +20 poin", move:0, score:20, image:'card-penalty2.png'},
  {text:"Kebal 2 Hukuman, +5 poin", move:0, score:5, image:'card-penalty3.png'}
];

const questionBank = [
  {q:"Apa fungsi rambu STOP?", options:["Berhenti","Jalan terus","Belok kanan"], answer:0, image:'card-question1.png'},
  {q:"Warna lampu untuk jalan?", options:["Merah","Hijau","Biru"], answer:1, image:'card-question1.png'},
  {q:"Tempat aman menyeberang?", options:["Zebra Cross","Tengah Jalan","Perempatan"], answer:0, image:'card-question1.png'}
];

// ===== Draw =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(boardImg,0,0,canvas.width,canvas.height);
  const p1=cellPositions[positions[0]], p2=cellPositions[positions[1]];
  if(p1) ctx.drawImage(car1,p1.x-20,p1.y-32,64,64);
  if(p2) ctx.drawImage(car2,p2.x+10,p2.y-32,64,64);
}

// ===== Dice =====
function randDice(){return Math.floor(Math.random()*6)+1;}
function animateDice(result,callback){
  diceAnim.classList.remove('hidden'); diceAnim.classList.add('show');
  soundRoll.currentTime=0; soundRoll.play().catch(()=>{});
  let frames=0,maxFrames=18+Math.floor(Math.random()*6);
  const interval=setInterval(()=>{
    const idx=Math.floor(Math.random()*6);
    diceImg.src=diceFrames[idx];
    frames++;
    if(frames>=maxFrames){
      clearInterval(interval);
      diceImg.src=diceFrames[result-1];
      setTimeout(()=>{
        diceAnim.classList.remove('show'); diceAnim.classList.add('hidden');
        if(callback) callback();
      },600);
    }
  },80);
}

// ===== Move =====
function moveStepByStep(player,steps){
  animating=true;
  let moved=0;
  const interval=setInterval(()=>{
    if(moved<steps){
      if(positions[player]<cellPositions.length-1) positions[player]++;
      draw();
      moved++;
    } else {
      clearInterval(interval);
      handleLanding(player);
      if(!extraTurn) turn=1-turn; else extraTurn=false;
      animating=false;
    }
  },500);
}

// ===== Roll Dice =====
function rollDice(){
  if(animating) return;

  // skip giliran multiple
  if(skipTurnCount[turn]>0){
    toast('⏸ Pemain '+(turn+1)+' skip giliran ('+skipTurnCount[turn]+' sisa)');
    skipTurnCount[turn]--;
    turn=1-turn;
    draw();
    return;
  }

  if(skipTurn[turn]){
    toast('⏸ Pemain '+(turn+1)+' kehilangan giliran');
    skipTurn[turn]=false;
    turn=1-turn;
    draw();
    return;
  }

  const d = randDice();
  animateDice(d,()=>moveStepByStep(turn,d));
}

// ===== Handle Landing =====
function handleLanding(player){
  const idx = positions[player];
  if(specialCells[idx]){
    const type = specialCells[idx];

    if(type==='luck'){
      const card = luckCards[Math.floor(Math.random()*luckCards.length)];
      showCardAnimation(0,0,card.text,card.image);

      setTimeout(()=>{
        if(card.text.includes("Berhenti 2 giliran")){
          skipTurnCount[player]=2;
          toast("⏸ Pemain "+(player+1)+" berhenti 2 giliran!");
        }
        else if(card.text.includes("Lempar dadu dan mundur")){
          const extra=randDice();
          toast("🎲 Lempar dadu lagi: "+extra+" → mundur "+extra);
          positions[player]=Math.max(0,positions[player]-extra);
          scores[player]+=card.score;
        }
        else if(card.text.includes("Kembali Ke start")){
          positions[player]=0;
          scores[player]+=card.score;
        }
        else {
          if(card.move) positions[player]=Math.max(0,Math.min(positions[player]+card.move,cellPositions.length-1));
          if(card.score) scores[player]+=card.score;
        }
        draw();
      },1500);

      soundCard.currentTime=0; soundCard.play().catch(()=>{});
      return;
    }

    if(type==='penalty'){
      if(shield[player]>0){
        shield[player]--;
        toast("🛡 Pemain "+(player+1)+" kebal hukuman! Sisa "+shield[player]);
        return;
      }

      const card = penaltyCards[Math.floor(Math.random()*penaltyCards.length)];
      showCardAnimation(0,0,card.text,card.image);

      setTimeout(()=>{
        if(card.text.includes("Lempar dadu dan maju")){
          const extra=randDice();
          toast("🎲 Lempar dadu lagi: "+extra+" → maju "+extra);
          positions[player]=Math.min(cellPositions.length-1,positions[player]+extra);
          scores[player]+=20;
        }
        else if(card.text.includes("Kebal 2 Hukuman")){
          shield[player]=2;
          scores[player]+=card.score;
          toast("🛡 Pemain "+(player+1)+" kebal 2 hukuman!");
        }
        else {
          if(card.move) positions[player]=Math.max(0,Math.min(positions[player]+card.move,cellPositions.length-1));
          if(card.score) scores[player]+=card.score;
        }
        draw();
      },1500);

      soundCard.currentTime=0; soundCard.play().catch(()=>{});
      return;
    }

    if(type==='question'){ showQuestionModal(player); return; }
    if(type==='stop'){ skipTurn[player]=true; toast('🚫 Stop! Pemain '+(player+1)+' kehilangan giliran'); return; }
    if(type==='traffic'){ skipTurn[player]=true; toast('🚦 Lampu merah! Pemain '+(player+1)+' skip turn'); return; }
    if(type==='park'){ positions[player]=Math.max(0,positions[player]-2); toast('🅿️ Parkir! Mundur 2 kotak'); draw(); return; }
  }

  if(idx===cellPositions.length-1){
    toast('🎉 Pemain '+(player+1)+' MENANG!');
    soundWin.currentTime=0; soundWin.play().catch(()=>{});
  }
}

// ===== Card Animation =====
function showCardAnimation(x,y,text,img){
  cardText.textContent = text;
  cardImg.src = img;
  cardAnim.style.left = "50%";
  cardAnim.style.top = "50%";
  cardAnim.style.transform = "translate(-50%, -50%)";
  cardAnim.classList.remove('hidden'); 
  cardAnim.classList.add('show');
  setTimeout(()=>{
    cardAnim.classList.remove('show'); 
    setTimeout(()=>cardAnim.classList.add('hidden'),400);
  },1800);
}

// ===== Question Modal =====
function showQuestionModal(player){
  const q = questionBank[Math.floor(Math.random()*questionBank.length)];
  modalQuestion.textContent = q.q;
  modalOptions.innerHTML = '';

  q.options.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.textContent=opt;
    btn.onclick=()=>{
      if(i===q.answer){
        scores[player]+=5;
        toast('✅ Benar! +5 poin');
        showCardAnimation(0,0,"Jawaban Benar! +5",q.image);
        soundCorrect.currentTime=0; soundCorrect.play().catch(()=>{});
      } else {
        scores[player]-=3;
        toast('❌ Salah -3 poin');
        showCardAnimation(0,0,"Jawaban Salah -3",q.image);
        soundWrong.currentTime=0; soundWrong.play().catch(()=>{});
      }
      questionModal.classList.add('hidden');
      draw();
    };
    modalOptions.appendChild(btn);
  });
  questionModal.classList.remove('hidden');
}

// ===== Reset =====
function resetGame(){
  positions=[0,0]; scores=[0,0]; turn=0;
  skipTurn=[false,false]; skipTurnCount=[0,0]; shield=[0,0];
  draw();
}

// ===== Events =====
modalClose.onclick = ()=>questionModal.classList.add('hidden');
boardImg.onload = draw;
