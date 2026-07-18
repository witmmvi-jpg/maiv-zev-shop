# Next.js & PostgreSQL E-Commerce System

ระบบสั่งซื้อสินค้าออนไลน์ พัฒนาด้วย Next.js (TypeScript + Tailwind CSS + App Router) และมีฐานข้อมูล PostgreSQL รันบน Docker Compose

---

## วิธีใช้งาน Next.js (Next.js Setup)

### 1. วิธีแก้ปัญหา PowerShell Script Execution Error (กรณีรัน `npm` หรือ `npx` ไม่ได้)
หากคุณพบข้อผิดพลาดขณะรันคำสั่ง `npm` หรือ `npx` ใน Windows PowerShell:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```
คุณสามารถเลือกแก้ไขหรือหลีกเลี่ยงได้ด้วยวิธีเหล่านี้:

- **วิธีที่ 1 (แนะนำสำหรับเซสชันปัจจุบัน)**: รันคำสั่งนี้ก่อนใน PowerShell เพื่อเปิดสิทธิ์การรัน Script ชั่วคราวเฉพาะ Process นี้:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
  ```
- **วิธีที่ 2 (หลีกเลี่ยงโดยใช้ CMD)**: สลับไปใช้เครื่องมือ Command Prompt (CMD) ใน Terminal แทนการใช้ PowerShell ซึ่งจะไม่เจอปัญหานี้และสามารถใช้คำสั่งได้ปกติ:
  ```bash
  npm run dev
  ```
- **วิธีที่ 3 (รันข้ามสิทธิ์ชั่วคราว)**: รันคำสั่งผ่าน PowerShell โดยเจาะจง Bypass:
  ```powershell
  powershell -ExecutionPolicy Bypass -Command "npm run dev"
  ```

### 2. เริ่มต้นรันเซิร์ฟเวอร์ Next.js
เมื่อแก้ไขสิทธิ์เรียบร้อยแล้ว ให้รันคำสั่ง:
```bash
npm run dev
```
ระบบจะเปิดใช้งานหน้าเว็บปกติที่ [http://localhost:3000](http://localhost:3000)

---

## วิธีใช้งานฐานข้อมูล PostgreSQL (Docker Compose)

### 1. เริ่มต้นระบบฐานข้อมูล (Start Database)
ใช้คำสั่งต่อไปนี้เพื่อดาวน์โหลดและรัน PostgreSQL ในพื้นหลัง (Background):
```bash
docker compose up -d
```
> [!TIP]
> ในการรันครั้งแรก สคริปต์ `init.sql` จะสร้างตารางทั้งหมดในฐานข้อมูลและเพิ่มข้อมูลทดสอบ (Seed Data) ให้โดยอัตโนมัติ

### 2. ตรวจสอบสถานะ (Check Status)
```bash
docker compose ps
```

### 3. หยุดการทำงาน (Stop Database)
หากต้องการหยุดการทำงานของตู้คอนเทนเนอร์ (Container):
```bash
docker compose down
```
หรือหากต้องการล้างข้อมูลทั้งหมดในฐานข้อมูลเพื่อรันสคริปต์เริ่มต้นใหม่ (ลบ Volume):
```bash
docker compose down -v
```

---

## โครงสร้างฐานข้อมูล (Database Schema)

เราได้เตรียมฐานข้อมูลที่มีโครงสร้างสอดคล้องกับระบบสั่งซื้อสินค้าออนไลน์ โดยประกอบไปด้วยตารางหลักดังนี้:

1. **`users`**: จัดเก็บข้อมูลผู้ใช้งาน (ลูกค้า และผู้ดูแลระบบ)
2. **`categories`**: หมวดหมู่สินค้า
3. **`products`**: รายการสินค้า ราคา สต็อก และลิงก์รูปภาพ
4. **`orders`**: ข้อมูลคำสั่งซื้อ สถานะการจ่ายเงิน และที่อยู่จัดส่ง
5. **`order_items`**: รายการสินค้าในแต่ละคำสั่งซื้อ

### ข้อมูลสำหรับเชื่อมต่อ (Connection Details)
ค่ากำหนดในการเชื่อมต่อฐานข้อมูลถูกระบุไว้ในไฟล์ [`.env.local`](./.env.local):

- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `postgres_password`
- **Database:** `nextjs_db`
- **Database Connection URL (สำหรับ Prisma, Drizzle ORM หรือ pg):**
  ```env
  DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/nextjs_db?schema=public"
  ```
