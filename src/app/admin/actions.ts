"use server"

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Dashboard Actions
export async function getDashboardStats() {
  const [totalProducts, totalCategories, totalOrders, totalUsers] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count(),
  ]);
  return { totalProducts, totalCategories, totalOrders, totalUsers };
}

// Product Actions
export async function getProducts() {
  const products = await prisma.product.findMany({ orderBy: { product_id: 'asc' } });
  return products.map(p => ({
    id: p.product_id,
    name: p.product_name,
    description: p.description || '',
    benefits: p.benefits || '',
    price: p.price.toNumber(),
    originalPrice: p.original_price ? p.original_price.toNumber() : undefined,
    promotionText: p.promotion_text || '',
    stock: p.stock,
    image: p.image_url || '',
    unit: p.unit || 'กก.',
    category: p.category_name || 'ผลไม้สด'
  }));
}

export async function createProduct(data: any) {
  await prisma.product.create({
    data: {
      product_name: data.name,
      price: data.price,
      original_price: data.originalPrice || null,
      promotion_text: data.promotionText || '',
      stock: data.stock,
      unit: data.unit || 'กก.',
      benefits: data.benefits,
      image_url: data.image || '',
      category_name: data.category || null,
    }
  });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function updateProduct(id: number, data: any) {
  await prisma.product.update({
    where: { product_id: id },
    data: {
      product_name: data.name,
      price: data.price,
      original_price: data.originalPrice || null,
      promotion_text: data.promotionText || '',
      stock: data.stock,
      unit: data.unit || 'กก.',
      benefits: data.benefits,
      image_url: data.image || '',
      category_name: data.category || null,
    }
  });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({ where: { product_id: id } });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// Category Actions
export async function getCategories() {
  const categories = await prisma.category.findMany({ orderBy: { category_id: 'asc' } });
  return categories.map(c => ({
    id: c.category_id,
    name: c.name,
    description: c.description || '',
    image: c.image || '/images/red_grapes.png',
    gradient: c.gradient || 'from-emerald-50/50 to-purple-50/50 hover:from-emerald-100/50 hover:to-purple-100/50',
    badgeColor: c.badge_color || 'bg-emerald-100 text-emerald-850 border-emerald-200'
  }));
}

export async function createCategory(data: any) {
  await prisma.category.create({
    data: {
      name: data.name,
      description: data.description || '',
      image: data.image || null,
    }
  });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function updateCategory(id: number, data: any) {
  await prisma.category.update({
    where: { category_id: id },
    data: {
      name: data.name,
      description: data.description || '',
      image: data.image || null,
    }
  });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { category_id: id } });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

// Order Actions
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
      orderBy: { created_at: 'desc' },
      include: {
        user: true,
        orderDetails: { include: { product: true } },
      },
    });
  } catch (err: any) {
    console.warn('Prisma findMany orders failed, executing raw SQL fallback:', err?.message);
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
      console.error('Raw SQL orders fetch also failed:', rawErr);
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
      shippingAddress: o.shipping_address || undefined,
      items: (o.orderDetails || []).map((od: any) => ({
        productName: od.product?.product_name || 'ไม่ทราบสินค้า',
        quantity: od.quantity,
        price: typeof od.price === 'object' && od.price?.toNumber ? od.price.toNumber() : Number(od.price || 0),
        unit: od.product?.unit || 'กก.',
      })),
      totalPrice: typeof o.total_price === 'object' && o.total_price?.toNumber ? o.total_price.toNumber() : Number(o.total_price || 0),
      paymentMethod: o.payment_method || 'พร้อมเพย์',
      paymentStatus: computedPaymentStatus,
      orderStatus: mappedStatus,
      createdAt: o.created_at ? (typeof o.created_at === 'string' ? o.created_at : o.created_at.toISOString()) : new Date(0).toISOString(),
      slipUrl: o.slip_url || undefined,
      refundSlipUrl: o.refund_slip_url || undefined,
      trackingImageUrl: o.tracking_image_url || undefined,
    };
  });
}

export async function updateOrderStatus(id: string, data: { paymentStatus?: string; orderStatus?: string; refundSlipUrl?: string; trackingImageUrl?: string }) {
  const orderId = parseInt(id.replace(/[^0-9]/g, ''), 10);
  if (isNaN(orderId)) return { success: false };

  const targetStatus = data.orderStatus || data.paymentStatus;

  try {
    const updateData: any = {};
    if (targetStatus) {
      updateData.status = targetStatus;
    }
    if (data.refundSlipUrl !== undefined) updateData.refund_slip_url = data.refundSlipUrl;
    if (data.trackingImageUrl !== undefined) updateData.tracking_image_url = data.trackingImageUrl;
    await prisma.order.update({ where: { order_id: orderId }, data: updateData });
  } catch (err: any) {
    console.warn('Prisma Client validation error detected, performing raw SQL update fallback:', err?.message);

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
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/account');
  return { success: true };
}

// User Actions
export async function getUsers() {
  const users = await prisma.user.findMany({ orderBy: { created_at: 'desc' } });
  return users.map(u => ({
    id: u.user_id,
    username: u.username,
    email: u.email,
    phone: u.phone || '',
    role: u.role,
    profileImage: u.profile_image || '',
  }));
}

export async function createUser(data: {
  username: string;
  email: string;
  password?: string;
  phone?: string;
  role?: string;
  profileImage?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว');
  }
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      password: data.password || '123456',
      phone: data.phone || null,
      role: data.role || 'User',
      profile_image: data.profileImage || null,
    },
  });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true, user };
}

export async function updateUser(id: number, data: {
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: string;
  profileImage?: string;
}) {
  const updateData: any = {};
  if (data.username !== undefined) updateData.username = data.username;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.password) updateData.password = data.password;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.profileImage !== undefined) updateData.profile_image = data.profileImage;

  await prisma.user.update({
    where: { user_id: id },
    data: updateData,
  });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function updateUserRole(id: number, role: string) {
  await prisma.user.update({ where: { user_id: id }, data: { role } });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}

export async function deleteUser(id: number) {
  await prisma.user.delete({ where: { user_id: id } });
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}
