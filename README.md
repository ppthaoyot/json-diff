# ⚡ JSON Diff Viewer

> Real-time JSON diff viewer — side-by-side, tree & list views, auto-fix malformed JSON. Zero dependencies, single HTML file.

🔗 **Demo:** [https://ppthaoyot.github.io/json-diff](https://username.github.io/json-diff)

---

## ฟีเจอร์

- **เปรียบเทียบ JSON แบบ real-time** — diff อัปเดตทันทีขณะพิมพ์
- **3 โหมดแสดงผล**
  - `Side-by-side` — แสดงคู่กันซ้าย-ขวา highlight บรรทัดที่ต่าง
  - `Tree` — แสดง path แบบ nested พร้อม old/new value
  - `รายการ` — สรุปรายการ key ที่เพิ่ม/ลบ/แก้ไข
- **✦ Auto-fix** — พยายาม repair JSON ที่ผิดรูปแบบอัตโนมัติ พร้อมแจ้งว่าแก้ไขอะไรบ้าง
- **Format JSON** — จัด indent ให้สวยงาม (pretty print)
- **Minify JSON** — ย่อเป็นบรรทัดเดียว
- **Copy** — คัดลอก JSON พร้อม feedback
- **Validation** — แจ้ง error ทันทีถ้า JSON ไม่ถูกต้อง
- **Summary bar** — นับจำนวน เพิ่ม / ลบ / แก้ไข / เหมือน
- **Dark mode** — รองรับอัตโนมัติตาม system
- **Responsive** — ใช้งานได้บนมือถือ

---

## วิธีใช้งาน

1. วาง JSON ชุดแรก (ต้นฉบับ) ในกล่อง **JSON A**
2. วาง JSON ชุดที่สอง (เปรียบเทียบ) ในกล่อง **JSON B**
3. ผลลัพธ์จะแสดงทันทีด้านล่าง
4. เลือกโหมดแสดงผลได้จากปุ่ม Side-by-side / Tree / รายการ

### Auto-fix รองรับการแก้ไขดังนี้

| ปัญหา | ตัวอย่าง | ผลลัพธ์ |
|-------|---------|---------|
| Trailing comma | `{"a":1,}` | `{"a":1}` |
| Single quotes | `{'key':'val'}` | `{"key":"val"}` |
| Unquoted keys | `{key: "val"}` | `{"key":"val"}` |
| Comments | `{"a":1} // note` | `{"a":1}` |
| Python literals | `True / False / None` | `true / false / null` |
| Undefined | `{"a": undefined}` | `{"a": null}` |
| Trailing semicolon | `{"a":1};` | `{"a":1}` |

---

## สัญลักษณ์

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| `+` สีเขียว | key ที่เพิ่มเข้ามาใน JSON B |
| `−` สีแดง | key ที่ถูกลบออกจาก JSON A |
| `~` สีส้ม | key ที่มีค่าเปลี่ยนแปลง |
| (ไม่มี) สีเทา | key ที่เหมือนกันทั้งสองฝั่ง |

---

## การ Deploy บน GitHub Pages

```bash
# 1. สร้าง repo ใหม่แล้ว rename ไฟล์เป็น index.html
git init
git add index.html README.md
git commit -m "init: JSON Diff Viewer"
git remote add origin https://github.com/<username>/json-diff.git
git push -u origin main
```

จากนั้นไปที่ **Settings → Pages → Branch: main → Save**
รอประมาณ 1-2 นาที จะได้ URL: `https://<username>.github.io/json-diff`

---

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- ไม่มี dependency ภายนอก
- ไม่ต้องการ backend หรือ server
- ขนาดไฟล์เดียว < 20KB

---

## License

MIT License — ใช้งานและดัดแปลงได้อิสระ
