'use server';

import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 1. Primary Method: Supabase Storage Cloud Upload
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseKey) {
    try {
      const rawExt = path.extname(file.name).slice(1).toLowerCase();
      const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : (file.type.split('/')[1] || 'webp');
      const filename = `${randomUUID()}.${ext}`;

      const { data, error } = await supabase.storage.from('uploads').upload(filename, buffer, {
        contentType: file.type || 'image/webp',
        upsert: true,
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filename);
        if (publicUrlData?.publicUrl) {
          return { url: publicUrlData.publicUrl };
        }
      } else if (error) {
        console.warn('Supabase Storage upload warning:', error.message);
      }
    } catch (e) {
      console.error('Supabase Storage error, falling back:', e);
    }
  }

  // 2. Secondary Method: ImgBB API Key fallback if set
  if (process.env.IMGBB_API_KEY) {
    try {
      const imgbbForm = new FormData();
      imgbbForm.append('image', buffer.toString('base64'));
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
        method: 'POST',
        body: imgbbForm,
      });
      const data = await res.json();
      if (data?.data?.url) {
        return { url: data.data.url };
      }
    } catch (e) {
      console.error('ImgBB upload error, falling back:', e);
    }
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

  // 3. Vercel Serverless Fallback: Base64 Data URL
  if (isVercel) {
    const mime = file.type || 'image/jpeg';
    const base64DataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    return { url: base64DataUrl };
  }

  // 4. Local Development Fallback: Disk Storage / Base64
  try {
    const rawExt = path.extname(file.name).slice(1).toLowerCase();
    const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : (file.type.split('/')[1] || 'bin');
    const filename = `${randomUUID()}.${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return { url: `/uploads/${filename}` };
  } catch (err) {
    console.warn('Local upload failed, falling back to base64:', err);
    const mime = file.type || 'image/jpeg';
    return { url: `data:${mime};base64,${buffer.toString('base64')}` };
  }
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
  const products = await prisma.product.findMany({ orderBy: { product_id: 'asc' } });
  return products.map(p => ({
    id: p.product_id.toString(),
    name: p.product_name,
    description: p.description || '',
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    promotionText: p.promotion_text || undefined,
    unit: p.unit || 'กก.',
    image: p.image_url || '',
    category: p.category_name || 'ผลไม้สด',
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
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_image_url TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_slip_url TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS slip_url TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;`);
  } catch (e) {}

  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
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
  } catch (err: any) {
    console.warn('Prisma findMany orders failed in actions.ts, executing raw SQL fallback:', err?.message);
    try {
      const rawOrders: any[] = await prisma.$queryRaw`SELECT * FROM orders ORDER BY created_at DESC`;
      const userIds = Array.from(new Set(rawOrders.map(o => o.user_id).filter(Boolean)));
      const users = userIds.length > 0 ? await prisma.user.findMany({ where: { user_id: { in: userIds } } }) : [];
      const orderIds = rawOrders.map(o => o.order_id);
      const orderDetails = orderIds.length > 0 ? await prisma.orderDetail.findMany({
        where: { order_id: { in: orderIds } },
        include: { product: true }
      }) : [];

      orders = rawOrders.map(ro => ({
        ...ro,
        user: users.find(u => u.user_id === ro.user_id),
        orderDetails: orderDetails.filter(od => od.order_id === ro.order_id)
      }));
    } catch (rawErr) {
      console.error('Raw SQL orders fetch failed in actions.ts:', rawErr);
      orders = [];
    }
  }

  return orders.map(o => {
    const rawStatus = o.status || o.order_status || 'รอการตรวจสอบ';
    let mappedStatus = rawStatus;
    if (rawStatus === 'กำลังจัดส่ง') mappedStatus = 'กำลังจัดส่งไปให้ทางขนส่ง';
    if (rawStatus === 'ส่งสำเร็จ') mappedStatus = 'จัดส่งแล้ว';
    if (rawStatus === 'ยกเลิก' || rawStatus === 'ล้มเหลว') mappedStatus = 'ยกเลิกการสั่งซื้อ';
    if (rawStatus === 'รอตรวจสอบ') mappedStatus = 'รอการตรวจสอบ';

    const computedPaymentStatus = (mappedStatus === 'รอการตรวจสอบ' || rawStatus === 'รอตรวจสอบ' || o.payment_status === 'รอตรวจสอบ')
      ? 'รอตรวจสอบ'
      : (mappedStatus === 'จัดส่งแล้ว' || mappedStatus === 'กำลังจัดส่งไปให้ทางขนส่ง' || o.payment_status === 'ชำระเงินแล้ว')
        ? 'ชำระเงินแล้ว'
        : (o.payment_status || 'รอตรวจสอบ');

    return {
      id: o.order_id.toString(),
      username: o.user?.username || 'ไม่ทราบชื่อ',
      phone: o.user?.phone || undefined,
      shippingAddress: o.shipping_address || '',
      items: (o.orderDetails || []).map((od: any) => ({
        productName: od.product?.product_name || 'ไม่ทราบสินค้า',
        quantity: od.quantity,
        price: typeof od.price === 'object' && od.price?.toNumber ? od.price.toNumber() : Number(od.price || 0),
        unit: od.product?.unit || 'กก.'
      })),
      totalPrice: typeof o.total_price === 'object' && o.total_price?.toNumber ? o.total_price.toNumber() : Number(o.total_price || 0),
      paymentMethod: o.payment_method || 'พร้อมเพย์',
      paymentStatus: computedPaymentStatus,
      orderStatus: mappedStatus,
      createdAt: o.created_at ? (typeof o.created_at === 'string' ? o.created_at : o.created_at.toISOString()) : new Date().toISOString(),
      slipUrl: o.slip_url || '',
      refundSlipUrl: o.refund_slip_url || '',
      trackingImageUrl: o.tracking_image_url || ''
    };
  });
}

export async function getReviews() {
  const reviews = await prisma.productReview.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user: true,
      product: true
    }
  });

  return reviews.map(r => ({
    id: r.review_id.toString(),
    productId: r.product_id?.toString() || '',
    username: r.user?.username || 'ผู้ใช้งาน',
    userProfileImage: r.user?.profile_image || undefined,
    rating: r.rating,
    comment: r.comment || '',
    mediaUrl: r.media_url || undefined,
    mediaType: (r.media_type as 'image' | 'video' | 'none') || 'none',
    createdAt: r.created_at ? r.created_at.toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
  }));
}

export async function createUser(data: { username: string; email: string; password?: string; phone?: string; role?: string; profileImage?: string }) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: data.password || '123456',
      phone: data.phone || null,
      role: data.role || 'User',
      profile_image: data.profileImage || null
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
  items: { productName: string; quantity: number; price: number; unit: string }[];
  totalPrice: number;
  paymentMethod: string;
  paymentStatus?: string;
  orderStatus: string;
  shippingAddress?: string;
  slipUrl?: string;
}) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS slip_url TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_image_url TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_slip_url TEXT;`);
  } catch (e) {
    // Ignore ALTER errors
  }

  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Find products by name to get their IDs
  const productNames = data.items.map(i => i.productName);
  const products = await prisma.product.findMany({
    where: { product_name: { in: productNames } }
  });

  const statusValue = data.orderStatus || data.paymentStatus || 'รอการตรวจสอบ';

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          user_id: user?.user_id,
          total_price: data.totalPrice,
          payment_method: data.paymentMethod,
          status: statusValue,
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

    revalidatePath('/admin');
    revalidatePath('/account');
    revalidatePath('/');
    return { id: order.order_id.toString() };
  } catch (err: any) {
    console.warn('Prisma ORM createOrder failed, attempting Raw SQL fallback:', err?.message || err);

    // Fallback: Raw SQL insertion
    const insertedOrders: any[] = await prisma.$queryRawUnsafe(
      `INSERT INTO orders (user_id, total_price, payment_method, status, shipping_address, slip_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING order_id`,
      user?.user_id || null,
      data.totalPrice,
      data.paymentMethod,
      statusValue,
      data.shippingAddress || null,
      data.slipUrl || null
    );

    const orderId = insertedOrders[0]?.order_id;

    if (orderId) {
      for (const item of data.items) {
        const product = products.find(p => p.product_name === item.productName);
        await prisma.$executeRawUnsafe(
          `INSERT INTO order_details (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
          orderId,
          product?.product_id || null,
          item.quantity,
          item.price
        );

        if (product) {
          await prisma.$executeRawUnsafe(
            `UPDATE products SET stock = GREATEST(0, stock - $1) WHERE product_id = $2`,
            item.quantity,
            product.product_id
          );
        }
      }
      revalidatePath('/admin');
      revalidatePath('/account');
      revalidatePath('/');
      return { id: orderId.toString() };
    }

    throw err;
  }
}

export async function updateOrder(id: string, data: { paymentStatus?: string; orderStatus?: string; refundSlipUrl?: string; trackingImageUrl?: string }) {
  const orderId = parseInt(id.replace(/[^0-9]/g, ''), 10);
  if (isNaN(orderId)) return null;

  const targetStatus = data.orderStatus || data.paymentStatus;

  try {
    const updateData: any = {};
    if (targetStatus) {
      updateData.status = targetStatus;
    }
    if (data.refundSlipUrl !== undefined) updateData.refund_slip_url = data.refundSlipUrl;
    if (data.trackingImageUrl !== undefined) updateData.tracking_image_url = data.trackingImageUrl;
    const res = await prisma.order.update({
      where: { order_id: orderId },
      data: updateData
    });
    revalidatePath('/account');
    revalidatePath('/admin');
    revalidatePath('/');
    return res;
  } catch (err: any) {
    console.warn('Prisma update failed, executing raw SQL fallback:', err?.message);

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_image_url TEXT;`);
    } catch (e) {
      // ignore
    }

    try {
      if (data.trackingImageUrl !== undefined && targetStatus) {
        await prisma.$executeRaw`UPDATE orders SET status = ${targetStatus}, tracking_image_url = ${data.trackingImageUrl} WHERE order_id = ${orderId}`;
      } else if (data.trackingImageUrl !== undefined) {
        await prisma.$executeRaw`UPDATE orders SET tracking_image_url = ${data.trackingImageUrl} WHERE order_id = ${orderId}`;
      } else if (data.refundSlipUrl !== undefined && targetStatus) {
        await prisma.$executeRaw`UPDATE orders SET status = ${targetStatus}, refund_slip_url = ${data.refundSlipUrl} WHERE order_id = ${orderId}`;
      } else if (data.refundSlipUrl !== undefined) {
        await prisma.$executeRaw`UPDATE orders SET refund_slip_url = ${data.refundSlipUrl} WHERE order_id = ${orderId}`;
      } else if (targetStatus) {
        await prisma.$executeRaw`UPDATE orders SET status = ${targetStatus} WHERE order_id = ${orderId}`;
      }
    } catch (fallbackErr: any) {
      console.warn('Raw SQL status update failed, fallback to order_status:', fallbackErr?.message);
      if (targetStatus) {
        try {
          await prisma.$executeRaw`UPDATE orders SET order_status = ${targetStatus} WHERE order_id = ${orderId}`;
        } catch (e2) {}
      }
    }
    revalidatePath('/account');
    revalidatePath('/admin');
    revalidatePath('/');
    return { id: orderId.toString() };
  }
}

export async function createReview(data: { email: string; productId: string; rating: number; comment: string; mediaUrl?: string; mediaType?: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const prodId = parseInt(data.productId, 10);

  const review = await prisma.productReview.create({
    data: {
      product_id: isNaN(prodId) ? null : prodId,
      user_id: user?.user_id,
      rating: data.rating,
      comment: data.comment,
      media_url: data.mediaUrl || null,
      media_type: data.mediaType || 'none'
    }
  });

  revalidatePath('/');
  revalidatePath('/products');
  return review;
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
  return await prisma.category.findMany({ orderBy: { category_id: 'asc' } });
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
  const threads = await prisma.chatThread.findMany({
    include: { messages: true },
    orderBy: { last_updated: 'desc' }
  });

  const emails = threads.map(t => t.user_email).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true, profile_image: true }
  });

  const userMap = new Map(users.map(u => [u.email, u.profile_image]));

  return threads.map(t => ({
    ...t,
    profileImage: userMap.get(t.user_email) || ''
  }));
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

// --- Mailer Actions ---
import { sendOtpEmail, sendEmail as sendEmailMailer } from '@/lib/mailer';

export async function sendOtpAction(email: string, otpCode: string) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'อีเมลไม่ถูกต้อง' };
  }
  return await sendOtpEmail(email, otpCode);
}

// --- Email Actions ---
export async function sendEmail(data: { to: string; subject: string; text?: string; html?: string }) {
  return await sendEmailMailer(data);
}
