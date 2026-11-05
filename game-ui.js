function setDialog(title, body, options, kicker='WINSTON · SMITHY') {
  $('#dialogKicker').textContent=kicker;
  $('#dialogTitle').textContent=title;
  $('#dialogBody').textContent=body;
  const box=$('#dialogOptions');
  box.replaceChildren();
  for(const option of options){
    const button=document.createElement('button');
    button.textContent=option.label;
    button.disabled=!!option.disabled;
    button.addEventListener('click',option.run);
    box.append(button);
  }
  state.dialogOpen=true;
  $('#dialog').classList.add('show');
}
function closeDialog(){state.dialogOpen=false;$('#dialog').classList.remove('show');save()}
function talkToKhan(){
  if(!gameOn)return;
  if(!state.quest){
    setDialog('Khan','The field slimes have crept too close to Winston. Clear out three of them and I’ll pay you for the trouble.',[
      {label:'Accept · Clear 3 Field Slimes',run:()=>{state.quest=true;feed('Quest accepted · A Smith’s Request');setToast('Quest accepted · Defeat 3 Field Slimes');updateHud();showKhanMenu()}},
      {label:'Ask about the forge',run:()=>showCrafting()},
      {label:'Leave',run:closeDialog}
    ]);
  }else if(state.quest&&!state.questDone&&state.slimeKills>=3){
    setDialog('Khan','That should keep the road safe for a while. A smith pays his debts—here’s your reward.',[
      {label:'Complete quest · Receive 80 XP and 12 G',run:()=>{state.questDone=true;state.xp+=80;state.gold+=12;checkLevel();feed('Quest complete · +80 XP · +12 G');setToast('A Smith’s Request completed');updateHud();showKhanMenu()}},
      {label:'Not yet',run:closeDialog}
    ]);
  }else{
    const message=state.questDone?'The forge is yours to use, Wayfarer. That blade will serve you well.':`Still working on those slimes? ${Math.min(state.slimeKills,3)} of 3 defeated. The fields are just east of here.`;
    setDialog('Khan',message,[
      {label:'Ask about smithing',run:()=>showCrafting()},
      {label:'Leave',run:closeDialog}
    ]);
  }
}
function showKhanMenu(){
  setDialog('Khan',state.questDone?'Good work out there. Need anything forged?':'The forge is hot. Bring me ore and coin, and I can make you something useful.',[
    {label:'Smith a Fieldsteel Blade · 2 Iron Ore + 20 G',run:craftBlade},
    {label:'Leave',run:closeDialog}
  ]);
}
function showCrafting(){
  setDialog('Khan','I can temper a Fieldsteel Blade from two pieces of Iron Ore. It costs 20 gold. The edge hits harder than that starter sword.',[
    {label:'Smith a Fieldsteel Blade · 2 Iron Ore + 20 G',run:craftBlade},
    {label:'Back',run:showKhanMenu}
  ]);
}
function itemCount(name){return state.items.find(item=>item.name===name)?.count||0}
function craftBlade(){
  if(itemCount('Iron Ore')<2||state.gold<20){
    setDialog('Khan','You’ll need two Iron Ore and 20 gold before I can start the forge.',[
      {label:'Understood',run:closeDialog}
    ]);
    return;
  }
  state.items.find(item=>item.name==='Iron Ore').count-=2;
  state.gold-=20;
  state.weaponDamage=1;
  if(!state.items.some(item=>item.name==='Fieldsteel Blade'))state.items.push({name:'Fieldsteel Blade',icon:'⚔',desc:'A tempered blade · Uncommon',count:1});
  feed('Fieldsteel Blade forged · strikes deal +1 damage');
  setToast('Fieldsteel Blade forged');
  updateHud();
  setDialog('Khan','There. A clean edge, balanced for the road. It’ll add one point to your strikes.',[
    {label:'Thanks, Khan',run:closeDialog}
  ]);
}
function checkInteraction(){
  const near=Math.hypot(state.x-405,state.y-390)<78;
  const prompt=$('#interaction');
  prompt.style.display=near&&!state.dialogOpen&&!state.invOpen?'flex':'none';
  $('#interactText').textContent=state.quest&&!state.questDone&&state.slimeKills>=3?'Return to Khan':'Talk to Khan';
}
function openInventory(){
  if(!gameOn)return;
  state.invOpen=true;
  $('#inventory').classList.add('show');
  updateItems();
}
function closeInventory(){state.invOpen=false;$('#inventory').classList.remove('show');save()}
function bindActionButtons(){
  document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.action;
    if(action==='attack')attack();
    else if(action==='skill')skill();
    else if(action==='potion')potion();
    else if(action==='interact')talkToKhan();
  }));
}
$('#enterButton').addEventListener('click',()=>{
  gameOn=true;
  $('#startScreen').classList.add('hidden');
  updateHud();
  setToast('Welcome to Winston · Khan is near the smithy');
});
$('#inventoryButton').addEventListener('click',openInventory);
$('#closeDialog').addEventListener('click',closeDialog);
$('#closeInventory').addEventListener('click',closeInventory);
$('#dialog').addEventListener('click',event=>{if(event.target===$('#dialog'))closeDialog()});
$('#inventory').addEventListener('click',event=>{if(event.target===$('#inventory'))closeInventory()});
document.addEventListener('keydown',event=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  if(event.repeat)return;
  if(event.code==='KeyE'){if(state.dialogOpen)closeDialog();else if(state.invOpen)closeInventory();else talkToKhan()}
  else if(event.code==='Space'||event.code==='Digit1')attack();
  else if(event.code==='Digit2')skill();
  else if(event.code==='Digit3')potion();
  else if(event.code==='Escape'){if(state.dialogOpen)closeDialog();if(state.invOpen)closeInventory()}
});
window.addEventListener('blur',()=>{keys.clear();touchDirs.clear()});
document.querySelectorAll('.dpad button').forEach(button=>{
  const direction=button.dataset.dir;
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);touchDirs.add(direction)});
  const release=()=>touchDirs.delete(direction);
  button.addEventListener('pointerup',release);
  button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',release);
});
bindActionButtons();
updateHud();
checkInteraction();
