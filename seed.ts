import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.skwgptmljbcrjyseanac:Rsy.%23p%40U7e-bD8F@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding data...');

  // 1. Initial Products
  const products = [
    { name: 'องุ่นไร้เมล็ด', price: 120, unit: 'กก.', image: '/images/black_grapes.png', category: 'ผลไม้สด', stock: 15, benefits: 'มีสารต้านอนุมูลอิสระสูง...', description: 'โปรโมชั่นเปิดสวน ลด 20%' },
    { name: 'องุ่นแดง', price: 100, unit: 'กก.', image: '/images/red_grapes.png', category: 'ผลไม้สด', stock: 20, benefits: 'อุดมไปด้วยวิตามินซีและสารฟลาโวนอยด์...', description: '' },
    { name: 'ข้าวหอมมะลิ', price: 40, unit: 'กก.', image: '/images/jasmine_rice.png', category: 'ข้าวสาร', stock: 50, benefits: 'คัดจากทุ่งกว้างวิถีธรรมชาติ...', description: 'ลดราคารับฤดูกาลใหม่' },
    { name: 'ข้าวเหนียว', price: 45, unit: 'กก.', image: '/images/sticky_rice.png', category: 'ข้าวสาร', stock: 30, benefits: 'คัดพิเศษ เมล็ดขาวนุ่ม อิ่มท้องนาน...', description: '' }
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        product_name: p.name,
        price: p.price,
        stock: p.stock,
        image_url: p.image,
        description: p.description,
        benefits: p.benefits
      }
    });
  }

  // 2. Initial Users
  const users = [
    { username: 'แอดมินสวน', email: 'admin@example.com', password: 'admin', role: 'Admin', phone: '0812345678' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        password: u.password,
        role: u.role,
        phone: u.phone
      }
    });
  }

  // 3. Initial Articles
  const articles = [
    { title: 'องุ่นไร้เมล็ด vs องุ่นแดง', category: 'ผลไม้สุขภาพ', image: '/images/black_grapes.png', excerpt: 'เปรียบเทียบสารอาหาร...', content: 'องุ่นไร้เมล็ด vs องุ่นแดง\n...' },
    { title: 'ข้าวหอมมะลิ vs ข้าวเหนียวเขี้ยวงู', category: 'ข้าวสุขภาพ', image: '/images/jasmine_rice.png', excerpt: 'เจาะลึกประโยชน์และสรรพคุณ...', content: 'ข้าวหอมมะลิ vs ข้าวเหนียว\n...' }
  ];

  for (const a of articles) {
    await prisma.article.create({
      data: {
        title: a.title,
        category: a.category,
        image: a.image,
        excerpt: a.excerpt,
        content: a.content
      }
    });
  }

  // 4. Initial Categories
  const categories = [
    { name: 'ผลไม้สด', description: 'ผลไม้ปลอดสารพิษจากสวนเรา', image: '/images/black_grapes.png' },
    { name: 'ข้าวสาร', description: 'ข้าวออร์แกนิก ปลูกด้วยวิถีธรรมชาติ', image: '/images/jasmine_rice.png' }
  ];

  for (const c of categories) {
    await prisma.category.create({
      data: {
        name: c.name,
        description: c.description,
        image: c.image
      }
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
