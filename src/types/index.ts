export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  promotionText?: string;
  unit: string;
  image: string;
  category: string;
  stock: number;
  benefits?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  username: string;
  rating: number;
  comment: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  gradient?: string;
  badgeColor?: string;
}

export interface UserProfile {
  username: string;
  email: string;
  role: 'Admin' | 'Member' | 'User';
  password?: string;
  phone?: string;
  profileImage?: string;
}

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface Order {
  id: string;
  username: string;
  phone?: string;
  shippingAddress?: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: 'รอตรวจสอบ' | 'ชำระเงินแล้ว' | 'ล้มเหลว';
  orderStatus: 'รอดำเนินการ' | 'กำลังจัดส่ง' | 'ส่งสำเร็จ' | 'ยกเลิก';
  createdAt: string;
  slipUrl?: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
}

export interface UserChatThread {
  username: string;
  email?: string;
  messages: ChatMessage[];
  lastUpdated: string;
  unread?: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
}
