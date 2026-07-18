'use server';

import prisma from '@/lib/prisma';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function uploadFile(formData: FormData): Promise<{ url: string }> {
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new Error('ไม่พบไฟล์ที่แนบมา');
  }
  if (!/^(image|video)\//.test(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอเท่านั้น');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 20MB)');
  }

  const rawExt = path.extname(file.name).slice(1).toLowerCase();
  const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : (file.type.split('/')[1] || 'bin');
  const filename = `${randomUUID()}.${ext}`;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return { url: `/uploads/${filename}` };
}

export async function getArticles() {
  const articles = await prisma.article.findMany({
    orderBy: { date: 'desc' }
  });
  return articles.map(a => ({
    id: a.article_id.toString(),
    title: a.title,
    excerpt: a.excerpt || '',
    content: a.content || '',
    image: a.image || '',
    category: a.category || '',
    date: a.date ? a.date.toISOString().split('T')[0] : ''
  }));
}

export async function getProducts() {
  const products = await prisma.product.findMany();
  return products.map(p => ({
    id: p.product_id.toString(),
    name: p.product_name,
    price: Number(p.price),
    originalPrice: undefined, // Add logic if needed later
    promotionText: undefined,
    unit: 'กก.', // Default based on mock data
    image: p.image_url || '',
    category: 'ผลไม้สด', // Default, maybe need category table later
    stock: p.stock,
    benefits: p.benefits || undefined,
  }));
}

export async function getUsers() {
  const users = await prisma.user.findMany();
  return users.map(u => ({
    username: u.username,
    email: u.email,
    role: u.role as 'Admin' | 'Member' | 'User',
    password: u.password,
    phone: u.phone || undefined,
    profileImage: u.profile_image || '',
  }));
}

export async function getOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      orderDetails: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  return orders.map(o => ({
    id: o.order_id.toString(),
    username: o.user?.username || 'Unknown',
    phone: o.user?.phone || undefined,
    shippingAddress: o.shipping_address || '',
    items: o.orderDetails.map(od => ({
      productName: od.product?.product_name || 'Unknown',
      quantity: od.quantity,
      price: Number(od.price),
      unit: od.product?.unit || 'กก.'
    })),
    totalPrice: Number(o.total_price),
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status as 'รอตรวจสอบ' | 'ชำระเงินแล้ว' | 'ล้มเหลว',
    orderStatus: o.order_status as 'รอดำเนินการ' | 'กำลังจัดส่ง' | 'ส่งสำเร็จ' | 'ยกเลิก',
    createdAt: o.created_at ? o.created_at.toISOString() : new Date().toISOString(),
    slipUrl: o.slip_url || ''
  }));
}

export async function getReviews() {
  const reviews = await prisma.productReview.findMany({
    include: {
      user: true,
      product: true
    }
  });

  return reviews.map(r => ({
    id: r.review_id.toString(),
    productId: r.product_id?.toString() || '',
    username: r.user?.username || 'Unknown',
    rating: r.rating,
    comment: r.comment || '',
    mediaUrl: r.media_url || undefined,
    mediaType: (r.media_type as 'image' | 'video' | 'none') || 'none',
    createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
  }));
}

export async function createUser(data: { username: string; email: string; password?: string; phone?: string; role?: string; profileImage?: string }) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: data.password || 'default_password',
      phone: data.phone || null,
      role: data.role || 'User',
      profile_image: data.profileImage || null,
    }
  });
}

export async function updateUser(email: string, data: { role?: string; password?: string; profileImage?: string }) {
  const updateData: any = {};
  if (data.role) updateData.role = data.role;
  if (data.password) updateData.password = data.password;
  if (data.profileImage) updateData.profile_image = data.profileImage;

  if (Object.keys(updateData).length > 0) {
    return await prisma.user.update({
      where: { email },
      data: updateData
    });
  }
}

export async function deleteUser(email: string) {
  return await prisma.user.delete({
    where: { email }
  });
}

export async function createOrder(data: {
  email: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress?: string;
  slipUrl?: string;
  items: { productName: string; quantity: number; price: number }[]
}) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Find products by name to get their IDs
  const productNames = data.items.map(i => i.productName);
  const products = await prisma.product.findMany({
    where: { product_name: { in: productNames } }
  });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        user_id: user?.user_id,
        total_price: data.totalPrice,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
        order_status: data.orderStatus,
        shipping_address: data.shippingAddress || null,
        slip_url: data.slipUrl || null,
        orderDetails: {
          create: data.items.map(item => {
            const product = products.find(p => p.product_name === item.productName);
            return {
              product_id: product?.product_id,
              quantity: item.quantity,
              price: item.price
            };
          })
        }
      }
    });

    for (const item of data.items) {
      const product = products.find(p => p.product_name === item.productName);
      if (product) {
        await tx.product.update({
          where: { product_id: product.product_id },
          data: { stock: Math.max(0, product.stock - item.quantity) }
        });
      }
    }

    return created;
  });

  return { id: order.order_id.toString() };
}

export async function updateOrder(id: string, data: { paymentStatus?: string; orderStatus?: string }) {
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) return null;

  const updateData: any = {};
  if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
  if (data.orderStatus) updateData.order_status = data.orderStatus;

  return await prisma.order.update({
    where: { order_id: orderId },
    data: updateData
  });
}

export async function createReview(data: { email: string; productId: string; rating: number; comment: string; mediaUrl?: string; mediaType?: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const prodId = parseInt(data.productId, 10);

  return await prisma.productReview.create({
    data: {
      product_id: isNaN(prodId) ? null : prodId,
      user_id: user?.user_id,
      rating: data.rating,
      comment: data.comment,
      media_url: data.mediaUrl,
      media_type: data.mediaType || 'none'
    }
  });
}

// --- Product Actions ---
export async function createProduct(data: { name: string; description: string; benefits: string; price: number; stock: number; image: string }) {
  return await prisma.product.create({
    data: {
      product_name: data.name,
      description: data.description,
      benefits: data.benefits,
      price: data.price,
      stock: data.stock,
      image_url: data.image
    }
  });
}

export async function updateProduct(id: string, data: { name?: string; description?: string; benefits?: string; price?: number; stock?: number; image?: string }) {
  const productId = parseInt(id, 10);
  if (isNaN(productId)) return null;
  return await prisma.product.update({
    where: { product_id: productId },
    data: {
      product_name: data.name,
      description: data.description,
      benefits: data.benefits,
      price: data.price,
      stock: data.stock,
      image_url: data.image
    }
  });
}

export async function deleteProduct(id: string) {
  const productId = parseInt(id, 10);
  if (isNaN(productId)) return false;
  await prisma.product.delete({ where: { product_id: productId } });
  return true;
}

// --- Category Actions ---
export async function getCategories() {
  return await prisma.category.findMany({ orderBy: { category_id: 'desc' } });
}

export async function createCategory(data: { name: string; description: string; image: string; gradient: string; badgeColor: string }) {
  return await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      image: data.image,
      gradient: data.gradient,
      badge_color: data.badgeColor
    }
  });
}

export async function updateCategory(id: string, data: { name?: string; description?: string; image?: string; gradient?: string; badgeColor?: string }) {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) return null;
  return await prisma.category.update({
    where: { category_id: categoryId },
    data: {
      name: data.name,
      description: data.description,
      image: data.image,
      gradient: data.gradient,
      badge_color: data.badgeColor
    }
  });
}

export async function deleteCategory(id: string) {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) return false;
  await prisma.category.delete({ where: { category_id: categoryId } });
  return true;
}

// --- Chat Actions ---
export async function getChats() {
  return await prisma.chatThread.findMany({
    include: { messages: true },
    orderBy: { last_updated: 'desc' }
  });
}

export async function sendMessage(userEmail: string, username: string, sender: 'user' | 'admin' | 'bot', text: string) {
  let thread = await prisma.chatThread.findUnique({ where: { user_email: userEmail } });
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: { user_email: userEmail, username: username, unread: sender !== 'admin' }
    });
  } else {
    thread = await prisma.chatThread.update({
      where: { thread_id: thread.thread_id },
      data: { last_updated: new Date(), unread: sender !== 'admin' }
    });
  }

  return await prisma.chatMessage.create({
    data: {
      thread_id: thread.thread_id,
      sender: sender,
      text: text
    }
  });
}

export async function markChatRead(userEmail: string) {
  return await prisma.chatThread.update({
    where: { user_email: userEmail },
    data: { unread: false }
  });
}
