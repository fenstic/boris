(() => {
  const { mouse } = Site;

  function frame(now){
    mouse.sx += (mouse.x - mouse.sx) * .18;
    mouse.sy += (mouse.y - mouse.sy) * .18;

    Site.drawBackground(now);
    Site.nameStep();
    Site.cursorStep(now);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
