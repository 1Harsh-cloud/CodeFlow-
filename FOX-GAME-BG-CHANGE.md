# Fox Game – How to Change Background (for testing)

In the **Code Editor**, make these edits to the Fox game HTML:

---

## 1. Body background (in `<style>` tag, near top)

**Change:**
```css
background: #1a0a2e;
```

**To something like:**
- `#87CEEB` – sky blue
- `#2E7D32` – green
- `#E65100` – orange
- `#1565C0` – blue

---

## 2. `drawBackground()` function – sky gradient

**Find:**
```javascript
sky.addColorStop(0,'#0d2137');
sky.addColorStop(0.5,'#1a3a2a');
sky.addColorStop(1,'#2d4a1e');
```

**Replace with (sunny day):**
```javascript
sky.addColorStop(0,'#87CEEB');
sky.addColorStop(0.6,'#98D8E8');
sky.addColorStop(1,'#7CB342');
```

---

## 3. Moon → Sun

**Replace the moon drawing block** (around line where you have the arc + crescent) **with:**
```javascript
ctx.fillStyle = '#FFD54F';
ctx.shadowColor = '#FFB300';
ctx.shadowBlur = 40;
ctx.beginPath();
ctx.arc(canvas.width*0.75, 70, 45, 0, Math.PI*2);
ctx.fill();
ctx.shadowBlur = 0;
```

(Delete the second arc that creates the crescent shape – that’s the “moon phase” overlay.)

---

## 4. Stars (optional)

For daytime, remove or comment out the stars loop  
`for (let i = 0; i < 50; i++) { ... }`.

---

Then click **Run Game** to see the new background.
