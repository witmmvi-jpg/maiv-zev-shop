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
  const products = await prisma.product.findMany({ orderBy: { product_id: 'desc' } });
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
  const categories = await prisma.category.findMany({ orderBy: { category_id: 'desc' } });
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
  const orders = await prisma.order.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user: true,
      orderDetails: { include: { product: true } },
    },
  });
  return orders.map(o => ({
    id: o.order_id.toString(),
    username: o.user?.username || 'ไม่ทราบชื่อ',
    phone: o.user?.phone || undefined,
    shippingAddress: o.shipping_address || undefined,
    items: o.orderDetails.map(od => ({
      productName: od.product?.product_name || 'ไม่ทราบสินค้า',
      quantity: od.quantity,
      price: od.price.toNumber(),
      unit: od.product?.unit || 'กก.',
    })),
    totalPrice: o.total_price.toNumber(),
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    orderStatus: o.order_status,
    createdAt: o.created_at ? o.created_at.toISOString() : new Date(0).toISOString(),
    slipUrl: o.slip_url || undefined,
  }));
}

export async function updateOrderStatus(id: string, data: { paymentStatus?: string; orderStatus?: string }) {
  const updateData: any = {};
  if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
  if (data.orderStatus) updateData.order_status = data.orderStatus;
  await prisma.order.update({ where: { order_id: parseInt(id, 10) }, data: updateData });
  revalidatePath('/admin');
  revalidatePath('/');
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
