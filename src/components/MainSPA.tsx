'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import Image from 'next/image';
import { getProducts, getCategories } from '@/app/admin/actions';
import { uploadFile, getUsers, createUser, updateUser, createOrder, getOrders, getChats, sendMessage, markChatRead, sendOtpAction, getReviews, createReview } from '@/app/actions';
import { compressImage } from '@/lib/imageCompressor';

interface Product {
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

interface ProductReview {
  id: string;
  productId: string;
  username: string;
  userProfileImage?: string;
  rating: number;
  comment: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  createdAt: string;
}


interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  gradient?: string;
  badgeColor?: string;
}

interface UserProfile {
  username: string;
  email: string;
  role: 'Admin' | 'Member' | 'User';
  password?: string;
  phone?: string;
  profileImage?: string;
}

const mockUsers: UserProfile[] = [
  { username: 'แอดมินสวน', email: 'admin@example.com', role: 'Admin', password: 'admin', phone: '0812345678', profileImage: '' }
];

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Order {
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

interface ChatMessage {
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
}

interface UserChatThread {
  username: string;
  email?: string;
  profileImage?: string;
  messages: ChatMessage[];
  lastUpdated: string;
  unread?: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
}

const initialArticles: Article[] = [
  {
    id: 'art1',
    title: 'องุ่นไร้เมล็ด vs องุ่นแดง: แตกต่างกันอย่างไรและเลือกแบบไหนดีต่อสุขภาพ?',
    excerpt: 'เปรียบเทียบสารอาหาร รสชาติ และสรรพคุณขององุ่นสองชนิดยอดนิยมจากสวน Maiv Zev เพื่อช่วยคุณตัดสินใจเลือกสิ่งที่ดีที่สุดสำหรับครอบครัว',
    category: 'ผลไม้สุขภาพ',
    date: '2026-07-05',
    image: '/images/black_grapes.png',
    content: `องุ่นเป็นผลไม้ที่มีประวัติศาสตร์ยาวนานและเป็นที่นิยมไปทั่วโลก ในสวนครอบครัว Maiv Zev ของเรา องุ่นที่เราปลูกด้วยวิถีธรรมชาติมี 2 สายพันธุ์หลัก คือ องุ่นไร้เมล็ด (สีดำ) และองุ่นแดงธรรมดา ซึ่งแต่ละสายพันธุ์มีคุณค่าและรสชาติที่แตกต่างกัน ดังนี้

🍇 1. องุ่นดำไร้เมล็ด (Seedless Grapes)
- สรรพคุณและสารอาหาร: มีสารต้านอนุมูลอิสระปริมาณสูงเป็นพิเศษ โดยเฉพาะ "เรสเวอราทรอล" (Resveratrol) ซึ่งพบมากที่ผิวขององุ่นสีเข้ม สารนี้มีบทบาทสำคัญในการช่วยชะลอวัย ป้องกันความเสื่อมของเซลล์ บำรุงสายตา บำรุงสมองและระบบประสาท และยังมีส่วนช่วยลดคอเลสเตอรอลชนิดไม่ดี (LDL) ในเส้นเลือดได้เป็นอย่างดี
- รสชาติและเนื้อสัมผัส: มีรสชาติหวานเข้มข้น กรอบ เปลือกบาง และจุดเด่นที่สุดคือไม่มีเมล็ด ทำให้ทานง่าย เหมาะมากสำหรับเด็กและผู้สูงอายุในครอบครัว

🍇 2. องุ่นแดง (Red Grapes)
- สรรพคุณและสารอาหาร: อุดมไปด้วย "วิตามินซี" และกลุ่มสาร "ฟลาโวนอยด์" (Flavonoids) โดยเฉพาะเควอเซทินและแอนโทไซยานิน ซึ่งเด่นในด้านการเสริมสร้างระบบภูมิคุ้มกันของร่างกาย ป้องกันการเกิดริ้วรอยก่อนวัย บำรุงผิวพรรณให้เปล่งปลั่ง และช่วยบำรุงระบบหมุนเวียนโลหิต ลดความดันโลหิตสูง
- รสชาติและเนื้อสัมผัส: รสชาติหวานฉ่ำ กลมกล่อม มีอมเปรี้ยวนิดๆ เปลือกหนากว่าเล็กน้อย และมีเมล็ด ซึ่งในเมล็ดองุ่นแดงนั้นเต็มไปด้วยสารสกัด OPC (Oligomeric Proanthocyanidins) ซึ่งเป็นสารต้านอนุมูลอิสระที่ทรงประสิทธิภาพมาก (หากเคี้ยวเมล็ดให้ละเอียดหรือใช้ในการสกัดจะได้รับประโยชน์เพิ่มขึ้น)

💡 เลือกองุ่นอะไรดี?
- หากคุณชอบความสะดวก ทานง่าย หวานกรอบจัด และเน้นเรื่องการบำรุงสมอง/หัวใจ/ชะลอวัย: แนะนำ "องุ่นไร้เมล็ด"
- หากคุณชอบรสชาติที่มีมิติอมเปรี้ยวหวานกลมกล่อม เน้นเรื่องวิตามินซี บำรุงภูมิคุ้มกัน และผิวพรรณสดใส: แนะนำ "องุ่นแดง"`
  },
  {
    id: 'art2',
    title: 'ข้าวหอมมะลิ vs ข้าวเหนียวเขี้ยวงู: คุณค่าทางอาหารและพลังงานที่แตกต่าง',
    excerpt: 'เจาะลึกประโยชน์และสรรพคุณของข้าวสาร 2 ชนิดหลักของสวนเรา ปลูกด้วยวิถีอินทรีย์ธรรมชาติ เพื่อการเลือกบริโภคที่เหมาะกับกิจกรรมประจำวันของคุณ',
    category: 'ข้าวสุขภาพ',
    date: '2026-07-06',
    image: '/images/jasmine_rice.png',
    content: `ข้าวเป็นอาหารหลักที่หล่อเลี้ยงชีวิตคนไทย สวนครอบครัวของเราปลูกข้าวด้วยวิถีเกษตรธรรมชาติ ปลอดสารพิษ 100% โดยเรามีข้าว 2 ประเภทที่เป็นความภูมิใจของเรา คือ ข้าวหอมมะลิแท้ 100% และข้าวเหนียวเขี้ยวงู ซึ่งข้าวแต่ละชนิดมีคุณลักษณะและสรรพคุณเด่นดังนี้

🌾 1. ข้าวหอมมะลิ (Jasmine Rice)
- สรรพคุณและสารอาหาร: ข้าวหอมมะลิของสวนเราอุดมไปด้วยวิตามินบี 1, วิตามินบี 2 และในข้าวกล้องหอมมะลิจะมีธาตุเหล็ก ทองแดง และใยอาหารสูง วิตามินบี 1 ช่วยป้องกันโรคเหน็บชา บำรุงระบบประสาทและสมอง ทำให้กระปรี้กระเปร่า คาร์โบไฮเดรตในข้าวหอมมะลิย่อยง่าย ร่างกายนำไปใช้ได้ทันที ไม่เป็นภาระต่อระบบย่อยอาหาร
- ลักษณะและรสสัมผัส: ข้าวเมล็ดยาวเรียวสวย เมื่อหุงสุกจะมีกลิ่นหอมคล้ายใบเตย นุ่ม ละมุนลิ้น รสชาติหวานตามธรรมชาติ

🌾 2. ข้าวเหนียวเขี้ยวงู (Sticky Rice)
- สรรพคุณและสารอาหาร: ให้พลังงานสูง (คาร์โบไฮเดรตสายยาวที่ร่างกายค่อยๆ ย่อยและดูดซึม) ทำให้อิ่มท้องได้นาน เหมาะสำหรับผู้ที่ต้องใช้พลังงานทำงานหนักหรือนักกีฬา นอกจากนี้ยังมี วิตามินอี ที่ช่วยบำรุงผิวพรรณ ช่วยชะลอการเสื่อมของเซลล์ มีสารช่วยกระตุ้นการเจริญอาหาร และช่วยในการซ่อมแซมและสร้างกล้ามเนื้อ
- ลักษณะและรสสัมผัส: ข้าวเหนียวเมล็ดเล็กยาว ขาวสะอาด เมื่อนึ่งสุกแล้วจะเหนียวนุ่ม เกาะตัวกันดี เคี้ยวมัน อร่อย มีความนุ่มหอมเฉพาะตัว

💡 เลือกข้าวอะไรดี?
- หากต้องการอาหารย่อยง่าย สบายท้อง บำรุงสุขภาพประสาทและสมองในชีวิตประจำวัน: แนะนำ "ข้าวหอมมะลิ"
- หากต้องการพลังงานสำหรับกิจกรรมหนักๆ อิ่มท้องได้ยาวนาน หรือนำไปทานคู่กับเมนูพิเศษ เช่น ส้มตำ ไก่ย่าง หรือของหวานอย่างข้าวเหนียวมะม่วง: แนะนำ "ข้าวเหนียวเขี้ยวงู"`
  },
  {
    id: 'art3',
    title: 'ความสำคัญของการทานผลไม้สดส่งตรงจากสวนวิถีธรรมชาติ',
    excerpt: 'ทำไมการเลือกทานผลไม้สดๆ ที่เก็บใหม่ๆ จากสวนถึงให้ประโยชน์มากกว่าผลไม้ในตลาดทั่วไป และมีส่วนช่วยรักษาสิ่งแวดล้อมอย่างไร',
    category: 'วิถีเกษตรธรรมชาติ',
    date: '2026-07-04',
    image: '/images/red_grapes.png',
    content: `ในยุคปัจจุบันที่เราสามารถหาซื้อผลไม้ได้จากทุกที่ แต่คุณเคยสงสัยไหมว่า ผลไม้ที่วางจำหน่ายในห้างสรรพสินค้าหรือตลาดทั่วไปกับผลไม้ที่ส่งตรงจากสวนครอบครัวธรรมชาติมีความแตกต่างกันอย่างไร?

1. คุณค่าสารอาหารเต็มเปี่ยม
ผลไม้เมื่อถูกเก็บเกี่ยวจะเริ่มสูญเสียวิตามินและสารต้านอนุมูลอิสระไปตามกาลเวลา การซื้อผลไม้จากสวนที่เก็บเกี่ยวและจัดส่งทันที เช่น องุ่นจากสวน Maiv Zev ของเรา จะทำให้คุณได้รับวิตามินซี เรสเวอราทรอล และสารต้านอนุมูลอิสระในระดับสูงสุดเมื่อเทียบกับผลไม้ที่ผ่านการเก็บรักษาในห้องเย็นเป็นเวลานาน

2. ปลอดสารเคมีและสารกันเสีย 100%
ผลไม้ในตลาดใหญ่มักผ่านกระบวนการเคลือบแว็กซ์หรือการพ่นสารเคมีป้องกันเชื้อราเพื่อยืดอายุการจำหน่าย แต่ผลไม้จากสวนครอบครัวเราปลูกและจัดเก็บแบบดั้งเดิม ไม่มีการเคลือบสารเคมีใดๆ คุณจึงล้างทำความสะอาดได้ง่ายและทานได้อย่างสบายใจไร้กังวล

3. รสชาติที่แท้จริงตามธรรมชาติ
ผลไม้ที่สุกบนต้นหรือสุกเต็มที่ในสวนก่อนการเก็บเกี่ยวจะมีระดับความหวานและกลิ่นหอมตามธรรมชาติที่ดีกว่าผลไม้ที่ถูกเก็บตั้งแต่วัยละอ่อนเพื่อเผื่อเวลาในการขนส่งระยะไกล

4. สนับสนุนเกษตรกรท้องถิ่นและลดคาร์บอนฟุตพริ้นท์
การสั่งซื้อตรงจากสวนเป็นการช่วยลดพ่อค้าคนกลาง ทำให้รายได้ส่งตรงถึงมือเกษตรกรครอบครัวเราอย่างเต็มเม็ดเต็มหน่วย และยังช่วยลดการขนส่งหลายทอด ทำให้ลดมลพิษทางอากาศได้อีกด้วย`
  }
];

export default function MainSPA({ initialPage = 'home' }: { initialPage?: 'home' | 'products' | 'delivery' | 'contact' | 'articles' | 'admin' | 'profile' }) {
  // Products list matching the user design with stock and promotions
  const initialProducts: Product[] = [
    {
      id: 'p1',
      name: 'องุ่นไร้เมล็ด',
      price: 120,
      originalPrice: 150,
      promotionText: 'โปรโมชั่นเปิดสวน ลด 20%',
      unit: 'กก.',
      image: '/images/black_grapes.png',
      category: 'ผลไม้สด',
      stock: 15,
      benefits: 'มีสารต้านอนุมูลอิสระสูง เช่น เรสเวอราทรอล (Resveratrol) ช่วยบำรุงสายตา บำรุงผิวพรรณ ช่วยลดคอเลสเตอรอล และเสริมสร้างการทำงานของระบบสมองและหัวใจได้อย่างมีประสิทธิภาพ รสชาติหวานกรอบ อร่อยทานง่ายไร้เมล็ด'
    },
    {
      id: 'p2',
      name: 'องุ่นแดง',
      price: 100,
      unit: 'กก.',
      image: '/images/red_grapes.png',
      category: 'ผลไม้สด',
      stock: 20,
      benefits: 'อุดมไปด้วยวิตามินซีและสารฟลาโวนอยด์ ช่วยสร้างภูมิคุ้มกันร่างกาย ป้องกันการเกิดริ้วรอยก่อนวัย ชะลอความเสื่อมของเซลล์ บำรุงระบบหมุนเวียนโลหิต และช่วยลดความดันโลหิตสูง'
    },
    {
      id: 'p3',
      name: 'ข้าวหอมมะลิ',
      price: 40,
      originalPrice: 45,
      promotionText: 'ลดราคารับฤดูกาลใหม่',
      unit: 'กก.',
      image: '/images/jasmine_rice.png',
      category: 'ข้าวสาร',
      stock: 50,
      benefits: 'คัดจากทุ่งกว้างวิถีธรรมชาติ ข้าวเมล็ดยาวเรียวสวย หอม นุ่ม ละมุนลิ้น อุดมไปด้วยวิตามินบี 1 บี 2 ป้องกันโรคเหน็บชา บำรุงสมองและประสาท ให้พลังงานที่สะอาดและดีต่อระบบขับถ่าย'
    },
    {
      id: 'p4',
      name: 'ข้าวเหนียว',
      price: 45,
      unit: 'กก.',
      image: '/images/sticky_rice.png',
      category: 'ข้าวสาร',
      stock: 30,
      benefits: 'คัดพิเศษ เมล็ดขาวนุ่ม อิ่มท้องนาน ให้พลังงานสูง เหมาะสำหรับเป็นแหล่งพลังงานของผู้ใช้แรงงานและนักกีฬา มีวิตามินอีบำรุงผิวพรรณ ช่วยเพิ่มการเจริญอาหาร และช่วยซ่อมแซมกล้ามเนื้อ'
    },
  ];

  const [products, setProducts] = useState<Product[]>([]);

  const initialOrders: Order[] = [
    {
      id: 'ORD-001',
      username: 'somchai_member',
      phone: '0898765432',
      shippingAddress: '123/45 ถนนเจริญนคร เขตคลองสาน กรุงเทพฯ 10600',
      items: [
        { productName: 'องุ่นไร้เมล็ด', quantity: 5, price: 120, unit: 'กก.' },
        { productName: 'ข้าวหอมมะลิ', quantity: 10, price: 40, unit: 'กก.' }
      ],
      totalPrice: 1000,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'ส่งสำเร็จ',
      createdAt: '2026-07-07 10:15',
      slipUrl: ''
    },
    {
      id: 'ORD-002',
      username: 'general_user',
      phone: '0855555555',
      shippingAddress: '99/9 หมู่ 2 ต.ในเมือง อ.เมือง จ.เชียงใหม่ 50000',
      items: [
        { productName: 'องุ่นแดง', quantity: 3, price: 100, unit: 'กก.' },
        { productName: 'ข้าวเหนียว', quantity: 5, price: 45, unit: 'กก.' }
      ],
      totalPrice: 525,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'ส่งสำเร็จ',
      createdAt: '2026-07-06 15:40',
      slipUrl: ''
    },
    {
      id: 'ORD-003',
      username: 'somchai_member',
      phone: '0898765432',
      shippingAddress: '123/45 ถนนเจริญนคร เขตคลองสาน กรุงเทพฯ 10600',
      items: [
        { productName: 'องุ่นไร้เมล็ด', quantity: 10, price: 120, unit: 'กก.' }
      ],
      totalPrice: 1200,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'กำลังจัดส่ง',
      createdAt: '2026-07-05 09:20',
      slipUrl: ''
    },
    {
      id: 'ORD-004',
      username: 'general_user',
      phone: '0855555555',
      shippingAddress: '99/9 หมู่ 2 ต.ในเมือง อ.เมือง จ.เชียงใหม่ 50000',
      items: [
        { productName: 'ข้าวหอมมะลิ', quantity: 20, price: 40, unit: 'กก.' }
      ],
      totalPrice: 800,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'ส่งสำเร็จ',
      createdAt: '2026-06-15 11:30',
      slipUrl: ''
    },
    {
      id: 'ORD-005',
      username: 'somchai_member',
      phone: '0898765432',
      shippingAddress: '123/45 ถนนเจริญนคร เขตคลองสาน กรุงเทพฯ 10600',
      items: [
        { productName: 'องุ่นแดง', quantity: 15, price: 100, unit: 'กก.' },
        { productName: 'ข้าวเหนียว', quantity: 10, price: 45, unit: 'กก.' }
      ],
      totalPrice: 1950,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'ส่งสำเร็จ',
      createdAt: '2026-05-20 14:10',
      slipUrl: ''
    },
    {
      id: 'ORD-006',
      username: 'general_user',
      phone: '0855555555',
      shippingAddress: '99/9 หมู่ 2 ต.ในเมือง อ.เมือง จ.เชียงใหม่ 50000',
      items: [
        { productName: 'องุ่นไร้เมล็ด', quantity: 20, price: 120, unit: 'กก.' },
        { productName: 'ข้าวหอมมะลิ', quantity: 30, price: 40, unit: 'กก.' }
      ],
      totalPrice: 3600,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'ส่งสำเร็จ',
      createdAt: '2025-11-12 10:00',
      slipUrl: ''
    },
    {
      id: 'ORD-007',
      username: 'somchai_member',
      phone: '0898765432',
      shippingAddress: '123/45 ถนนเจริญนคร เขตคลองสาน กรุงเทพฯ 10600',
      items: [
        { productName: 'ข้าวเหนียว', quantity: 50, price: 45, unit: 'กก.' }
      ],
      totalPrice: 2250,
      paymentMethod: 'โอนผ่านธนาคาร (PromptPay)',
      paymentStatus: 'ชำระเงินแล้ว',
      orderStatus: 'ส่งสำเร็จ',
      createdAt: '2024-08-15 16:30',
      slipUrl: ''
    }
  ];

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);

  // Local date-time helper functions matching ICT (Thailand) Timezone
  const getLocalISOString = (): string => {
    const d = new Date();
    const tzOffset = -d.getTimezoneOffset();
    const diff = tzOffset >= 0 ? '+' : '-';
    const pad = (num: number) => num.toString().padStart(2, '0');
    return d.getFullYear() +
      '-' + pad(d.getMonth() + 1) +
      '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) +
      ':' + pad(d.getMinutes()) +
      ':' + pad(d.getSeconds()) +
      diff + pad(Math.floor(Math.abs(tzOffset) / 60)) +
      ':' + pad(Math.abs(tzOffset) % 60);
  };

  const getLocalFormattedDate = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getLocalYearMonth = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  // Category State & Forms (moved up to avoid temporal dead zone)
  const initialCategories: Category[] = [
    {
      id: 'fruit',
      name: 'ผลไม้สด',
      description: 'องุ่นไร้เมล็ด องุ่นแดงหวานกรอบ ปลูกและคัดสรรพิเศษ ปลอดภัย สดใหม่จากสวนคุณยาย',
      image: '/images/red_grapes.png',
      gradient: 'from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-purple-500/20',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'rice',
      name: 'ข้าวสาร',
      description: 'ข้าวหอมมะลิ ข้าวเหนียว คุณภาพระดับพรีเมียม คัดสรรจากธรรมชาติ ปลอดสารเคมี 100%',
      image: '/images/jasmine_rice.png',
      gradient: 'from-amber-500/10 to-emerald-500/10 hover:from-amber-500/20 hover:to-emerald-500/20',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    }
  ];

  const [categories, setCategories] = useState<Category[]>([]);

  // Reviews & Product Detail states
  const mockReviews: ProductReview[] = [];

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewMediaUrl, setReviewMediaUrl] = useState<string>('');
  const [reviewMediaType, setReviewMediaType] = useState<'image' | 'video' | 'none'>('none');


  // Cart state
  
  const { cart: globalCart, addToCart: globalAddToCart, removeFromCart: globalRemoveFromCart, updateQuantity: globalUpdateQuantity } = useCart();
  
  const cart: { [key: string]: number } = {};
  if (products) {
    products.forEach(p => {
      const item = globalCart.find(i => i.productName === p.name);
      if (item) cart[p.id] = item.quantity;
    });
  }
  const setCart = () => {}; 

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCartItems, setSelectedCartItems] = useState<{ [key: string]: boolean }>({});

  const isItemSelected = (id: string) => {
    return selectedCartItems[id] !== false; // selected by default
  };

  const toggleItemSelection = (id: string) => {
    setSelectedCartItems(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'products' | 'delivery' | 'contact' | 'articles'>(initialPage as any);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { currentUser, login: setCurrentUser, logout } = useAuth(); // setCurrentUser maps to login for backward compat
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Real authentication states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupProfileImage, setSignupProfileImage] = useState('');
  const [signupProfilePreview, setSignupProfilePreview] = useState<string | null>(null);

  // Forgot password states
  const [forgotInput, setForgotInput] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Search, 2: OTP verify, 3: Reset password
  const [forgotFoundUser, setForgotFoundUser] = useState<UserProfile | null>(null);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Mock SMS/Email Toast state
  const [mockNotification, setMockNotification] = useState<{
    show: boolean;
    type: 'sms' | 'email';
    title: string;
    body: string;
  }>({ show: false, type: 'sms', title: '', body: '' });

  // Auto-dismiss simulated notification banner after 12 seconds
  useEffect(() => {
    if (mockNotification.show) {
      const timer = setTimeout(() => {
        setMockNotification(prev => ({ ...prev, show: false }));
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [mockNotification.show]);

  // localStorage persistence loaded after mount to avoid hydration mismatch
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDataLoading(true);

      Promise.allSettled([
        getProducts().then(dbProducts => {
          if (dbProducts && dbProducts.length > 0) {
            setProducts(dbProducts.map((p: any) => ({ ...p, id: p.id.toString() })));
          } else {
            setProducts(initialProducts);
          }
        }).catch(e => console.error("Failed to load products:", e)),

        getCategories().then(dbCats => {
          if (dbCats && dbCats.length > 0) {
            setCategories(dbCats.map((c: any) => ({ ...c, id: c.id.toString() })));
          } else {
            setCategories(initialCategories);
          }
        }).catch(e => console.error("Failed to load categories:", e)),
      ]).finally(() => {
        setIsLoaded(true);
        setIsDataLoading(false);
      });

      // Background secondary fetches
      getOrders().then(dbOrders => {
        if (dbOrders) {
          setOrders(dbOrders.map(o => ({ ...o, id: `ORD-${o.id.padStart(3, '0')}` })));
        }
      }).catch(e => console.error('Failed to load orders:', e));

      getReviews().then(dbReviews => {
        if (dbReviews && dbReviews.length > 0) {
          setReviews(dbReviews as ProductReview[]);
        }
      }).catch(err => {
        console.error('Error fetching reviews from DB:', err);
      });

      // Cart is now managed by Context

      const storedThreads = localStorage.getItem('maivzev_chat_threads_v3');
      if (storedThreads) {
        setChatThreads(JSON.parse(storedThreads));
      } else {
        const defaultThreads: { [key: string]: UserChatThread } = {
          'ผู้เยี่ยมชม': {
            username: 'ผู้เยี่ยมชม',
            messages: [
              {
                sender: 'bot',
                text: 'สวัสดีครับ! ยินดีต้อนรับสู่สวนครอบครัว Maiv Zev ยายมีและทีมงานยินดีให้บริการครับ คุณสามารถเลือกหัวข้อคำถามด่วนด้านล่าง หรือพิมพ์คำถามที่ต้องการสอบถามได้เลยครับ 😊',
                timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
              }
            ],
            lastUpdated: new Date().toISOString()
          }
        };
        setChatThreads(defaultThreads);
        localStorage.setItem('maivzev_chat_threads_v3', JSON.stringify(defaultThreads));
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('maivzev_users_v3', JSON.stringify(users));
      } catch (e) {
        console.error('Failed to save users to localStorage:', e);
      }
    }
  }, [users, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('maivzev_reviews_v3', JSON.stringify(reviews));
      } catch (e) {
        console.error('Failed to save reviews to localStorage:', e);
      }
    }
  }, [reviews, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        if (currentUser) {
          
        } else {
          
        }
      } catch (e) {
        console.error('Failed to save current user to localStorage:', e);
      }
    }
  }, [currentUser, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('maivzev_orders_v3', JSON.stringify(orders));
      } catch (e) {
        console.error('Failed to save orders to localStorage:', e);
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          // Self-healing: clear slip images from older orders to free space
          const prunedOrders = orders.map((o, idx) => {
            if (idx > 0) { // Keep slip only for the single most recent order to maximize space saving
              return { ...o, slipUrl: undefined };
            }
            return o;
          });
          try {
            localStorage.setItem('maivzev_orders_v3', JSON.stringify(prunedOrders));
            setOrders(prunedOrders);
          } catch (retryError) {
            console.error('Failed to save pruned orders:', retryError);
          }
        }
      }
    }
  }, [orders, isLoaded]);





  useEffect(() => {
    if (isLoaded) {
      try {
        
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
    }
  }, [cart, isLoaded]);

  // Helper to fallback benefits if undefined in storage
  const getProductBenefits = (product: Product) => {
    if (product.benefits) return product.benefits;
    if (product.name.includes('ไร้เมล็ด')) return "มีสารต้านอนุมูลอิสระสูง เช่น เรสเวอราทรอล (Resveratrol) ช่วยบำรุงสายตา บำรุงผิวพรรณ ช่วยลดคอเลสเตอรอล และเสริมสร้างการทำงานของระบบสมองและหัวใจได้อย่างมีประสิทธิภาพ รสชาติหวานกรอบ อร่อยทานง่ายไร้เมล็ด";
    if (product.name.includes('องุ่นแดง')) return "อุดมไปด้วยวิตามินซีและสารฟลาโวนอยด์ ช่วยสร้างภูมิคุ้มกันร่างกาย ป้องกันการเกิดริ้วรอยก่อนวัย ชะลอความเสื่อมของเซลล์ บำรุงระบบหมุนเวียนโลหิต และช่วยลดความดันโลหิตสูง";
    if (product.name.includes('หอมมะลิ')) return "คัดจากทุ่งกว้างวิถีธรรมชาติ ข้าวเมล็ดยาวเรียวสวย หอม นุ่ม ละมุนลิ้น อุดมไปด้วยวิตามินบี 1 บี 2 ป้องกันโรคเหน็บชา บำรุงสมองและประสาท ให้พลังงานที่สะอาดและดีต่อระบบขับถ่าย";
    if (product.name.includes('ข้าวเหนียว')) return "คัดพิเศษ เมล็ดขาวนุ่ม อิ่มท้องนาน ให้พลังงานสูง เหมาะสำหรับเป็นแหล่งพลังงานของผู้ใช้แรงงานและนักกีฬา มีวิตามินอีบำรุงผิวพรรณ ช่วยเพิ่มการเจริญอาหาร และช่วยซ่อมแซมกล้ามเนื้อ";
    return "ผลิตภัณฑ์คุณภาพเกรดพรีเมียม สดใหม่ส่งตรงจากสวนวิถีธรรมชาติ ปลอดภัยต่อสุขภาพ 100%";
  };

  // Helper to calculate total products sold count (only from paid orders)
  const getProductSalesCount = (productName: string): number => {
    return orders
      .filter(o => o.paymentStatus === 'ชำระเงินแล้ว')
      .reduce((sum, order) => {
        const item = order.items.find(i => i.productName === productName);
        return sum + (item ? item.quantity : 0);
      }, 0);
  };

  // Helper to calculate average rating & count of reviews for a product
  const getProductRatingStats = (productId: string) => {
    const productReviews = reviews.filter(r => r.productId === productId);
    if (productReviews.length === 0) return { avg: 0, count: 0 };
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      avg: parseFloat((total / productReviews.length).toFixed(1)),
      count: productReviews.length
    };
  };

  // Helper to check if a user is eligible to write a review
  const canUserReviewProduct = (productId: string): boolean => {
    if (!currentUser) return false;
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    // Must have a completed order ('ส่งสำเร็จ') containing the product
    return orders.some(order =>
      order.username === currentUser.username &&
      order.orderStatus === 'ส่งสำเร็จ' &&
      order.items.some(item => item.productName === product.name)
    );
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('ขนาดไฟล์ใหญ่เกินไปครับ (สูงสุดไม่เกิน 20MB)');
        return;
      }
      (async () => {
        try {
          const compressed = await compressImage(file);
          const formData = new FormData();
          formData.append('file', compressed);
          const { url } = await uploadFile(formData);
          setSignupProfilePreview(url);
          setSignupProfileImage(url);
        } catch (err) {
          console.error('Error uploading profile image:', err);
          alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพครับ');
        }
      })();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetEmail = loginEmail.trim().toLowerCase();

    // 1. ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      alert('รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลให้ถูกต้องครับ');
      return;
    }

    try {
      const allUsers = await getUsers();

      // 2. ตรวจสอบว่ามีบัญชีนี้ในระบบหรือไม่
      const foundUser = allUsers.find((u) => u.email.toLowerCase() === targetEmail);
      if (!foundUser) {
        alert('ไม่พบข้อมูลบัญชีนี้ในระบบสมาชิก กรุณาสมัครสมาชิกก่อนครับ');
        return;
      }

      // 3. ตรวจสอบรหัสผ่าน
      if (foundUser.password !== loginPassword) {
        alert('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้งครับ');
        return;
      }

      // เข้าสู่ระบบสำเร็จ
      setCurrentUser(foundUser);
      setIsLoginModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      console.error(err);
      alert('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้งครับ');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword.trim() || !signupPhone.trim()) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนครับ');
      return;
    }

    try {
      const allUsers = await getUsers();
      const emailExists = allUsers.some((u) => u.email.toLowerCase() === signupEmail.toLowerCase());
      if (emailExists) {
        alert('อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่นครับ');
        return;
      }
      const phoneExists = allUsers.some((u) => u.phone && u.phone.replace(/[-\s]/g, '') === signupPhone.trim().replace(/[-\s]/g, ''));
      if (phoneExists) {
        alert('เบอร์โทรศัพท์นี้ถูกใช้งานแล้วในระบบ กรุณาใช้เบอร์โทรศัพท์อื่นครับ');
        return;
      }

      await createUser({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone.trim(),
        role: 'Member',
        profileImage: signupProfileImage || undefined,
      });

      const newUser: UserProfile = {
        username: signupUsername,
        email: signupEmail,
        role: 'Member',
        password: signupPassword,
        phone: signupPhone.trim(),
        profileImage: signupProfileImage,
      };

      setCurrentUser(newUser);
      setIsLoginModalOpen(false);

      setSignupUsername('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupPhone('');
      setSignupProfileImage('');
      setSignupProfilePreview(null);
    } catch (err) {
      console.error(err);
      alert('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้งครับ');
    }
  };

  // Admin states
  const [viewMode, setViewMode] = useState<'shop' | 'admin'>('shop');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'members' | 'payments' | 'chats'>('dashboard');
  const [dashboardPeriod, setDashboardPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [bestSellerMonth, setBestSellerMonth] = useState<string>(getLocalYearMonth());
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [selectedAdminChatKey, setSelectedAdminChatKey] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    price: number;
    originalPrice: number;
    promotionText: string;
    unit: string;
    image: string;
    category: string;
    stock: number;
  }>({
    name: '',
    price: 0,
    originalPrice: 0,
    promotionText: '',
    unit: 'กก.',
    image: '',
    category: 'ผลไม้สด',
    stock: 50,
  });

  // Category State & Forms (moved up)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<{
    name: string;
    description: string;
    image: string;
  }>({
    name: '',
    description: '',
    image: '/images/jasmine_rice.png',
  });

  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('ทั้งหมด');

  // Member checkout & history states
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('พร้อมเพย์ (PromptPay)');
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedMemberOrders, setSelectedMemberOrders] = useState<UserProfile | null>(null);

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState<{ [userKey: string]: UserChatThread }>({});
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const adminChatEndRef = useRef<HTMLDivElement | null>(null);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<{ message: string; title?: string; type?: 'success' | 'warning' } | null>(null);
  const showAlert = (message: string, title: string = 'แจ้งเตือน', type?: 'success' | 'warning') => {
    const alertType = type || (
      (message.includes('สำเร็จ') || message.includes('เรียบร้อย') || message.includes('ขอบคุณ') || message.includes('🎉'))
        ? 'success'
        : 'warning'
    );
    setCustomAlert({ message, title, type: alertType });
  };

  const alert = (message: any) => {
    showAlert(String(message));
  };

  const activeUserKey = currentUser ? currentUser.username : 'ผู้เยี่ยมชม';
  const activeThread = chatThreads[activeUserKey] || {
    username: activeUserKey,
    email: currentUser?.email || '',
    messages: [],
    lastUpdated: new Date().toISOString()
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatThreads, isBotTyping, isChatOpen, currentUser]);

  useEffect(() => {
    if (adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatThreads, selectedAdminChatKey]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('maivzev_chat_threads_v3', JSON.stringify(chatThreads));
      } catch (e) {
        console.error('Failed to save chatThreads to localStorage:', e);
      }
    }
  }, [chatThreads, isLoaded]);

  // Calculate totals
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const wishlistCount = 2; // static wishlist count to match "2" in design


  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    if (currentQty >= product.stock) {
      alert(`ขออภัยครับ สินค้า "${product.name}" มีคงเหลือในระบบเพียง ${product.stock} ${product.unit} เท่านั้น ไม่สามารถสั่งซื้อเกินได้ครับ`);
      return;
    }

    globalAddToCart({ productName: product.name, quantity: 1, price: product.price, unit: product.unit });
  };

  const removeFromCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    if (currentQty > 1) {
      globalUpdateQuantity(product.name, currentQty - 1);
    } else {
      globalRemoveFromCart(product.name);
    }
  };

  const calculateTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const product = products.find((p) => p.id === id);
      const isSelected = selectedCartItems[id] !== false;
      return sum + (product && isSelected ? product.price * qty : 0);
    }, 0);
  };

  const handleBuyNow = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    const qtyToAdd = currentQty > 0 ? currentQty : 1;

    globalAddToCart({ productName: product.name, quantity: qtyToAdd, price: product.price, unit: product.unit });

    const newSelections: { [key: string]: boolean } = {};
    products.forEach((p) => {
      newSelections[p.id] = p.id === productId;
    });
    setSelectedCartItems(newSelections);

    setCheckoutStep(2);
    setIsCartOpen(true);
  };

  const getBotResponse = (input: string, isLoggedIn: boolean): string => {
    const query = input.trim().toLowerCase();

    if (query.includes('วิธีเข้าสู่ระบบ') || query.includes('สมัครสมาชิก') || query.includes('ล็อกอิน') || query.includes('login') || query.includes('register') || query.includes('เข้าสู่ระบบ')) {
      return 'สำหรับการเข้าสู่ระบบหรือสมัครสมาชิก คุณสามารถกดที่ไอคอนรูปโปรไฟล์ที่มุมขวาบนของหน้าจอได้เลยครับ! หากยังไม่มีบัญชีให้เลือกแท็บ "สมัครสมาชิก" และกรอกข้อมูล (ชื่อ, อีเมล, รหัสผ่าน, เบอร์โทร) จากนั้นสามารถทำการล็อกอินและสั่งซื้อสินค้าได้ทันทีครับ 🔑';
    }

    if (query.includes('สินค้า') || query.includes('ขายอะไร') || query.includes('องุ่น') || query.includes('ข้าว') || query.includes('ผลไม้')) {
      return 'สวนครอบครัว Maiv Zev ของเรามีสินค้าเกษตรปลอดสารพิษคัดพิเศษ:\n🍇 องุ่นไร้เมล็ด หวานกรอบ: 120 บาท/กก. (ลดพิเศษจาก 150 บ.)\n🍇 องุ่นแดงหวานกรอบ: 100 บาท/กก.\n🌾 ข้าวหอมมะลิแท้ 100%: 40 บาท/กก.\n🌾 ข้าวเหนียวเขี้ยวงู: 45 บาท/กก. ครับ\nคุณสามารถเลือกซื้อสินค้าที่ต้องการได้ที่หน้าเมนูสินค้าด้านบนเลยครับ!';
    }

    if (query.includes('ราคา') || query.includes('กิโล') || query.includes('บาท')) {
      return 'ราคาเสนอขายปัจจุบัน:\n- องุ่นไร้เมล็ด: 120 บาท/กก.\n- องุ่นแดง: 100 บาท/กก.\n- ข้าวหอมมะลิ: 40 บาท/กก.\n- ข้าวเหนียว: 45 บาท/กก. ครับ';
    }

    if (query.includes('ส่ง') || query.includes('จัดส่ง') || query.includes('ชำระเงิน') || query.includes('โอน') || query.includes('จ่าย') || query.includes('เงิน') || query.includes('พร้อมเพย์') || query.includes('ธนาคาร') || query.includes('สลิป')) {
      return 'เราจัดส่งสินค้าด่วนสดใหม่ถึงหน้าบ้านทั่วประเทศ! โดยชำระเงินได้ผ่านสแกน QR PromptPay หรือโอนเข้าบัญชีกสิกรไทย แล้วแนบภาพสลิปผ่านทางหน้าสั่งซื้อเพื่อส่งออเดอร์ให้แอดมินสวนตรวจสอบได้ทันทีครับ 🚚';
    }

    return 'แอดมินสวนได้รับคำถามของคุณแล้วครับ! สวนเราส่งของทุกวันและปลอดสารพิษ 100% หากต้องการสอบถามข้อมูลเพิ่มเติม สามารถเลือกหัวข้อคำถามด่วนหรือติดต่อผู้ดูแลสวนโดยตรงได้ที่ โทร: 065-469-5103 ครับ 😊';
  };

  const containsProfanity = (text: string): boolean => {
    const normalized = text.toLowerCase().replace(/[\s\-\_\.\,\?\!\*]+/g, '');

    const exactBadWords = [
      'เหี้ย', 'ควย', 'เย็ด', 'เฆ็ด', 'ตอแหล', 'ดอกทอง', 'กะหรี่', 'กระหรี่',
      'ส้นตีน', 'พ่อง', 'สัส', 'หน้าหี', 'อีหี', 'เย็ดแม่', 'ชาติชั่ว', 'ระยำ',
      'จัญไร', 'อิดอก', 'แม่ง', 'พ่องตาย', 'พ่อมึงตาย', 'แม่มึงตาย', 'ควยเอ้ย',
      'บัดซบ', 'หัวควย', 'หน้าเหี้ย'
    ];

    for (const word of exactBadWords) {
      if (normalized.includes(word)) {
        return true;
      }
    }

    const englishBadWords = [
      'fuck', 'shit', 'bitch', 'bastard', 'dick', 'asshole', 'cunt'
    ];
    for (const word of englishBadWords) {
      if (normalized.includes(word)) {
        return true;
      }
    }

    // Checking "กู" with exemptions
    let textToCheckGu = normalized;
    const guExemptions = ['กูเกิล', 'google', 'กูรู', 'กู๊ด', 'กู้ด', 'ตระกูล', 'เกื้อกูล', 'ผักกูด', 'กูด', 'กูบ'];
    for (const ex of guExemptions) {
      textToCheckGu = textToCheckGu.split(ex).join('___');
    }
    if (textToCheckGu.includes('กู')) {
      return true;
    }

    // Checking "มึง"
    if (normalized.includes('มึง')) {
      return true;
    }

    // Checking "หี" with exemptions
    let textToCheckHee = normalized;
    const heeExemptions = ['หีบ', 'หีบห่อ'];
    for (const ex of heeExemptions) {
      textToCheckHee = textToCheckHee.split(ex).join('___');
    }
    if (textToCheckHee.includes('หี')) {
      return true;
    }

    // Checking "สัด" with exemptions
    let textToCheckSad = normalized;
    const sadExemptions = ['สัดส่วน'];
    for (const ex of sadExemptions) {
      textToCheckSad = textToCheckSad.split(ex).join('___');
    }
    if (textToCheckSad.includes('สัด')) {
      return true;
    }

    // Checking "เสือก"
    if (normalized.includes('เสือก')) {
      return true;
    }

    // Insults with animal names
    if (normalized.includes('ไอ้ควาย') || normalized.includes('อีควาย') || normalized.includes('หน้าควาย') ||
      normalized.includes('ไอ้สัตว์') || normalized.includes('อีสัตว์') || normalized.includes('ไอ้สัส') || normalized.includes('อีสัส')) {
      return true;
    }

    return false;
  };

  const loadDBChats = async () => {
    try {
      const dbThreads = await getChats();
      if (!dbThreads || dbThreads.length === 0) return;

      const threadsObj: { [key: string]: UserChatThread } = {};
      dbThreads.forEach((t: any) => {
        const key = t.username || t.user_email;
        threadsObj[key] = {
          username: t.username,
          email: t.user_email,
          unread: t.unread,
          profileImage: t.profileImage || '',
          lastUpdated: t.last_updated ? new Date(t.last_updated).toISOString() : new Date().toISOString(),
          messages: (t.messages || []).map((m: any) => ({
            sender: m.sender as any,
            text: m.text,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''
          }))
        };
      });
      setChatThreads(threadsObj);
    } catch (e) {
      console.error('Error loading DB chats:', e);
    }
  };

  useEffect(() => {
    loadDBChats();
    const interval = setInterval(loadDBChats, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendChatMessage = async (textOverride?: string) => {
    const msgText = textOverride || chatInput;
    if (!msgText.trim()) return;

    if (containsProfanity(msgText)) {
      showAlert("ขออภัยด้วยครับ ระบบไม่อนุญาตให้ส่งข้อความที่มีคำไม่สุภาพหรือคำหยาบคายครับ");
      if (!textOverride) {
        setChatInput('');
      }
      return;
    }

    const currentEmail = currentUser?.email || 'guest@maivzev.com';
    const currentUsername = currentUser ? currentUser.username : 'ผู้เยี่ยมชม';

    if (!textOverride) {
      setChatInput('');
    }

    try {
      await sendMessage(currentEmail, currentUsername, 'user', msgText);
      await loadDBChats();

      setIsBotTyping(true);
      setTimeout(async () => {
        const botReplyText = getBotResponse(msgText, !!currentUser);
        await sendMessage(currentEmail, currentUsername, 'bot', botReplyText);
        await loadDBChats();
        setIsBotTyping(false);
      }, 1000);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleAdminSendChatMessage = async () => {
    if (!selectedAdminChatKey || !adminChatInput.trim()) return;

    if (containsProfanity(adminChatInput)) {
      showAlert("ระบบไม่อนุญาตให้แอดมินส่งข้อความที่มีคำไม่สุภาพหรือคำหยาบคายครับ");
      return;
    }

    const targetThread = chatThreads[selectedAdminChatKey];
    if (!targetThread) return;

    const textToSend = adminChatInput;
    setAdminChatInput('');

    try {
      await sendMessage(targetThread.email || selectedAdminChatKey, targetThread.username, 'admin', textToSend);
      await loadDBChats();
    } catch (err) {
      console.error('Error sending admin message:', err);
    }
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('ขนาดไฟล์ใหญ่เกินไปครับ (สูงสุดไม่เกิน 20MB)');
        return;
      }
      (async () => {
        try {
          const compressed = await compressImage(file);
          const formData = new FormData();
          formData.append('file', compressed);
          const { url } = await uploadFile(formData);
          setSlipPreview(url);
        } catch (err) {
          console.error('Error uploading slip:', err);
          alert('เกิดข้อผิดพลาดในการอัปโหลดสลิปครับ');
        }
      })();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf6] text-stone-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* 1. Header (Navigation Bar) */}
      

      {viewMode === 'admin' ? (
        <div className="flex-1 bg-stone-50 min-h-screen pb-12 animate-in fade-in duration-300">
          {/* Admin Header Bar */}
          <div className="bg-white border-b border-stone-200 py-5 px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {currentUser?.profileImage ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-300 shadow-sm bg-purple-50 flex-shrink-0">
                    <img src={currentUser.profileImage} alt={currentUser.username} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">แผงจัดการข้อมูลระบบ (Admin Panel)</h2>
                  <p className="text-xs text-stone-550 font-medium">สิทธิ์ปัจจุบัน: {currentUser?.username} ({currentUser?.role})</p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('shop')}
                className="bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2"
              >
                🛒 กลับไปหน้าร้านค้า
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Menu */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200/60 shadow-sm flex flex-col gap-2 h-fit">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">เมนูหลัก</p>

                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'dashboard' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📊</span> หน้าหลัก Dashboard
                </button>

                <button
                  onClick={() => setAdminTab('products')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'products' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>🏷️</span> จัดการข้อมูลสินค้า
                </button>

                <button
                  onClick={() => setAdminTab('categories')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'categories' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📁</span> จัดการประเภทสินค้า
                </button>

                <button
                  onClick={() => setAdminTab('orders')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'orders' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>📦</span> จัดการคำสั่งซื้อ
                  {orders.filter(o => o.paymentStatus === 'รอตรวจสอบ').length > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                      {orders.filter(o => o.paymentStatus === 'รอตรวจสอบ').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('members')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'members' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>👥</span> จัดการสมาชิก
                </button>

                <button
                  onClick={() => setAdminTab('payments')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'payments' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>💳</span> ช่องทางชำระเงิน & ยอดขาย
                </button>

                <button
                  onClick={() => setAdminTab('chats')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${adminTab === 'chats' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <span>💬</span> แชทบริการลูกค้า
                  {Object.values(chatThreads).filter(t => t.unread).length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {Object.values(chatThreads).filter(t => t.unread).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 border border-stone-200/60 shadow-sm min-h-[500px]">

                {/* 0. SALES DASHBOARD TAB */}
                {adminTab === 'dashboard' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">แผงควบคุมและรายงานยอดขาย (Sales Dashboard)</h3>
                      <p className="text-sm text-stone-500 font-medium">ข้อมูลสรุปและวิเคราะห์ผลการดำเนินงานยอดขายประจำสวนของเรา</p>
                    </div>

                    {/* Stats summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <span className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 text-xl">💰</span>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">ยอดขายรวมทั้งหมด</p>
                            <p className="text-2xl font-extrabold text-stone-900 mt-1">
                              {orders.filter(o => o.paymentStatus === 'ชำระเงินแล้ว').reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()} บาท
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <span className="p-3 bg-purple-50 rounded-2xl text-purple-700 text-xl">📅</span>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">ยอดขายเดือนนี้ ({new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })})</p>
                            <p className="text-2xl font-extrabold text-stone-900 mt-1">
                              {orders
                                .filter(o => o.paymentStatus === 'ชำระเงินแล้ว' && o.createdAt && typeof o.createdAt === 'string' && o.createdAt.substring(0, 7) === getLocalYearMonth())
                                .reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()} บาท
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <span className="p-3 bg-amber-50 rounded-2xl text-amber-700 text-xl">📦</span>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">ออเดอร์ชำระเงินสำเร็จ</p>
                            <p className="text-2xl font-extrabold text-stone-900 mt-1">
                              {orders.filter(o => o.paymentStatus === 'ชำระเงินแล้ว').length} รายการ
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <span className="p-3 bg-red-50 rounded-2xl text-red-700 text-xl">🔥</span>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">สินค้าขายดีสุดเดือนนี้</p>
                            <p className="text-sm font-extrabold text-stone-900 mt-1 leading-snug break-words">
                              {(() => {
                                const currentMonth = getLocalYearMonth();
                                const productSales: { [name: string]: number } = {};
                                orders
                                  .filter(o => o.paymentStatus === 'ชำระเงินแล้ว' && o.createdAt && typeof o.createdAt === 'string' && o.createdAt.substring(0, 7) === currentMonth)
                                  .forEach(o => {
                                    o.items.forEach(item => {
                                      productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
                                    });
                                  });
                                let bestProduct = 'ไม่มีข้อมูล';
                                let maxQty = 0;
                                Object.entries(productSales).forEach(([name, qty]) => {
                                  if (qty > maxQty) {
                                    maxQty = qty;
                                    bestProduct = name;
                                  }
                                });
                                return maxQty > 0 ? `${bestProduct} (${maxQty} กก.)` : 'ไม่มีข้อมูล';
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Graphs and Best Sellers */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Sales breakdown */}
                      <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
                          <h4 className="font-bold text-stone-900 flex items-center gap-2">
                            <span>📈</span> รายงานสถิติตามช่วงเวลา
                          </h4>
                          {/* Period Selector Tabs */}
                          <div className="flex bg-stone-100 p-1 rounded-xl">
                            <button
                              onClick={() => setDashboardPeriod('daily')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardPeriod === 'daily' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                            >
                              รายวัน
                            </button>
                            <button
                              onClick={() => setDashboardPeriod('monthly')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardPeriod === 'monthly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                            >
                              รายเดือน
                            </button>
                            <button
                              onClick={() => setDashboardPeriod('yearly')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardPeriod === 'yearly' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                            >
                              รายปี
                            </button>
                          </div>
                        </div>

                        {/* List/Graph */}
                        <div className="space-y-4">
                          {(() => {
                            const paid = orders.filter(o => o.paymentStatus === 'ชำระเงินแล้ว');
                            let salesData: [string, number][] = [];
                            if (dashboardPeriod === 'daily') {
                              const daily: { [k: string]: number } = {};
                              paid.forEach(o => {
                                const d = (o.createdAt && typeof o.createdAt === 'string') ? o.createdAt.substring(0, 10) : '2026-07-07';
                                daily[d] = (daily[d] || 0) + o.totalPrice;
                              });
                              salesData = Object.entries(daily).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10);
                            } else if (dashboardPeriod === 'monthly') {
                              const monthly: { [k: string]: number } = {};
                              paid.forEach(o => {
                                const m = (o.createdAt && typeof o.createdAt === 'string') ? o.createdAt.substring(0, 7) : '2026-07';
                                monthly[m] = (monthly[m] || 0) + o.totalPrice;
                              });
                              salesData = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]));
                            } else {
                              const yearly: { [k: string]: number } = {};
                              paid.forEach(o => {
                                const y = (o.createdAt && typeof o.createdAt === 'string') ? o.createdAt.substring(0, 4) : '2026';
                                yearly[y] = (yearly[y] || 0) + o.totalPrice;
                              });
                              salesData = Object.entries(yearly).sort((a, b) => b[0].localeCompare(a[0]));
                            }

                            if (salesData.length === 0) {
                              return (
                                <p className="text-center text-xs text-stone-400 py-10 font-medium">ยังไม่มีข้อมูลยอดขายที่ได้รับชำระเงินสำเร็จ</p>
                              );
                            }

                            const maxVal = Math.max(...salesData.map(d => d[1]), 1);

                            return (
                              <div className="space-y-4">
                                <div className="overflow-x-auto rounded-2xl border border-stone-100">
                                  <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                      <tr className="bg-stone-50 text-stone-505 font-semibold border-b border-stone-100">
                                        <th className="p-3 pl-4">ช่วงเวลา</th>
                                        <th className="p-3">แนวโน้มยอดขาย</th>
                                        <th className="p-3 text-right pr-4">ยอดขายรวม</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                                      {salesData.map(([period, amt]) => {
                                        const pct = (amt / maxVal) * 100;
                                        return (
                                          <tr key={period} className="hover:bg-stone-50/50">
                                            <td className="p-3 pl-4 font-bold text-stone-900">{period}</td>
                                            <td className="p-3 w-1/2">
                                              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                                                <div
                                                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                                  style={{ width: `${pct}%` }}
                                                />
                                              </div>
                                            </td>
                                            <td className="p-3 text-right pr-4 font-extrabold text-emerald-800">{amt.toLocaleString()} บาท</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right: Best Sellers of Month */}
                      <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm space-y-6">
                        {(() => {
                          const paid = orders.filter(o => o.paymentStatus === 'ชำระเงินแล้ว');

                          // Extract unique year-month strings from paid orders
                          const availableMonths = Array.from(new Set(
                            paid
                              .filter(o => o.createdAt && typeof o.createdAt === 'string')
                              .map(o => o.createdAt.substring(0, 7))
                          )).sort((a, b) => b.localeCompare(a));

                          const currentMonthStr = getLocalYearMonth();
                          if (!availableMonths.includes(currentMonthStr)) {
                            availableMonths.unshift(currentMonthStr);
                          }

                          // Ensure bestSellerMonth is valid, or fallback to current month
                          const activeMonth = availableMonths.includes(bestSellerMonth) ? bestSellerMonth : currentMonthStr;

                          const productSales: { [name: string]: number } = {};
                          paid
                            .filter(o => o.createdAt && typeof o.createdAt === 'string' && o.createdAt.substring(0, 7) === activeMonth)
                            .forEach(o => {
                              o.items.forEach(item => {
                                productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
                              });
                            });

                          const list = Object.entries(productSales)
                            .map(([name, qty]) => {
                              const prod = products.find(p => p.name === name);
                              const rev = paid
                                .filter(o => o.createdAt && typeof o.createdAt === 'string' && o.createdAt.substring(0, 7) === activeMonth)
                                .reduce((sum, o) => {
                                  const item = o.items.find(i => i.productName === name);
                                  return sum + (item ? item.quantity * item.price : 0);
                                }, 0);
                              return { name, qty, rev, image: prod?.image || '/images/logo.png', unit: prod?.unit || 'กก.' };
                            })
                            .sort((a, b) => b.qty - a.qty);

                          return (
                            <>
                              <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-100">
                                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                                  <span>🍇</span> ขายดีประจำเดือน
                                </h4>
                                <select
                                  value={activeMonth}
                                  onChange={(e) => setBestSellerMonth(e.target.value)}
                                  className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-700 focus:outline-none"
                                >
                                  {availableMonths.map(m => {
                                    const [y, mm] = m.split('-');
                                    const monthName = new Date(parseInt(y), parseInt(mm) - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                                    return (
                                      <option key={m} value={m}>
                                        {monthName}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div className="space-y-4 pt-4">
                                {list.length === 0 ? (
                                  <p className="text-center text-xs text-stone-400 py-10 font-medium">ยังไม่มีข้อมูลออเดอร์ในเดือนนี้</p>
                                ) : (
                                  <div className="space-y-3">
                                    {list.map((item, idx) => (
                                      <div key={item.name} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100 rounded-2xl hover:border-purple-200 transition-all">
                                        <div className="font-bold text-stone-400 text-sm w-4 text-center">#{idx + 1}</div>
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-bold text-xs text-stone-900 truncate">{item.name}</h5>
                                          <p className="text-[10px] text-stone-500 font-semibold mt-0.5">ขายได้ {item.qty} {item.unit}</p>
                                        </div>
                                        <div className="text-right text-xs font-extrabold text-purple-700">
                                          {item.rev.toLocaleString()} บ.
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. PRODUCTS TAB */}
                {adminTab === 'products' && (
                  <div className="space-y-6">
                    {/* Category Filter Tabs for Admin */}
                    <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-4">
                      <button
                        onClick={() => setAdminCategoryFilter('ทั้งหมด')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${adminCategoryFilter === 'ทั้งหมด'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                      >
                        ทั้งหมด
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setAdminCategoryFilter(cat.name)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${adminCategoryFilter === cat.name
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                          📁 {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Product List View */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900">
                            จัดการข้อมูลสินค้า {adminCategoryFilter !== 'ทั้งหมด' && `(${adminCategoryFilter})`}
                          </h3>
                          <p className="text-sm text-stone-500 font-medium">เพิ่ม แก้ไข หรือลบรายการสินค้าในหมวดหมู่นี้</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setProductForm({
                              name: '',
                              price: 0,
                              originalPrice: 0,
                              promotionText: '',
                              unit: 'กก.',
                              image: '/images/black_grapes.png',
                              category: adminCategoryFilter !== 'ทั้งหมด' ? adminCategoryFilter : (categories[0]?.name || 'ผลไม้สด'),
                              stock: 50
                            });
                            setIsProductModalOpen(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          เพิ่มสินค้าใหม่
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-stone-100">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                              <th className="p-4">รูปภาพ</th>
                              <th className="p-4">ชื่อสินค้า</th>
                              <th className="p-4">หมวดหมู่</th>
                              <th className="p-4">ราคา & สต็อก</th>
                              <th className="p-4">โปรโมชั่น</th>
                              <th className="p-4">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                            {products
                              .filter(p => adminCategoryFilter === 'ทั้งหมด' || p.category === adminCategoryFilter)
                              .map((product) => (
                                <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                                  <td className="p-4">
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-100 bg-stone-50">
                                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <p className="font-bold text-stone-900">{product.name}</p>
                                    <p className="text-xs text-stone-500">รหัส: {product.id}</p>
                                  </td>
                                  <td className="p-4">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-bold border bg-purple-50 text-purple-700 border-purple-200">
                                      {product.category}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-stone-900 font-bold">{product.price} บาท/{product.unit}</div>
                                    <div className="text-xs font-semibold text-stone-500 space-y-1">
                                      <div>
                                        คงเหลือ: <span className={product.stock > 10 ? "text-emerald-700" : "text-red-650 font-bold"}>{product.stock} {product.unit}</span>
                                      </div>
                                      {product.stock <= 10 && (
                                        <div className="text-[10px] text-red-600 font-extrabold bg-red-50 border border-red-150 rounded px-1.5 py-0.5 w-fit">
                                          ⚠️ สินค้าใกล้หมด! กรุณาเพิ่มสินค้า
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    {product.originalPrice && product.originalPrice > product.price ? (
                                      <div className="space-y-0.5">
                                        <div className="text-xs font-bold text-red-600">
                                          ลดราคา (ปกติ {product.originalPrice} บ.)
                                        </div>
                                        {product.promotionText && (
                                          <div className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 w-fit font-bold">
                                            {product.promotionText}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-stone-400 text-xs">ไม่มีโปรโมชั่น</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setProductForm({
                                            name: product.name,
                                            price: product.price,
                                            originalPrice: product.originalPrice || 0,
                                            promotionText: product.promotionText || '',
                                            unit: product.unit,
                                            image: product.image,
                                            category: product.category,
                                            stock: product.stock
                                          });
                                          setIsProductModalOpen(true);
                                        }}
                                        className="bg-stone-100 hover:bg-purple-50 hover:text-purple-700 p-2 rounded-xl text-stone-600 transition-colors"
                                        title="แก้ไขข้อมูล"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`คุณแน่ใจว่าต้องการลบ ${product.name} ใช่หรือไม่?`)) {
                                            setProducts(products.filter(p => p.id !== product.id));
                                          }
                                        }}
                                        className="bg-stone-100 hover:bg-red-50 hover:text-red-700 p-2 rounded-xl text-stone-600 transition-colors"
                                        title="ลบสินค้า"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.5. CATEGORIES TAB */}
                {adminTab === 'categories' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">จัดการประเภทสินค้า</h3>
                        <p className="text-sm text-stone-500 font-medium">เพิ่ม แก้ไข หรือลบประเภทสินค้าในระบบ (เช่น ข้าวสาร, ผลไม้สด, ผลไม้แปรรูป)</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ name: '', description: '', image: '/images/jasmine_rice.png' });
                          setIsCategoryModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        เพิ่มประเภทสินค้าใหม่
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-100">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-150">
                            <th className="p-4">รูปภาพ</th>
                            <th className="p-4">ชื่อประเภทสินค้า</th>
                            <th className="p-4">คำอธิบาย</th>
                            <th className="p-4">จำนวนสินค้า</th>
                            <th className="p-4">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                          {categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-100 bg-stone-50">
                                  <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-stone-900">{cat.name}</p>
                                <p className="text-xs text-stone-400">รหัสอ้างอิง: {cat.id}</p>
                              </td>
                              <td className="p-4 text-stone-600 text-xs max-w-xs truncate">{cat.description}</td>
                              <td className="p-4">
                                <span className="bg-stone-100 text-stone-850 text-xs px-2.5 py-1 rounded-full font-bold">
                                  {products.filter(p => p.category === cat.name).length} รายการ
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(cat);
                                      setCategoryForm({ name: cat.name, description: cat.description, image: cat.image });
                                      setIsCategoryModalOpen(true);
                                    }}
                                    className="bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 p-2 rounded-xl text-stone-600 transition-colors"
                                    title="แก้ไขข้อมูล"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => {
                                      const count = products.filter(p => p.category === cat.name).length;
                                      if (count > 0) {
                                        alert(`ไม่สามารถลบหมวดหมู่ "${cat.name}" ได้ เนื่องจากยังมีสินค้าในหมวดหมู่นี้อยู่ ${count} รายการ กรุณาย้ายหรือลบสินค้าก่อนครับ`);
                                        return;
                                      }
                                      if (confirm(`คุณแน่ใจว่าต้องการลบประเภทสินค้า ${cat.name} ใช่หรือไม่?`)) {
                                        setCategories(categories.filter(c => c.id !== cat.id));
                                      }
                                    }}
                                    className="bg-stone-100 hover:bg-red-50 hover:text-red-700 p-2 rounded-xl text-stone-600 transition-colors"
                                    title="ลบหมวดหมู่"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. ORDERS TAB */}
                {adminTab === 'orders' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">จัดการข้อมูลคำสั่งซื้อของลูกค้า</h3>
                      <p className="text-sm text-stone-500 font-medium">ดูประวัติออเดอร์ ตรวจสอบการจ่ายเงิน และแก้ไขสถานะจัดส่ง</p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-100">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                            <th className="p-4">รหัสออเดอร์</th>
                            <th className="p-4">ลูกค้า</th>
                            <th className="p-4">ยอดรวม</th>
                            <th className="p-4">สถานะชำระเงิน</th>
                            <th className="p-4">สถานะจัดส่ง</th>
                            <th className="p-4">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4 font-bold text-purple-700">{order.id}</td>
                              <td className="p-4">
                                <p className="font-bold text-stone-900">{order.username}</p>
                                <p className="text-xs text-stone-400">{order.createdAt}</p>
                              </td>
                              <td className="p-4 font-bold text-stone-900">{order.totalPrice} บาท</td>
                              <td className="p-4">
                                <select
                                  value={order.paymentStatus}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as Order['paymentStatus'];
                                    setOrders(orders.map(o => o.id === order.id ? { ...o, paymentStatus: nextStatus } : o));
                                  }}
                                  className={`text-xs font-bold rounded-full px-2.5 py-1.5 border focus:outline-none cursor-pointer ${order.paymentStatus === 'ชำระเงินแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    order.paymentStatus === 'รอตรวจสอบ' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                >
                                  <option value="รอตรวจสอบ">⏳ รอตรวจสอบ</option>
                                  <option value="ชำระเงินแล้ว">✅ ชำระเงินแล้ว</option>
                                  <option value="ล้มเหลว">❌ ล้มเหลว</option>
                                </select>
                              </td>
                              <td className="p-4">
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as Order['orderStatus'];
                                    setOrders(orders.map(o => o.id === order.id ? { ...o, orderStatus: nextStatus } : o));
                                  }}
                                  className={`text-xs font-bold rounded-full px-2.5 py-1.5 border focus:outline-none cursor-pointer ${order.orderStatus === 'ส่งสำเร็จ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    order.orderStatus === 'กำลังจัดส่ง' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      order.orderStatus === 'รอดำเนินการ' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                >
                                  <option value="รอดำเนินการ">📦 รอดำเนินการ</option>
                                  <option value="กำลังจัดส่ง">🚚 กำลังจัดส่ง</option>
                                  <option value="ส่งสำเร็จ">🏁 ส่งสำเร็จ</option>
                                  <option value="ยกเลิก">❌ ยกเลิก</option>
                                </select>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                                >
                                  ดูรายละเอียด
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. MEMBERS TAB */}
                {adminTab === 'members' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">จัดการข้อมูลสมาชิก</h3>
                      <p className="text-sm text-stone-500 font-medium">ดูรายชื่อสมาชิก เปลี่ยนแปลงระดับสิทธิ์ผู้ใช้ หรือลบบัญชีสมาชิก</p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-stone-100">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                            <th className="p-4">ผู้ใช้งาน</th>
                            <th className="p-4">อีเมล</th>
                            <th className="p-4">ระดับสิทธิ์ (Role)</th>
                            <th className="p-4">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                          {users.map((user) => (
                            <tr key={user.email} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {user.profileImage ? (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 bg-stone-50">
                                      <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-sm">
                                      {user.username.charAt(0)}
                                    </div>
                                  )}
                                  <span className="font-bold text-stone-900">{user.username}</span>
                                </div>
                              </td>
                              <td className="p-4 text-stone-500">{user.email}</td>
                              <td className="p-4">
                                <select
                                  value={user.role}
                                  onChange={(e) => {
                                    const nextRole = e.target.value as UserProfile['role'];
                                    setUsers(users.map(u => u.email === user.email ? { ...u, role: nextRole } : u));
                                    if (currentUser?.email === user.email) {
                                      setCurrentUser({ ...currentUser, role: nextRole });
                                    }
                                  }}
                                  className="text-xs font-bold rounded-xl border border-stone-200 px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                  <option value="Admin">🛠️ Admin</option>
                                  <option value="Member">💎 Member</option>
                                  <option value="User">👤 User</option>
                                </select>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => setSelectedMemberOrders(user)}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-750 font-bold px-3 py-1.5 rounded-xl transition-all text-xs border border-purple-200"
                                  >
                                    📦 ประวัติสั่งซื้อ ({orders.filter(o => o.username === user.username).length})
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (currentUser?.email === user.email) {
                                        alert('คุณไม่สามารถลบบัญชีตัวเองที่กำลังเข้าสู่ระบบอยู่ได้ครับ');
                                        return;
                                      }
                                      if (confirm(`คุณแน่ใจว่าต้องการลบสมาชิก ${user.username} ใช่หรือไม่?`)) {
                                        setUsers(users.filter(u => u.email !== user.email));
                                      }
                                    }}
                                    className="bg-stone-100 hover:bg-red-50 hover:text-red-750 text-stone-600 font-bold px-3 py-1.5 rounded-xl transition-all text-xs border border-stone-200"
                                  >
                                    ลบสมาชิก
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. PAYMENTS TAB */}
                {adminTab === 'payments' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">ช่องทางการชำระเงิน & ภาพรวมยอดขาย</h3>
                      <p className="text-sm text-stone-500 font-medium">ภาพรวมการจำหน่ายสินค้าของร้านและการตรวจสอบอนุมัติการชำระเงิน</p>
                    </div>

                    {/* Sales Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">ยอดขายที่ยืนยันแล้ว</p>
                        <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                          {orders.filter(o => o.paymentStatus === 'ชำระเงินแล้ว').reduce((sum, o) => sum + o.totalPrice, 0)} บาท
                        </p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">จากคำสั่งซื้อที่ได้รับการชำระเงินแล้ว</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">ยอดขายรออนุมัติ</p>
                        <p className="text-2xl font-extrabold text-amber-900 mt-1">
                          {orders.filter(o => o.paymentStatus === 'รอตรวจสอบ').reduce((sum, o) => sum + o.totalPrice, 0)} บาท
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">อยู่ระหว่างรอการอนุมัติสลิปโอนเงิน</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-purple-50 border border-purple-100">
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">จำนวนคำสั่งซื้อทั้งหมด</p>
                        <p className="text-2xl font-extrabold text-purple-900 mt-1">{orders.length} รายการ</p>
                        <p className="text-[10px] text-purple-600 mt-0.5">คำสั่งซื้อในระบบทั้งหมด</p>
                      </div>
                    </div>

                    {/* Pending Approvals Table */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-stone-900 flex items-center gap-2">
                        <span>⏳</span> ตรวจสอบการโอนเงินที่รอการอนุมัติ
                      </h4>
                      {orders.filter(o => o.paymentStatus === 'รอตรวจสอบ').length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-stone-200 rounded-2xl text-stone-500 font-medium">
                          ไม่มีออเดอร์ที่ค้างตรวจสอบยอดชำระเงิน
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-stone-100">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                                <th className="p-4">รหัสออเดอร์</th>
                                <th className="p-4">ผู้สั่งซื้อ</th>
                                <th className="p-4">ช่องทาง</th>
                                <th className="p-4 text-center">สลิปการโอน</th>
                                <th className="p-4">ยอดเงิน</th>
                                <th className="p-4">การจัดการอนุมัติ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                              {orders.filter(o => o.paymentStatus === 'รอตรวจสอบ').map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50/50">
                                  <td className="p-4 font-bold text-purple-700">{order.id}</td>
                                  <td className="p-4 text-stone-900 font-bold">{order.username}</td>
                                  <td className="p-4 text-stone-600">{order.paymentMethod}</td>
                                  <td className="p-4 text-center">
                                    {order.slipUrl ? (
                                      <button
                                        onClick={() => setViewingSlipUrl(order.slipUrl || null)}
                                        className="inline-flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-100 transition-all shadow-sm"
                                        title="คลิกเพื่อดูสลิปภาพใหญ่"
                                      >
                                        🖼️ ดูสลิป
                                      </button>
                                    ) : (
                                      <span className="text-stone-400 text-xs">ไม่ได้แนบสลิป</span>
                                    )}
                                  </td>
                                  <td className="p-4 font-extrabold text-emerald-800">{order.totalPrice} บาท</td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setOrders(orders.map(o => o.id === order.id ? { ...o, paymentStatus: 'ชำระเงินแล้ว', orderStatus: 'กำลังจัดส่ง' } : o));
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all"
                                      >
                                        ✔️ อนุมัติสลิป
                                      </button>
                                      <button
                                        onClick={() => {
                                          setOrders(orders.map(o => o.id === order.id ? { ...o, paymentStatus: 'ล้มเหลว', orderStatus: 'ยกเลิก' } : o));
                                        }}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all border border-red-200"
                                      >
                                        ❌ ปฏิเสธ
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. CUSTOMER CHATS TAB */}
                {adminTab === 'chats' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">💬 แชทบริการลูกค้า (Customer Live Chat Support)</h3>
                      <p className="text-sm text-stone-500 font-medium">ตอบกลับลูกค้าและบริการปรึกษาข้อมูลแบบเรียลไทม์แทนระบบตอบคำถามอัตโนมัติ</p>
                    </div>

                    <div className="h-[600px] flex flex-col md:flex-row bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-sm">
                      {/* Left Panel: Chat List */}
                      <div className="w-full md:w-80 border-r border-stone-200 flex flex-col bg-stone-50/50">
                        <div className="p-4 border-b border-stone-200 bg-white">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">ห้องสนทนาทั้งหมด</p>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                          {Object.keys(chatThreads).length === 0 ? (
                            <div className="p-8 text-center text-stone-400 text-xs font-bold">
                              ไม่มีประวัติการแชทในระบบ
                            </div>
                          ) : (
                            Object.entries(chatThreads)
                              .sort((a, b) => new Date(b[1].lastUpdated).getTime() - new Date(a[1].lastUpdated).getTime())
                              .map(([key, thread]) => {
                                const lastMsg = thread.messages[thread.messages.length - 1];
                                const isSelected = selectedAdminChatKey === key;
                                return (
                                  <div
                                    key={key}
                                    onClick={() => {
                                      setSelectedAdminChatKey(key);
                                      // Clear unread flag
                                      setChatThreads(prev => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          unread: false
                                        }
                                      }));
                                    }}
                                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 select-none ${isSelected
                                      ? 'bg-purple-50/80 border-l-4 border-purple-600 font-bold'
                                      : 'hover:bg-stone-50'
                                      }`}
                                  >
                                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                      {key === 'ผู้เยี่ยมชม' ? '👤' : key.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className={`text-xs font-bold truncate ${thread.unread ? 'text-stone-900 font-black' : 'text-stone-700'}`}>
                                          {key}
                                        </p>
                                        <span className="text-[9px] text-stone-400 font-bold shrink-0">
                                          {lastMsg ? lastMsg.timestamp : ''}
                                        </span>
                                      </div>
                                      <p className={`text-[11px] truncate mt-1 ${thread.unread ? 'text-purple-750 font-black' : 'text-stone-500 font-medium'}`}>
                                        {lastMsg ? lastMsg.text : 'เริ่มการสนทนา'}
                                      </p>
                                      {thread.email && (
                                        <p className="text-[9px] text-stone-400 font-mono mt-0.5 truncate">{thread.email}</p>
                                      )}
                                    </div>
                                    {thread.unread && (
                                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse mt-1.5"></span>
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>

                      {/* Right Panel: Selected Chat Thread */}
                      <div className="flex-1 flex flex-col bg-[#fafaf8] min-w-0">
                        {selectedAdminChatKey && chatThreads[selectedAdminChatKey] ? (
                          <>
                            {/* Thread Header */}
                            <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                                  {selectedAdminChatKey === 'ผู้เยี่ยมชม' ? '👤' : selectedAdminChatKey.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-extrabold text-sm text-stone-850">{selectedAdminChatKey}</h4>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${selectedAdminChatKey === 'ผู้เยี่ยมชม'
                                      ? 'bg-stone-55 border-stone-200 text-stone-600'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      }`}>
                                      {selectedAdminChatKey === 'ผู้เยี่ยมชม' ? 'ผู้เยี่ยมชม' : 'สมาชิกในระบบ'}
                                    </span>
                                  </div>
                                  {chatThreads[selectedAdminChatKey].email && (
                                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">{chatThreads[selectedAdminChatKey].email}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Timeline Messages Feed */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              {chatThreads[selectedAdminChatKey].messages.map((msg, idx) => {
                                const isMe = msg.sender === 'admin';
                                return (
                                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-150`}>
                                    <div className="flex items-end gap-2 max-w-[80%]">
                                      {!isMe && (
                                        <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                          {msg.sender === 'bot' ? '👵' : '👤'}
                                        </div>
                                      )}
                                      <div className="flex flex-col">
                                        {!isMe && (
                                          <span className="text-[9px] text-stone-400 font-bold mb-0.5 ml-1">
                                            {msg.sender === 'bot' ? 'บอทตอบอัตโนมัติ (👵)' : 'ลูกค้า'}
                                          </span>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold leading-relaxed whitespace-pre-line shadow-sm ${isMe
                                          ? 'bg-[#7e22ce] text-white rounded-br-none font-bold'
                                          : msg.sender === 'bot'
                                            ? 'bg-white border border-stone-200 text-stone-500 font-semibold'
                                            : 'bg-white border border-stone-200 text-stone-850 font-bold'
                                          }`}>
                                          {msg.text}
                                        </div>
                                        <span className={`text-[9px] text-stone-400 font-semibold mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                          {msg.timestamp}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={adminChatEndRef} />
                            </div>

                            {/* Reply Input Form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAdminSendChatMessage();
                              }}
                              className="p-4 bg-white border-t border-stone-200 flex gap-3 items-center"
                            >
                              <input
                                type="text"
                                value={adminChatInput}
                                onChange={(e) => setAdminChatInput(e.target.value)}
                                placeholder={`พิมพ์ข้อความตอบกลับคุณ ${selectedAdminChatKey}...`}
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-purple-600 font-semibold text-stone-850"
                              />
                              <button
                                type="submit"
                                className="bg-[#166534] hover:bg-emerald-800 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md shrink-0"
                              >
                                ส่งคำตอบ
                              </button>
                            </form>
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="text-5xl mb-4">💬</div>
                            <h4 className="font-extrabold text-stone-800 text-base">ศูนย์บริการลูกค้าสัมพันธ์</h4>
                            <p className="text-xs text-stone-500 font-medium max-w-xs mt-1">
                              เลือกห้องแชทของลูกค้าหรือผู้เยี่ยมชมจากรายการด้านซ้าย เพื่อตรวจสอบประวัติการสนทนาและพิมพ์พูดคุยตอบกลับ
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* PRODUCT ADD/EDIT MODAL */}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-stone-900">
                    {editingProduct ? '✏️ แก้ไขรายละเอียดสินค้า' : '✨ เพิ่มสินค้าใหม่'}
                  </h4>
                  <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (editingProduct) {
                    setProducts(products.map(p => p.id === editingProduct.id ? {
                      ...p,
                      name: productForm.name,
                      price: Number(productForm.price),
                      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
                      promotionText: productForm.promotionText || undefined,
                      unit: productForm.unit,
                      image: productForm.image,
                      category: productForm.category,
                      stock: Number(productForm.stock)
                    } : p));
                  } else {
                    const newProduct: Product = {
                      id: `p_${Date.now()}`,
                      name: productForm.name,
                      price: Number(productForm.price),
                      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
                      promotionText: productForm.promotionText || undefined,
                      unit: productForm.unit,
                      image: productForm.image || '/images/red_grapes.png',
                      category: productForm.category || (categories[0]?.name || 'ผลไม้สด'),
                      stock: Number(productForm.stock)
                    };
                    setProducts([...products, newProduct]);
                  }
                  setIsProductModalOpen(false);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ชื่อสินค้า</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ราคาขาย (บาท)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">หน่วยสินค้า</label>
                      <input
                        type="text"
                        required
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ราคาปกติ (กรณีทำโปรโมชั่น)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="ไม่ใส่ก็ได้"
                        value={productForm.originalPrice || ''}
                        onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ข้อความโปรโมชั่น</label>
                      <input
                        type="text"
                        placeholder="เช่น ลด 20%, แนะนำ"
                        value={productForm.promotionText || ''}
                        onChange={(e) => setProductForm({ ...productForm, promotionText: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">หมวดหมู่สินค้า</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase mb-1">จำนวนสต็อกสินค้า</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รูปภาพสินค้า (พิมพ์ URL หรือเลือกด้านล่าง)</label>
                    <input
                      type="text"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="ใส่ URL ลิงก์รูปภาพ หรือเลือกจากรายการด้านล่าง..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold mb-2"
                    />
                    <select
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                    >
                      <option value="">-- เลือกจากภาพแนะนำ --</option>
                      <option value="/images/black_grapes.png">องุ่นดำไร้เมล็ด</option>
                      <option value="/images/red_grapes.png">องุ่นแดง</option>
                      <option value="/images/jasmine_rice.png">ข้าวหอมมะลิ</option>
                      <option value="/images/sticky_rice.png">ข้าวเหนียว</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="w-1/2 border border-stone-300 hover:bg-stone-50 text-stone-750 font-bold py-3 rounded-full text-sm transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-bold py-3 rounded-full text-sm transition-all shadow-md"
                    >
                      {editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CATEGORY ADD/EDIT MODAL */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-bold text-stone-900">
                    {editingCategory ? '✏️ แก้ไขรายละเอียดประเภทสินค้า' : '✨ เพิ่มประเภทสินค้าใหม่'}
                  </h4>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (editingCategory) {
                    setCategories(categories.map(c => c.id === editingCategory.id ? {
                      ...c,
                      name: categoryForm.name,
                      description: categoryForm.description,
                      image: categoryForm.image
                    } : c));
                  } else {
                    const newId = `cat_${Date.now()}`;
                    const newCategory: Category = {
                      id: newId,
                      name: categoryForm.name,
                      description: categoryForm.description,
                      image: categoryForm.image || '/images/jasmine_rice.png',
                      gradient: 'from-emerald-50/50 to-purple-50/50 hover:from-emerald-100/50 hover:to-purple-100/50',
                      badgeColor: 'bg-emerald-100 text-emerald-850 border-emerald-200'
                    };
                    setCategories([...categories, newCategory]);
                  }
                  setIsCategoryModalOpen(false);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ชื่อประเภทสินค้า</label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="เช่น ข้าวสาร, ผลไม้แปรรูป..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">คำอธิบายประเภทสินค้า</label>
                    <textarea
                      required
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="คำอธิบายหมวดหมู่สั้นๆ เช่น ผลไม้ออร์แกนิกตามฤดูกาล..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รูปภาพประเภท (ลิงก์ URL หรือเลือกด้านล่าง)</label>
                    <input
                      type="text"
                      value={categoryForm.image}
                      onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                      placeholder="ใส่ URL ลิงก์รูปภาพ หรือเลือกจากรายการด้านล่าง..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold mb-2"
                    />
                    <select
                      value={categoryForm.image}
                      onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600 font-bold"
                    >
                      <option value="/images/jasmine_rice.png">ข้าวหอมมะลิ</option>
                      <option value="/images/red_grapes.png">องุ่นแดง</option>
                      <option value="/images/black_grapes.png">องุ่นไร้เมล็ด</option>
                      <option value="/images/hero_banner.png">แบนเนอร์สวน</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="w-1/2 border border-stone-300 hover:bg-stone-50 text-stone-750 font-bold py-3 rounded-full text-sm transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-full text-sm transition-all shadow-md"
                    >
                      {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทสินค้า'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADMIN ORDER DETAILS MODAL */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-150">
                  <h4 className="text-xl font-bold text-stone-900">
                    📋 รายละเอียดคำสั่งซื้อ {selectedOrder.id}
                  </h4>
                  <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {/* Customer Information */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
                    <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">ข้อมูลผู้ซื้อ</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-semibold text-stone-800">
                      <div>
                        <span className="text-stone-400 font-medium">ชื่อลูกค้า:</span> {selectedOrder.username}
                      </div>
                      <div>
                        <span className="text-stone-400 font-medium">เบอร์โทรศัพท์:</span> {selectedOrder.phone || 'ไม่ได้ระบุ'}
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 font-medium">ที่อยู่จัดส่ง:</span>{' '}
                        <p className="mt-1 bg-white p-2.5 rounded-xl border border-stone-150 font-semibold text-xs leading-relaxed text-stone-700 whitespace-pre-wrap">
                          {selectedOrder.shippingAddress || 'ไม่ได้ระบุที่อยู่จัดส่ง'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products ordered list */}
                  <div className="space-y-2">
                    <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">รายการสินค้าที่สั่งซื้อ</h5>
                    <div className="divide-y divide-stone-150 border border-stone-150 rounded-2xl overflow-hidden bg-white">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 text-xs sm:text-sm font-bold text-stone-850">
                          <div className="flex flex-col">
                            <span>{item.productName}</span>
                            <span className="text-stone-400 text-[11px] font-medium mt-0.5">
                              {item.price} บาท / {item.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-stone-500 font-semibold">x {item.quantity} {item.unit}</span>
                            <span className="block text-emerald-800 font-extrabold mt-0.5">{item.price * item.quantity} บาท</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Status Overview */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2.5">
                    <h5 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">สรุปการชำระเงินและสถานะ</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-stone-800">
                      <div>
                        <p className="text-[11px] text-stone-400 font-medium">ช่องทางการชำระเงิน:</p>
                        <p className="text-sm font-extrabold text-stone-800 mt-0.5">💳 {selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-400 font-medium">ยอดชำระเงินสุทธิ:</p>
                        <p className="text-sm font-extrabold text-emerald-850 mt-0.5">{selectedOrder.totalPrice} บาท</p>
                      </div>
                    </div>

                    {selectedOrder.slipUrl && (
                      <div className="pt-2.5 border-t border-stone-150 space-y-1.5">
                        <p className="text-[11px] text-stone-400 font-medium">หลักฐานการโอนเงิน (สลิป):</p>
                        <div className="relative group w-36 h-48 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm cursor-zoom-in">
                          <img
                            src={selectedOrder.slipUrl}
                            alt="Slip Payment"
                            className="w-full h-full object-cover"
                            onClick={() => setViewingSlipUrl(selectedOrder.slipUrl || null)}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-extrabold uppercase pointer-events-none">
                            🔍 ดูสลิปภาพใหญ่
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-150 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="bg-stone-900 hover:bg-stone-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* 2. Hero Section */}
          {activePage === 'home' && (
            <section className="bg-[#f3f4ee] py-12 md:py-20 overflow-hidden animate-in fade-in duration-300">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  {/* Left Content */}
                  <div className="space-y-6 text-center md:text-left">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                      <span className="text-[#166534] block mb-2 drop-shadow-sm">สดใหม่จากสวน</span>
                      <span className="text-[#7e22ce] block drop-shadow-sm">ส่งตรงถึงบ้านคุณ</span>
                    </h2>
                    <div className="space-y-3 text-lg text-stone-600 font-medium max-w-lg mx-auto md:mx-0">
                      <div className="flex items-center justify-center md:justify-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <p>องุ่นหวาน อร่อย ปลอดสารพิษ</p>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                        <p>ข้าวสารหอม นุ่ม คุณภาพดี</p>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActivePage('products'); setSelectedCategory(null); }}
                        className="bg-[#7e22ce] hover:bg-[#6b21a8] text-white text-lg font-semibold px-8 py-4 rounded-full flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        สั่งซื้อเลย
                      </a>
                    </div>
                  </div>

                  {/* Right Image */}
                  <div className="relative mx-auto md:mr-0 w-full max-w-md md:max-w-xl aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100 transform hover:scale-[1.01] transition-transform duration-300">
                    <Image
                      src="/images/hero_banner.png"
                      alt="Grapes and Jasmine Rice from our family garden"
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-w-768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. Value Propositions (Highlights) */}
          {activePage === 'home' && (
            <section className="py-12 bg-white border-b border-stone-100 animate-in fade-in duration-300">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-4 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 hover:shadow-md transition-shadow">
                    <div className="bg-emerald-600/10 p-3.5 rounded-2xl text-emerald-800">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-stone-900">สดใหม่ ปลอดสาร</h4>
                      <p className="text-sm text-stone-600 mt-1 font-medium">ปลูกด้วยความใส่ใจ</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-4 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 hover:shadow-md transition-shadow">
                    <div className="bg-emerald-600/10 p-3.5 rounded-2xl text-emerald-800">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-stone-900">จัดส่งรวดเร็ว</h4>
                      <p className="text-sm text-stone-600 mt-1 font-medium">ถึงมือคุณอย่างปลอดภัย</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-4 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 hover:shadow-md transition-shadow">
                    <div className="bg-emerald-600/10 p-3.5 rounded-2xl text-emerald-800">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-stone-900">คุณภาพดี</h4>
                      <p className="text-sm text-stone-600 mt-1 font-medium">คัดสรรสินค้าพิเศษ</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. Best Sellers Section */}
          {activePage === 'products' && (
            <section id="products-section" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 animate-in fade-in duration-300">
              {isDataLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h4 className="text-base font-bold text-stone-900">กำลังโหลดรายการสินค้าและหมวดหมู่...</h4>
                    <p className="text-xs text-stone-500 mt-1">กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุดจากสวน</p>
                  </div>
                </div>
              ) : selectedCategory === null ? (
                <div>
                  <div className="text-center space-y-4 mb-16">
                    <h3 className="text-3xl font-extrabold text-stone-900 relative inline-block pb-3">
                      หมวดหมู่สินค้า
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#166534] rounded-full"></span>
                    </h3>
                    <p className="text-stone-500 text-base max-w-md mx-auto">
                      เลือกชมสินค้าคุณภาพจากสวนที่เราตั้งใจคัดสรรเพื่อคุณและครอบครัว
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.name);
                          // Smooth scroll to the products section header to give good feedback
                          document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`group relative text-left bg-gradient-to-br ${category.gradient || 'from-emerald-50/50 to-purple-50/50'} border border-stone-200/60 rounded-3xl overflow-hidden shadow-sm md:hover:shadow-xl transition-all duration-300 md:transform md:hover:-translate-y-1.5 focus:outline-none flex flex-col h-[380px] w-full touch-manipulation`}
                      >
                        {/* Category Image container */}
                        <div className="relative w-full h-[60%] overflow-hidden bg-stone-100">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="object-cover w-full h-full md:group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <span className={`absolute top-4 left-4 border ${category.badgeColor || 'bg-emerald-100 text-emerald-800 border-emerald-200'} text-xs font-bold px-3 py-1.5 rounded-full shadow-sm`}>
                            {products.filter(p => p.category === category.name).length} รายการ
                          </span>
                        </div>

                        {/* Category Content */}
                        <div className="p-6 flex-1 flex flex-col justify-between bg-white/85 backdrop-blur-sm">
                          <div>
                            <h4 className="text-2xl font-extrabold text-stone-900 group-hover:text-emerald-800 transition-colors flex items-center gap-2">
                              {category.name}
                              <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </h4>
                            <p className="text-stone-600 text-sm mt-2 leading-relaxed line-clamp-2">
                              {category.description}
                            </p>
                          </div>

                          <div className="text-emerald-700 text-sm font-semibold flex items-center gap-1.5 mt-4">
                            เลือกดูสินค้าหมวดหมู่นี้
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Header and Back Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12 pb-6 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="bg-white border border-stone-200 text-stone-600 hover:border-emerald-600 hover:text-emerald-700 p-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center focus:outline-none"
                        title="ย้อนกลับไปหน้าหมวดหมู่"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div>
                        <div className="text-xs text-stone-500 font-medium">หมวดหมู่สินค้า</div>
                        <h3 className="text-3xl font-extrabold text-stone-900">
                          {selectedCategory}
                        </h3>
                      </div>
                    </div>


                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products
                      .filter((product) => product.category === selectedCategory)
                      .map((product) => {
                        const qty = cart[product.id] || 0;
                        return (
                          <div
                            key={product.id}
                            className="group bg-white rounded-3xl overflow-hidden border border-stone-100 md:hover:border-emerald-200/60 shadow-sm md:hover:shadow-xl transition-all duration-300 flex flex-col md:transform md:hover:-translate-y-1.5"
                          >
                            {/* Product Image */}
                            <div
                              onClick={() => setSelectedProductDetail(product)}
                              className="relative w-full aspect-square bg-stone-50 overflow-hidden cursor-pointer"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="object-cover w-full h-full md:group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                {product.category}
                              </span>
                            </div>

                            {/* Product Info */}
                            <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                      ลดพิเศษ
                                    </span>
                                  )}
                                  {product.promotionText && (
                                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                                      {product.promotionText}
                                    </span>
                                  )}
                                </div>
                                <h4
                                  onClick={() => setSelectedProductDetail(product)}
                                  className="text-xl font-bold text-stone-900 group-hover:text-emerald-800 transition-colors cursor-pointer"
                                >
                                  {product.name}
                                </h4>
                                {/* Rating & Sales Count */}
                                {(() => {
                                  const { avg, count } = getProductRatingStats(product.id);
                                  const salesCount = getProductSalesCount(product.name);
                                  return (
                                    <div className="flex items-center gap-1.5 text-xs mt-1.5">
                                      {count > 0 ? (
                                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                                          <span>★</span>
                                          <span>{avg}</span>
                                          <span className="text-stone-400 font-normal">({count})</span>
                                        </div>
                                      ) : (
                                        <span className="text-stone-400">ยังไม่มีรีวิว</span>
                                      )}
                                      <span className="text-stone-300">·</span>
                                      <span className="font-semibold text-emerald-800">ขายแล้ว {salesCount} ครั้ง</span>
                                    </div>
                                  );
                                })()}
                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-[#166534] text-lg font-extrabold">
                                    {product.price} <span className="text-sm font-medium text-stone-500">บาท/{product.unit}</span>
                                  </span>
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-stone-400 line-through text-xs font-semibold">
                                      {product.originalPrice} บาท
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-xs font-bold text-stone-500">
                                  คงเหลือ: {product.stock > 0 ? (
                                    <span className="text-emerald-700">{product.stock} {product.unit}</span>
                                  ) : (
                                    <span className="text-red-600">สินค้าหมด</span>
                                  )}
                                </div>
                              </div>

                              {/* Add to Cart Actions */}
                              <div className="pt-2">
                                {!currentUser ? (
                                  <button
                                    onClick={() => {
                                      setModalMode('login');
                                      setIsLoginModalOpen(true);
                                    }}
                                    className="w-full bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-700 font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none touch-manipulation text-sm border border-stone-200 cursor-pointer"
                                  >
                                    🔒 เข้าสู่ระบบเพื่อสั่งซื้อ
                                  </button>
                                ) : qty > 0 ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-emerald-50 rounded-full p-1.5 border border-emerald-100">
                                      <button
                                        onClick={() => removeFromCart(product.id)}
                                        className="bg-white text-emerald-800 border border-emerald-200 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-emerald-600 hover:text-white transition-colors focus:outline-none touch-manipulation"
                                      >
                                        -
                                      </button>
                                      <span className="font-bold text-emerald-950 text-base">{qty} {product.unit}</span>
                                      <button
                                        onClick={() => addToCart(product.id)}
                                        disabled={qty >= product.stock}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border transition-colors focus:outline-none touch-manipulation ${qty >= product.stock
                                          ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                          }`}
                                      >
                                        +
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleBuyNow(product.id)}
                                      className="w-full bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-bold py-2.5 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none text-sm shadow-md cursor-pointer"
                                    >
                                      ⚡ ซื้อทันที
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => addToCart(product.id)}
                                      disabled={product.stock <= 0}
                                      className={`w-full font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none text-sm shadow-md ${product.stock > 0
                                        ? 'bg-[#166534] hover:bg-emerald-800 text-white'
                                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                        }`}
                                    >
                                      {product.stock > 0 ? 'ใส่ตะกร้า' : 'สินค้าหมด'}
                                    </button>
                                    {product.stock > 0 && (
                                      <button
                                        onClick={() => handleBuyNow(product.id)}
                                        className="w-full bg-[#7e22ce] hover:bg-[#6b21a8] text-white font-bold py-2.5 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none text-sm shadow-md cursor-pointer"
                                      >
                                        ⚡ ซื้อทันที
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5. วิธีสั่งซื้อสินค้า Section */}
          {activePage === 'delivery' && (
            <section id="delivery-section" className="py-16 bg-[#f3f4ee] border-b border-stone-150 flex-1 animate-in fade-in duration-300">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                  <h3 className="text-3xl font-extrabold text-stone-900 relative inline-block pb-3">
                    ขั้นตอนการสั่งซื้อสินค้า
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#166534] rounded-full"></span>
                  </h3>
                  <p className="text-stone-500 text-base max-w-md mx-auto">
                    สั่งซื้อสินค้าจากสวนง่ายๆ เพียง 3 ขั้นตอน
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-extrabold text-lg mx-auto">
                      1
                    </div>
                    <h4 className="text-lg font-bold text-stone-900">เลือกสินค้าใส่ตะกร้า</h4>
                    <p className="text-sm text-stone-600 font-medium">เลือกชมผลไม้สด ข้าวสาร และกดเพิ่มใส่ตะกร้าตามจำนวนที่ต้องการ</p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-extrabold text-lg mx-auto">
                      2
                    </div>
                    <h4 className="text-lg font-bold text-stone-900">โอนเงินและแนบสลิป</h4>
                    <p className="text-sm text-stone-600 font-medium">กรอกที่อยู่จัดส่ง เลือกช่องทางการชำระเงิน โอนเงินผ่านพร้อมเพย์/ธนาคาร และแนบหลักฐานการโอนเงิน</p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-extrabold text-lg mx-auto">
                      3
                    </div>
                    <h4 className="text-lg font-bold text-stone-900">รอรับสินค้าที่บ้าน</h4>
                    <p className="text-sm text-stone-600 font-medium">แอดมินสวนตรวจสอบหลักฐานการชำระเงินและทำการจัดส่ง สดใหม่ถึงหน้าบ้านคุณ</p>
                  </div>
                </div>

                {/* Redirect Button */}
                <div className="mt-12 text-center">
                  <button
                    onClick={() => {
                      setActivePage('products');
                      setSelectedCategory(null);
                    }}
                    className="bg-[#166534] hover:bg-emerald-800 text-white font-bold px-8 py-4 rounded-full text-base shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    🛒 ไปเลือกซื้อสินค้า
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 5.5 Contact Us Page */}
          {activePage === 'articles' && (
            <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 animate-in fade-in duration-300">
              <div className="space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-stone-900 relative inline-block pb-3">
                    บทความน่ารู้ & สรรพคุณสินค้า
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-[#166534] rounded-full"></span>
                  </h3>
                  <p className="text-stone-500 text-sm font-medium leading-relaxed">
                    เพิ่มความเข้าใจและเรียนรู้เกี่ยวกับประโยชน์ สรรพคุณขององุ่นสดหวานกรอบ และข้าวสารหอมนุ่มจากสวนครอบครัวธรรมชาติ เพื่อช่วยให้คุณเลือกซื้อสิ่งที่ดีและมีประโยชน์สูงสุดสำหรับสุขภาพของคุณ
                  </p>
                </div>

                {/* Article Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {initialArticles.map((article) => (
                    <article
                      key={article.id}
                      className="group bg-white rounded-3xl overflow-hidden border border-stone-200/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-1.5"
                    >
                      {/* Image */}
                      <div className="relative w-full h-48 bg-stone-100 overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                          {article.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-stone-400">{article.date}</span>
                          <h4 className="text-base font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#166534] transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-xs text-stone-500 leading-relaxed font-medium line-clamp-3">
                            {article.excerpt}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="w-full bg-emerald-50 hover:bg-[#166534] hover:text-white text-emerald-800 font-bold py-2.5 rounded-full text-xs transition-all flex items-center justify-center gap-1.5 border border-emerald-100 cursor-pointer"
                        >
                          📖 อ่านบทความเต็ม
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activePage === 'contact' && (
            <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] shadow-xl border border-stone-100 p-8 md:p-12 space-y-10">

                {/* Header */}
                <div className="border-b border-stone-100 pb-6 text-center md:text-left">
                  <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
                    <span className="text-4xl">📞</span> ติดต่อเรา
                  </h3>
                  <p className="text-stone-505 text-sm mt-2 font-medium text-stone-500">
                    หากคุณมีคำถามหรือต้องการติดต่อสั่งซื้อเพิ่มเติม สามารถติดต่อเราได้ตามช่องทางด้านล่างนี้ครับ
                  </p>
                </div>

                {/* Grid for Contact details and Map */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">

                  {/* Left: Contact Info Items */}
                  <div className="flex flex-col justify-center space-y-6">

                    {/* Phone */}
                    <a
                      href="tel:0812345678"
                      className="group flex items-center gap-5 p-5 rounded-2xl bg-stone-50 hover:bg-emerald-50/60 border border-stone-100 hover:border-emerald-200 transition-all duration-300 shadow-sm"
                    >
                      <div className="w-14 h-14 bg-white text-emerald-700 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">โทรศัพท์</div>
                        <div className="text-lg font-extrabold text-stone-800 group-hover:text-emerald-900 transition-colors">
                          065-469-5103
                        </div>
                      </div>
                    </a>

                    {/* LINE */}
                    <a
                      href="https://line.me/ti/p/5w0a27CVI3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-5 p-5 rounded-2xl bg-stone-50 hover:bg-[#06c755]/5 border border-stone-100 hover:border-[#06c755]/20 transition-all duration-300 shadow-sm"
                    >
                      <div className="w-14 h-14 bg-[#06c755] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <span className="font-black text-sm tracking-tighter">LINE</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">LINE ID</div>
                        <div className="text-lg font-extrabold text-stone-800 group-hover:text-[#05b04b] transition-colors">
                          0907547548
                        </div>
                      </div>
                    </a>

                    {/* Facebook */}
                    <a
                      href="https://www.facebook.com/share/1DLqnxzo2t/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-5 p-5 rounded-2xl bg-stone-50 hover:bg-blue-50 border border-stone-100 hover:border-blue-200 transition-all duration-300 shadow-sm"
                    >
                      <div className="w-14 h-14 bg-[#1877f2] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Facebook </div>
                        <div className="text-lg font-extrabold text-stone-800 group-hover:text-blue-800 transition-colors">
                          ชาติชาย วงศ์นภาวิเศษ
                        </div>
                      </div>
                    </a>

                    {/* Address */}
                    <div className="flex items-center gap-5 p-5 rounded-2xl bg-stone-50 border border-stone-100 shadow-sm">
                      <div className="w-14 h-14 bg-white text-emerald-700 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">ที่อยู่</div>
                        <div className="text-sm font-bold text-stone-800 leading-relaxed">
                          167 ต.สะเนียน อ.เมืองน่าน จ.น่าน 55000
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right: Map Box */}
                  <div className="flex flex-col space-y-4">
                    <div className="relative flex-1 rounded-3xl overflow-hidden border border-stone-200/80 shadow-md group bg-stone-50 min-h-[300px]">
                      <Image
                        src="/images/actual_map.png"
                        alt="แผนที่ตั้งสวนครอบครัวเรา"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-w-768px) 100vw, 50vw"
                      />
                    </div>
                    <a
                      href="https://maps.app.goo.gl/Eh5N24ARtQuMo3NN7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none text-sm shadow-md cursor-pointer"
                    >
                      🗺️ เปิดแผนที่ใน Google Maps
                    </a>
                  </div>

                </div>

              </div>
            </section>
          )}

          {/* 6. Footer Section */}
          
        </div>
      )}

      {/* 6. Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-stone-100 flex flex-col h-full animate-in slide-in-from-right duration-300">

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-6 border-b border-stone-100">
                <h3 className="text-xl font-bold text-stone-900">
                  {checkoutStep === 1 ? 'ตะกร้าสินค้าของคุณ' : 'กรอกที่อยู่และการชำระเงิน'}
                </h3>
                <div className="flex items-center gap-2">
                  {checkoutStep === 2 && (
                    <button
                      onClick={() => setCheckoutStep(1)}
                      className="text-stone-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 bg-stone-100 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-all border border-stone-200"
                    >
                      ← แก้ไขตะกร้า
                    </button>
                  )}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-stone-400 hover:text-stone-600 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {totalItems === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-3">
                    <svg className="w-16 h-16 stroke-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="font-semibold text-lg">ไม่มีสินค้าในตะกร้า</p>
                  </div>
                ) : checkoutStep === 1 ? (
                  // Step 1: Select products and see subtotal
                  products
                    .filter((p) => cart[p.id] > 0)
                    .map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-4 rounded-2xl border border-stone-100 bg-stone-50/50">
                        {/* Checkbox for selecting items */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isItemSelected(product.id)}
                            onChange={() => toggleItemSelection(product.id)}
                            className="w-5 h-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </div>
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-stone-100 flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 truncate">{product.name}</h4>
                          <p className="text-sm text-stone-500 font-medium">{product.price} บาท/{product.unit}</p>
                          <p className="text-xs text-stone-400 font-semibold mt-0.5">คงเหลือ: {product.stock} {product.unit}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="bg-white border border-stone-200 text-stone-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs touch-manipulation"
                            >
                              -
                            </button>
                            <span className="font-bold text-stone-800 text-sm">{cart[product.id]} {product.unit}</span>
                            <button
                              onClick={() => addToCart(product.id)}
                              disabled={cart[product.id] >= product.stock}
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs touch-manipulation border ${cart[product.id] >= product.stock
                                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                                : 'bg-white border-stone-200 text-stone-600 hover:bg-emerald-600 hover:text-white'
                                }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-800">
                            {product.price * cart[product.id]} บาท
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  // Step 2: Fill address and payment details
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Selected Items Summary */}
                    <div className="p-4 rounded-2xl border border-stone-150 bg-stone-50/50 space-y-2">
                      <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">📦 รายการสินค้าที่เลือก</p>
                      <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto pr-1">
                        {products
                          .filter(p => cart[p.id] > 0 && isItemSelected(p.id))
                          .map(p => (
                            <div key={p.id} className="flex justify-between py-1.5 text-xs font-bold text-stone-800">
                              <span>{p.name} <span className="text-stone-400 font-medium ml-1">x {cart[p.id]} {p.unit}</span></span>
                              <span>{p.price * cart[p.id]} บาท</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Shipping Address Inputs */}
                    <div className="space-y-3 text-stone-800">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">📍 ที่อยู่จัดส่งสินค้า</label>
                        <textarea
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="กรุณากรอกที่อยู่ เช่น บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์..."
                          className="w-full p-3 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-600 bg-white font-bold text-stone-700"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">💳 ช่องทางการชำระเงิน</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full p-3 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-600 bg-white cursor-pointer font-bold text-stone-700"
                        >
                          <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (PromptPay) - แนะนำ</option>
                          <option value="โอนเงินผ่านธนาคาร">โอนเงินผ่านธนาคาร</option>
                        </select>
                      </div>

                      {/* Bank transfer / PromptPay Details */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-medium space-y-2">
                        {paymentMethod === 'พร้อมเพย์ (PromptPay)' ? (
                          <div className="flex flex-col items-center text-center space-y-2 py-1">
                            <p className="font-bold text-stone-900">โอนผ่านพร้อมเพย์ (PromptPay)</p>
                            <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex items-center justify-center">
                              <svg className="w-24 h-24 text-emerald-805 animate-in zoom-in-95 duration-200" viewBox="0 0 100 100" fill="currentColor">
                                <rect x="5" y="5" width="90" height="90" rx="10" fill="#f8fafc" stroke="#166534" strokeWidth="2" />
                                <rect x="20" y="20" width="10" height="10" fill="#0f172a" />
                                <rect x="20" y="70" width="10" height="10" fill="#0f172a" />
                                <rect x="70" y="20" width="10" height="10" fill="#0f172a" />
                                <rect x="40" y="20" width="5" height="15" fill="#0f172a" />
                                <rect x="50" y="25" width="10" height="5" fill="#0f172a" />
                                <rect x="45" y="45" width="10" height="10" fill="#0f172a" />
                                <rect x="20" y="45" width="15" height="5" fill="#0f172a" />
                                <rect x="70" y="45" width="10" height="15" fill="#0f172a" />
                                <rect x="40" y="65" width="20" height="15" fill="#0f172a" />
                                <rect x="30" y="10" width="40" height="4" rx="2" fill="#166534" />
                                <text x="50" y="90" textAnchor="middle" className="font-sans font-bold text-[8px] fill-[#166534]">PROMPTPAY QR</text>
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-stone-800">เบอร์โทรศัพท์: <span className="text-[#166534]">065-469-5103</span></p>
                              <p className="text-stone-500 text-[10px]">ชื่อบัญชี: สวนครอบครัว Maiv Zev (ยายมี)</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-center animate-in fade-in duration-200">
                            <p className="font-bold text-stone-900">โอนเงินผ่านบัญชีธนาคาร</p>
                            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-sm space-y-1">
                              <p className="font-bold text-stone-800">ธนาคารกสิกรไทย (KBANK)</p>
                              <p className="font-extrabold text-[#166534] text-sm">123-4-56789-0</p>
                              <p className="text-stone-500 text-[10px]">ชื่อบัญชี: นางมี รักสวนไทย (ยายมี)</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Slip Upload Zone */}
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">📸 แนบสลิปการโอนเงิน (จำเป็นต้องระบุ)</label>
                        {!slipPreview ? (
                          <div className="relative group border-2 border-dashed border-stone-200 hover:border-emerald-500 rounded-2xl p-4 bg-white hover:bg-emerald-50/10 transition-all flex flex-col items-center justify-center cursor-pointer text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSlipChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <svg className="w-8 h-8 text-stone-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs font-bold text-stone-700 mt-2">คลิกเพื่ออัปโหลดรูปสลิปการโอนเงิน</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">รองรับไฟล์รูปภาพ JPG, PNG</p>
                          </div>
                        ) : (
                          <div className="relative border border-stone-200 rounded-2xl p-2.5 bg-white space-y-2 animate-in zoom-in-95 duration-200">
                            <div className="relative aspect-[3/4] max-h-40 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center">
                              <img
                                src={slipPreview}
                                alt="สลิปการชำระเงินพรีวิว"
                                className="object-contain w-full h-full"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setSlipPreview(null)}
                              className="w-full text-center text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-xl transition-all border border-red-100"
                            >
                              🗑️ ลบรูปภาพสลิปนี้
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {totalItems > 0 && (
                <div className="border-t border-stone-100 px-6 py-6 space-y-4 bg-stone-50/50">
                  <div className="flex justify-between text-base font-bold text-stone-900">
                    <p>ราคารวมทั้งหมด</p>
                    <p className="text-xl text-emerald-800">{calculateTotalPrice()} บาท</p>
                  </div>

                  {checkoutStep === 1 ? (
                    <button
                      onClick={() => {
                        const selectedItems = products.filter(p => cart[p.id] > 0 && isItemSelected(p.id));
                        if (selectedItems.length === 0) {
                          alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนทำการสั่งซื้อครับ');
                          return;
                        }
                        setCheckoutStep(2);
                      }}
                      className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 focus:outline-none text-base"
                    >
                      ดำเนินการสั่งซื้อสินค้า →
                    </button>
                  ) : (
                    <button
                      disabled={isPlacingOrder}
                      onClick={async () => {
                        if (isPlacingOrder) return;

                        if (!shippingAddress.trim()) {
                          alert('กรุณากรอกที่อยู่จัดส่งสินค้าเพื่อทำการสั่งซื้อครับ');
                          return;
                        }
                        if (!slipPreview) {
                          alert('กรุณาแนบภาพสลิปหลักฐานการโอนเงินเพื่อชำระค่าสินค้าด้วยครับ');
                          return;
                        }
                        if (!currentUser?.email) {
                          alert('กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อครับ');
                          return;
                        }

                        const selectedItems = products.filter(p => cart[p.id] > 0 && isItemSelected(p.id));
                        if (selectedItems.length === 0) {
                          alert('ไม่มีสินค้าที่ถูกเลือกสำหรับคำสั่งซื้อนี้ครับ');
                          return;
                        }

                        // Check if any selected item exceeds available stock
                        const stockIssue = selectedItems.find(p => cart[p.id] > p.stock);
                        if (stockIssue) {
                          alert(`ขออภัยครับ สินค้า "${stockIssue.name}" มีคงเหลือในระบบเพียง ${stockIssue.stock} ${stockIssue.unit} แต่คุณสั่งซื้อ ${cart[stockIssue.id]} ${stockIssue.unit} กรุณาลดจำนวนสินค้าในตะกร้าลงก่อนสั่งซื้อครับ`);
                          return;
                        }

                        setIsPlacingOrder(true);
                        try {
                          const created = await createOrder({
                            email: currentUser.email,
                            totalPrice: calculateTotalPrice(),
                            paymentMethod: paymentMethod,
                            paymentStatus: 'รอตรวจสอบ',
                            orderStatus: 'รอดำเนินการ',
                            shippingAddress: shippingAddress.trim(),
                            slipUrl: slipPreview,
                            items: selectedItems.map(p => ({
                              productName: p.name,
                              quantity: cart[p.id],
                              price: p.price,
                            })),
                          });

                          // Create the new order for local display
                          const newOrder: Order = {
                            id: `ORD-${created.id.padStart(3, '0')}`,
                            username: currentUser?.username || 'สมาชิก',
                            phone: currentUser?.phone || '',
                            shippingAddress: shippingAddress.trim(),
                            items: selectedItems.map(p => ({
                              productName: p.name,
                              quantity: cart[p.id],
                              price: p.price,
                              unit: p.unit
                            })),
                            totalPrice: calculateTotalPrice(),
                            paymentMethod: paymentMethod,
                            paymentStatus: 'รอตรวจสอบ',
                            orderStatus: 'รอดำเนินการ',
                            createdAt: getLocalFormattedDate(),
                            slipUrl: slipPreview
                          };

                          // Deduct stock from products (already persisted server-side)
                          setProducts(prevProducts =>
                            prevProducts.map(p => {
                              const qty = cart[p.id] || 0;
                              if (qty > 0 && isItemSelected(p.id)) {
                                return { ...p, stock: Math.max(0, p.stock - qty) };
                              }
                              return p;
                            })
                          );

                          setOrders([newOrder, ...orders]);

                          // Remove only selected items from the cart
                          selectedItems.forEach(p => {
                            globalRemoveFromCart(p.name);
                          });

                          // Clear selection state for ordered items
                          setSelectedCartItems(prev => {
                            const nextSelected = { ...prev };
                            selectedItems.forEach(p => {
                              delete nextSelected[p.id];
                            });
                            return nextSelected;
                          });

                          setShippingAddress('');
                          setSlipPreview(null);
                          setIsCartOpen(false);
                          setCheckoutStep(1); // Reset step back to 1
                          alert(`🎉 สั่งซื้อสินค้าสำเร็จ!
รหัสคำสั่งซื้อของคุณคือ: ${newOrder.id}
(แอดมินได้รับการแจ้งเตือนสลิปโอนเงินของคุณแล้ว และกำลังทำการตรวจสอบความถูกต้องในระบบดูแลระบบครับ)`);
                        } catch (err) {
                          console.error('Error creating order:', err);
                          alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้งครับ');
                        } finally {
                          setIsPlacingOrder(false);
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 focus:outline-none text-base disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isPlacingOrder ? 'กำลังดำเนินการสั่งซื้อ...' : 'ยืนยันการสั่งซื้อสินค้า'}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 7. Member Order History Modal */}
      {isOrderHistoryOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-3">
              <div>
                <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <span>📦</span> ประวัติการสั่งซื้อของคุณ
                </h4>
                <p className="text-xs text-stone-500 font-medium">ตรวจสอบสถานะการชำระเงินและสถานะจัดส่งสินค้าของคุณ</p>
              </div>
              <button
                onClick={() => setIsOrderHistoryOpen(false)}
                className="text-stone-400 hover:text-stone-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {orders.filter(o => o.username === currentUser?.username).length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-semibold space-y-2">
                  <span className="text-4xl block">📭</span>
                  <p>คุณยังไม่มีประวัติการสั่งซื้อในขณะนี้</p>
                </div>
              ) : (
                orders
                  .filter(o => o.username === currentUser?.username)
                  .map((order) => (
                    <div key={order.id} className="p-5 rounded-2xl border border-stone-150 bg-stone-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-stone-150">
                        <div>
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">รหัสคำสั่งซื้อ</span>
                          <p className="font-extrabold text-stone-900 text-sm sm:text-base">{order.id}</p>
                          <span className="text-[10px] text-stone-500 font-semibold">สั่งเมื่อ: {order.createdAt}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${order.paymentStatus === 'ชำระเงินแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.paymentStatus === 'รอตรวจสอบ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            💳 {order.paymentStatus}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${order.orderStatus === 'ส่งสำเร็จ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.orderStatus === 'กำลังจัดส่ง' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              order.orderStatus === 'รอดำเนินการ' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            📦 {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs font-bold text-stone-800">
                            <span>
                              {item.productName}
                              <span className="text-stone-400 font-medium ml-1.5">x {item.quantity} {item.unit}</span>
                            </span>
                            <span>{item.price * item.quantity} บาท</span>
                          </div>
                        ))}
                      </div>

                      {/* Slip details for customer */}
                      {order.slipUrl && (
                        <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-150 animate-in fade-in duration-200">
                          <span className="text-stone-500 font-medium">สลิปหลักฐานการชำระเงิน:</span>
                          <button
                            onClick={() => setViewingSlipUrl(order.slipUrl || null)}
                            className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            🖼️ ดูสลิปที่แนบ
                          </button>
                        </div>
                      )}

                      {/* Total */}
                      <div className="pt-2 border-t border-dashed border-stone-200 flex justify-between items-center text-xs sm:text-sm font-bold">
                        <span className="text-stone-550 font-medium">รวมยอดสุทธิ</span>
                        <span className="text-emerald-800 font-extrabold text-sm sm:text-base">{order.totalPrice} บาท</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setIsOrderHistoryOpen(false)}
                className="bg-stone-900 hover:bg-stone-850 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.5. Admin Member Order History Modal */}
      {selectedMemberOrders && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-3">
              <div>
                <h4 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <span>👥</span> ประวัติการสั่งซื้อของ {selectedMemberOrders.username}
                </h4>
                <p className="text-xs text-stone-500 font-medium">
                  อีเมล: {selectedMemberOrders.email} | เบอร์โทรศัพท์: {selectedMemberOrders.phone || 'ไม่มีข้อมูล'}
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberOrders(null)}
                className="text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {orders.filter(o => o.username === selectedMemberOrders.username).length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-semibold space-y-2">
                  <span className="text-4xl block">📭</span>
                  <p>สมาชิกคนนี้ยังไม่มีประวัติการสั่งซื้อ</p>
                </div>
              ) : (
                orders
                  .filter(o => o.username === selectedMemberOrders.username)
                  .map((order) => (
                    <div key={order.id} className="p-5 rounded-2xl border border-stone-150 bg-stone-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-stone-150">
                        <div>
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">รหัสคำสั่งซื้อ</span>
                          <p className="font-extrabold text-stone-900 text-sm sm:text-base">{order.id}</p>
                          <span className="text-[10px] text-stone-500 font-semibold">สั่งเมื่อ: {order.createdAt}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${order.paymentStatus === 'ชำระเงินแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.paymentStatus === 'รอตรวจสอบ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            💳 {order.paymentStatus}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${order.orderStatus === 'ส่งสำเร็จ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.orderStatus === 'กำลังจัดส่ง' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              order.orderStatus === 'รอดำเนินการ' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            📦 {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs font-bold text-stone-800">
                            <span>
                              {item.productName}
                              <span className="text-stone-400 font-medium ml-1.5">x {item.quantity} {item.unit}</span>
                            </span>
                            <span>{item.price * item.quantity} บาท</span>
                          </div>
                        ))}
                      </div>

                      {/* Address and slip check */}
                      <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-150">
                        <div className="text-stone-500 font-semibold max-w-[70%] truncate">
                          ที่อยู่จัดส่ง: <span className="font-bold text-stone-700">{order.shippingAddress || 'ไม่ได้ระบุ'}</span>
                        </div>
                        {order.slipUrl && (
                          <button
                            onClick={() => setViewingSlipUrl(order.slipUrl || null)}
                            className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            🖼️ ดูสลิป
                          </button>
                        )}
                      </div>

                      {/* Total */}
                      <div className="pt-2 border-t border-dashed border-stone-200 flex justify-between items-center text-xs sm:text-sm font-bold">
                        <span className="text-stone-500 font-medium">รวมยอดสุทธิ</span>
                        <span className="text-emerald-800 font-extrabold text-sm sm:text-base">{order.totalPrice} บาท</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedMemberOrders(null)}
                className="bg-stone-900 hover:bg-stone-850 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full screen slip viewer */}
      {viewingSlipUrl && (
        <div
          onClick={() => setViewingSlipUrl(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-sm w-full max-h-[85vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingSlipUrl(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors focus:outline-none"
              title="ปิดหน้าต่าง"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white p-3 rounded-3xl shadow-2xl overflow-hidden border border-white/10 max-h-[75vh] flex items-center justify-center">
              <img
                src={viewingSlipUrl}
                alt="สลิปการโอนเงินฉบับเต็ม"
                className="object-contain max-h-[70vh] rounded-2xl"
              />
            </div>
            <p className="text-white/85 text-xs mt-3 font-semibold bg-stone-900/60 px-4 py-1.5 rounded-full backdrop-blur-sm">คลิกพื้นที่ว่างหรือกดปุ่ม X เพื่อปิด</p>
          </div>
        </div>
      )}

      {/* 8. Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-100 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="relative h-60 bg-stone-100 flex-shrink-0">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none text-sm font-bold animate-in fade-in z-50 cursor-pointer"
              >
                ✕
              </button>
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {selectedArticle.category}
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold leading-snug drop-shadow-md">
                  {selectedArticle.title}
                </h4>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-stone-700 leading-relaxed font-medium">
              <div className="flex items-center gap-3 text-xs text-stone-400 font-bold border-b border-stone-100 pb-3">
                <span>👤 เขียนโดย สวนครอบครัวเรา</span>
                <span>•</span>
                <span>📅 เผยแพร่เมื่อ {selectedArticle.date}</span>
              </div>
              <div className="text-sm font-medium space-y-4 whitespace-pre-line text-stone-800">
                {selectedArticle.content}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 bg-stone-50 border-t border-stone-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-6 py-2.5 rounded-full text-xs transition-colors shadow-sm cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Real Login and Registration Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-205">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200 flex flex-col relative max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                setLoginEmail('');
                setLoginPassword('');
                setSignupUsername('');
                setSignupEmail('');
                setSignupPassword('');
                setSignupPhone('');
                setSignupProfileImage('');
                setSignupProfilePreview(null);
                setForgotInput('');
                setForgotStep(1);
                setForgotFoundUser(null);
                setForgotOtpCode('');
                setUserEnteredOtp('');
                setNewPassword('');
                setConfirmNewPassword('');
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
              title="ปิด"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Tabs */}
            <div className="flex border-b border-stone-100 mb-6">
              <button
                onClick={() => setModalMode('login')}
                className={`w-1/2 pb-3 font-extrabold text-base transition-colors border-b-2 cursor-pointer ${modalMode === 'login'
                  ? 'border-[#166534] text-[#166534]'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => setModalMode('signup')}
                className={`w-1/2 pb-3 font-extrabold text-base transition-colors border-b-2 cursor-pointer ${modalMode === 'signup'
                  ? 'border-[#166534] text-[#166534]'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
              >
                สมัครสมาชิก
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {modalMode === 'forgot_password' ? (
                /* FORGOT PASSWORD FORM */
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-stone-900">ลืมรหัสผ่าน</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {forgotStep === 1 && 'กรอกอีเมลหรือเบอร์โทรศัพท์เพื่อค้นหาบัญชีผู้ใช้ของคุณ'}
                      {forgotStep === 2 && 'กรอกรหัสยืนยัน OTP ที่ส่งไปยังข้อมูลการติดต่อของคุณ'}
                      {forgotStep === 3 && 'ตั้งรหัสผ่านใหม่สำหรับบัญชีผู้ใช้ของคุณ'}
                    </p>
                  </div>

                  {forgotStep === 1 && (
                    /* STEP 1: Find Account & Send OTP */
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const target = forgotInput.trim().toLowerCase();
                      if (!target) {
                        alert('กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ครับ');
                        return;
                      }
                      const allUsers = await getUsers();
                      const found = allUsers.find(
                        u => u.email.toLowerCase() === target || (u.phone && u.phone.replace(/[-\s]/g, '') === target.replace(/[-\s]/g, ''))
                      );
                      if (!found) {
                        alert('ไม่พบข้อมูลบัญชีที่ตรงกับอีเมลหรือเบอร์โทรศัพท์นี้ในระบบสมาชิก กรุณาสมัครสมาชิกก่อนครับ');
                        return;
                      }

                      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                      setForgotOtpCode(generatedOtp);
                      setForgotFoundUser(found);
                      setUserEnteredOtp('');

                      // Send real email via Nodemailer & Gmail SMTP
                      if (found.email) {
                        sendOtpAction(found.email, generatedOtp).then(res => {
                          if (res.success) {
                            console.log('Real OTP email sent to:', found.email);
                          } else {
                            console.warn('Real OTP email error:', res.error);
                          }
                        });
                      }

                      const isEmail = target.includes('@');
                      alert(isEmail
                        ? `📧 ระบบได้ส่งรหัสยืนยัน OTP ไปยังอีเมล ${found.email} เรียบร้อยแล้วครับ! กรุณาเช็กกล่องข้อความในอีเมลเพื่อนำรหัสมากรอกยืนยัน`
                        : '📱 ระบบได้ส่งรหัสยืนยัน OTP ไปที่เบอร์โทรศัพท์ของคุณแล้วครับ'
                      );

                      setForgotStep(2);
                    }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">อีเมล หรือ เบอร์โทรศัพท์</label>
                        <input
                          type="text"
                          required
                          value={forgotInput}
                          onChange={(e) => setForgotInput(e.target.value)}
                          placeholder="กรอกอีเมลหรือเบอร์โทรศัพท์ของคุณ"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer"
                      >
                        ถัดไป (ส่งรหัส OTP)
                      </button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => setModalMode('login')}
                          className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer"
                        >
                          ย้อนกลับไปหน้าเข้าสู่ระบบ
                        </button>
                      </div>
                    </form>
                  )}

                  {forgotStep === 2 && (
                    /* STEP 2: Verify OTP */
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (userEnteredOtp.trim() === forgotOtpCode) {
                        setForgotStep(3);
                      } else {
                        alert('รหัส OTP ไม่ถูกต้อง กรุณากรอกรหัสใหม่อีกครั้งครับ (มีป๊อปอัพบอกรหัสที่มุมขวาบนของจอครับ)');
                      }
                    }} className="space-y-4">
                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 mb-2 text-center text-xs text-stone-600 font-semibold">
                        <span className="text-stone-800">ส่งรหัสยืนยันไปยังช่องทาง:</span>{' '}
                        <span className="text-emerald-800 font-extrabold">
                          {forgotInput.includes('@') ? '📧 ' + forgotFoundUser?.email : '📱 ' + forgotFoundUser?.phone}
                        </span>
                        <p className="mt-1 text-[10px] text-stone-400 font-medium">(มีป๊อปอัพแจ้งเตือนจำลองรหัสส่งไปที่มุมขวาบนของเว็บแล้วครับ)</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">กรอกรหัสยืนยัน OTP (6 หลัก)</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          pattern="\d{6}"
                          value={userEnteredOtp}
                          onChange={(e) => setUserEnteredOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="กรอกรหัสตัวเลข 6 หลัก เช่น 123456"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850 text-center tracking-widest text-lg"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer"
                      >
                        ยืนยันรหัส OTP
                      </button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setForgotStep(1);
                            setForgotFoundUser(null);
                            setForgotOtpCode('');
                            setUserEnteredOtp('');
                          }}
                          className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer"
                        >
                          ย้อนกลับไปขั้นตอนแรก
                        </button>
                      </div>
                    </form>
                  )}

                  {forgotStep === 3 && (
                    /* STEP 3: Enter New Password */
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (newPassword.length < 4) {
                        alert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษรครับ');
                        return;
                      }
                      if (newPassword !== confirmNewPassword) {
                        alert('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้งครับ');
                        return;
                      }
                      if (forgotFoundUser) {
                        await updateUser(forgotFoundUser.email, { password: newPassword });

                        if (currentUser && currentUser.email.toLowerCase() === forgotFoundUser.email.toLowerCase()) {
                          setCurrentUser({ ...currentUser, password: newPassword });
                        }

                        alert('เปลี่ยนรหัสผ่านสำเร็จแล้วครับ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
                        setModalMode('login');
                        setForgotStep(1);
                        setForgotInput('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setForgotFoundUser(null);
                        setForgotOtpCode('');
                        setUserEnteredOtp('');
                      }
                    }} className="space-y-4">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 mb-2">
                        <p className="text-xs font-bold text-stone-750">ยืนยันตัวตนสำเร็จ บัญชีผู้ใช้ของคุณคือ:</p>
                        <p className="text-sm font-semibold text-emerald-850 mt-1">
                          👤 {forgotFoundUser?.username} ({forgotFoundUser?.email})
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รหัสผ่านใหม่</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="กรอกรหัสผ่านใหม่"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ยืนยันรหัสผ่านใหม่</label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer"
                      >
                        ยืนยันการเปลี่ยนรหัสผ่าน
                      </button>

                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setForgotStep(2);
                            setNewPassword('');
                            setConfirmNewPassword('');
                          }}
                          className="text-xs font-bold text-stone-500 hover:text-stone-700 hover:underline cursor-pointer"
                        >
                          ย้อนกลับไปขั้นตอนการกรอก OTP
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : modalMode === 'login' ? (
                /* LOGIN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-stone-900">ยินดีต้อนรับสู่สวน Maiv Zev</h3>
                    <p className="text-xs text-stone-500 mt-1">กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบของคุณ</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">อีเมลผู้ใช้งาน</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="เช่น customer@example.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-stone-500 uppercase">รหัสผ่าน</label>
                      <button
                        type="button"
                        onClick={() => {
                          setModalMode('forgot_password');
                          setForgotStep(1);
                          setForgotInput('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                          setForgotFoundUser(null);
                        }}
                        className="text-xs font-bold text-[#166534] hover:underline cursor-pointer"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer"
                  >
                    เข้าสู่ระบบ
                  </button>
                </form>
              ) : (
                /* SIGNUP FORM */
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-stone-900">สร้างบัญชีผู้ใช้ใหม่</h3>
                    <p className="text-xs text-stone-500 mt-1">กรอกรายละเอียดเพื่อสมัครสมาชิกเพื่อเริ่มสั่งซื้อสินค้า</p>
                  </div>

                  {/* Profile Picture Upload Section */}
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase self-start">รูปโปรไฟล์ของคุณ (เลือกอัปโหลดไฟล์)</label>
                    <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-stone-200 hover:border-emerald-500 bg-stone-50 shadow-sm flex items-center justify-center cursor-pointer transition-all">
                      {signupProfilePreview ? (
                        <img src={signupProfilePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[9px] font-bold mt-1 text-stone-500">อัปรูปภาพ</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    {signupProfilePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setSignupProfileImage('');
                          setSignupProfilePreview(null);
                        }}
                        className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        ลบรูปโปรไฟล์
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">ชื่อผู้ใช้งาน (ชื่อเต็ม)</label>
                    <input
                      type="text"
                      required
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="เช่น สมชาย สมาชิกพรีเมียม"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">อีเมลผู้ใช้งาน</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="เช่น somchai@example.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">รหัสผ่าน</label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="ตั้งรหัสผ่านของคุณ"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">เบอร์โทรศัพท์ (จำเป็น)</label>
                    <input
                      type="tel"
                      required
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="เช่น 089-123-4567"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer"
                  >
                    สมัครสมาชิกและเข้าสู่ระบบ
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mock SMS/Email Notification Banner removed */}

      {/* 8. Product Details & Reviews Modal */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-stone-100 flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedProductDetail(null);
                setReviewRating(5);
                setReviewComment('');
                setReviewMediaUrl('');
                setReviewMediaType('none');
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-all focus:outline-none cursor-pointer z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Column: Image and Shopping Action */}
            <div className="w-full md:w-1/2 flex flex-col gap-5">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-stone-100 bg-stone-50">
                <img
                  src={selectedProductDetail.image}
                  alt={selectedProductDetail.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {selectedProductDetail.category}
                </span>
              </div>

              {/* Shopping Quick Action */}
              <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-stone-450">ราคาจำหน่าย</p>
                  <p className="text-xl font-extrabold text-emerald-800">
                    {selectedProductDetail.price} <span className="text-xs font-medium text-stone-500">บาท/{selectedProductDetail.unit}</span>
                  </p>
                </div>
                <div className="flex-1 max-w-[200px]">
                  {(() => {
                    const qty = cart[selectedProductDetail.id] || 0;
                    return (
                      <div>
                        {qty > 0 ? (
                          <div className="flex items-center justify-between bg-white rounded-full p-1 border border-stone-200">
                            <button
                              onClick={() => removeFromCart(selectedProductDetail.id)}
                              className="bg-stone-100 text-stone-800 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-stone-200 transition-colors"
                            >
                              -
                            </button>
                            <span className="font-bold text-stone-900 text-sm">{qty} {selectedProductDetail.unit}</span>
                            <button
                              onClick={() => addToCart(selectedProductDetail.id)}
                              disabled={qty >= selectedProductDetail.stock}
                              className="bg-stone-100 text-stone-850 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(selectedProductDetail.id)}
                            disabled={selectedProductDetail.stock <= 0}
                            className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-full text-xs shadow-sm transition-colors cursor-pointer disabled:bg-stone-200 disabled:text-stone-400"
                          >
                            {selectedProductDetail.stock > 0 ? '🛒 เพิ่มในตะกร้า' : 'สินค้าหมด'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column: Info, Benefits, and Reviews */}
            <div className="w-full md:w-1/2 flex flex-col gap-6 max-h-[80vh] md:max-h-full overflow-y-auto pr-1">
              <div>
                <h3 className="text-2xl font-extrabold text-stone-900">{selectedProductDetail.name}</h3>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold">
                  {(() => {
                    const { avg, count } = getProductRatingStats(selectedProductDetail.id);
                    const salesCount = getProductSalesCount(selectedProductDetail.name);
                    return (
                      <>
                        {count > 0 ? (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <span className="text-sm">★</span>
                            <span className="font-bold">{avg}</span>
                            <span className="text-stone-400">({count} รีวิว)</span>
                          </div>
                        ) : (
                          <span className="text-stone-400">ยังไม่มีรีวิว</span>
                        )}
                        <span className="text-stone-300">|</span>
                        <span className="text-purple-700">🔥 ขายแล้ว {salesCount} ครั้ง</span>
                        <span className="text-stone-300">|</span>
                        <span className="text-stone-500">คงเหลือ {selectedProductDetail.stock} {selectedProductDetail.unit}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-5 space-y-2">
                <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                  🌿 รายละเอียด & สรรพคุณสินค้า
                </h4>
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  {getProductBenefits(selectedProductDetail)}
                </p>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
                  <span>💬</span> รีวิวจากผู้สั่งซื้อ ({reviews.filter(r => r.productId === selectedProductDetail.id).length})
                </h4>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {reviews.filter(r => r.productId === selectedProductDetail.id).length === 0 ? (
                    <p className="text-xs text-stone-400 py-4 text-center font-medium">ยังไม่มีรีวิวสำหรับสินค้านี้ มารีวิวคนแรกกันเลย!</p>
                  ) : (
                    reviews
                      .filter(r => r.productId === selectedProductDetail.id)
                      .map((review) => (
                        <div key={review.id} className="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                            <div className="flex items-center gap-2">
                              {review.userProfileImage ? (
                                <img src={review.userProfileImage} alt={review.username} className="w-5 h-5 rounded-full object-cover border border-stone-200" />
                              ) : (
                                <span>👤</span>
                              )}
                              <span className="text-stone-700 font-bold">{review.username}</span>
                            </div>
                            <span>{review.createdAt}</span>
                          </div>
                          {/* Stars */}
                          <div className="flex text-amber-400 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                          <p className="text-xs font-semibold text-stone-800 leading-relaxed">
                            {review.comment}
                          </p>
                          {/* Media (Image or Video) */}
                          {review.mediaUrl && (
                            <div className="mt-2 max-w-[150px] rounded-lg overflow-hidden border border-stone-200">
                              {review.mediaType === 'video' ? (
                                <video src={review.mediaUrl} controls className="w-full max-h-[120px] object-cover" />
                              ) : (
                                <img src={review.mediaUrl} alt="Review attachment" className="w-full max-h-[120px] object-cover" />
                              )}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Write Review Form */}
              <div className="border-t border-stone-100 pt-4 space-y-4">
                <h4 className="text-sm font-extrabold text-stone-900">✍️ เขียนรีวิวสินค้า</h4>
                {(() => {
                  const eligible = canUserReviewProduct(selectedProductDetail.id);
                  if (!currentUser) {
                    return (
                      <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold text-center">
                        🔒 กรุณาเข้าสู่ระบบเพื่อเขียนรีวิวสินค้า
                      </div>
                    );
                  }
                  if (!eligible) {
                    return (
                      <div className="p-4 rounded-xl bg-stone-50 text-stone-500 border border-stone-200 text-xs font-medium leading-relaxed">
                        ⚠️ ขออภัยครับ เฉพาะผู้สั่งซื้อสินค้าชิ้นนี้และได้รับสินค้าสำเร็จเรียบร้อยแล้วเท่านั้นที่สามารถรีวิวสินค้าและให้คะแนนดาวได้ครับ
                      </div>
                    );
                  }
                  return (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!reviewComment.trim()) {
                          alert('กรุณากรอกความคิดเห็นสำหรับรีวิวสินค้าครับ');
                          return;
                        }
                        try {
                          await createReview({
                            email: currentUser.email,
                            productId: selectedProductDetail.id,
                            rating: reviewRating,
                            comment: reviewComment.trim(),
                            mediaUrl: reviewMediaUrl || undefined,
                            mediaType: reviewMediaType,
                          });
                          const updated = await getReviews();
                          setReviews(updated as ProductReview[]);
                          setReviewComment('');
                          setReviewRating(5);
                          setReviewMediaUrl('');
                          setReviewMediaType('none');
                          alert('บันทึกรีวิวของคุณลงในระบบเรียบร้อยแล้วครับ ขอบคุณสำหรับความคิดเห็นครับ!');
                        } catch (err) {
                          console.error('Error submitting review:', err);
                          alert('เกิดข้อผิดพลาดในการบันทึกรีวิว กรุณาลองใหม่อีกครั้งครับ');
                        }
                      }}
                      className="space-y-3"
                    >
                      {/* Rating selection */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-500">คะแนนดาว:</span>
                        <div className="flex gap-1 text-lg">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`focus:outline-none transition-all cursor-pointer ${star <= reviewRating ? 'text-amber-400' : 'text-stone-300'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment input */}
                      <div>
                        <textarea
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="แบ่งปันความคิดเห็นเกี่ยวกับรสชาติหรือคุณภาพของสินค้า..."
                          className="w-full text-xs font-semibold text-stone-850 bg-stone-50 border border-stone-200 rounded-xl p-3 h-20 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* File upload */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-stone-400 uppercase">อัปโหลดรูปภาพหรือวิดีโอประกอบรีวิว</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 20 * 1024 * 1024) {
                                  alert('ขนาดไฟล์ใหญ่เกินไปครับ (สูงสุดไม่เกิน 20MB)');
                                  return;
                                }
                                const isVideo = file.type.startsWith('video/');
                                try {
                                  const uploadPayload = isVideo ? file : await compressImage(file);
                                  const formData = new FormData();
                                  formData.append('file', uploadPayload);
                                  const { url } = await uploadFile(formData);
                                  setReviewMediaUrl(url);
                                  setReviewMediaType(isVideo ? 'video' : 'image');
                                } catch (err) {
                                  console.error('Error uploading review media:', err);
                                  alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์ครับ');
                                }
                              }
                            }}
                            className="text-xs text-stone-500 font-semibold file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                          />
                        </div>
                        {reviewMediaUrl && (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-200 mt-2 bg-stone-100">
                            {reviewMediaType === 'video' ? (
                              <video src={reviewMediaUrl} className="w-full h-full object-cover" />
                            ) : (
                              <img src={reviewMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setReviewMediaUrl('');
                                setReviewMediaType('none');
                              }}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-black"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        ส่งความคิดเห็น
                      </button>
                    </form>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Chatbot Assistant Widget */}
      {currentUser?.role !== 'Admin' && (
        <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
          {/* Chat Window */}
          {isChatOpen && (
            <div className="w-[360px] sm:w-[380px] h-[520px] bg-white rounded-[32px] shadow-2xl border border-stone-100 flex flex-col overflow-hidden mb-4 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-[#166534] text-white p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border border-white/20">
                    <span className="text-xl">👵</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm tracking-wide"> Maiv Zev</h4>
                    <p className="text-[10px] text-emerald-200 font-light flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                      ออนไลน์
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white transition-colors focus:outline-none p-1 bg-white/10 rounded-full cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafaf8]">
                {activeThread.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                    <div className="flex items-end gap-1.5 max-w-[85%]">
                      {msg.sender !== 'user' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {msg.sender === 'admin' ? '👤' : '👵'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        {msg.sender === 'admin' && (
                          <span className="text-[9px] font-bold text-[#166534] mb-0.5 ml-1">
                            ผู้ดูแลสวน (แอดมิน)
                          </span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold leading-relaxed whitespace-pre-line ${msg.sender === 'user'
                          ? 'bg-[#7e22ce] text-white rounded-br-none shadow-sm'
                          : msg.sender === 'admin'
                            ? 'bg-emerald-55 text-stone-850 border border-emerald-200 rounded-bl-none shadow-sm font-extrabold'
                            : 'bg-white text-stone-850 border border-stone-150 rounded-bl-none shadow-sm font-bold'
                          }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[9px] text-stone-400 font-semibold mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Bot typing simulation */}
                {isBotTyping && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        👵
                      </div>
                      <div className="bg-white border border-stone-150 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-150"></span>
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-300"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions Chips */}
              <div className="p-3 bg-white border-t border-stone-100 flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto">
                {!currentUser ? (
                  <>
                    <button
                      onClick={() => handleSendChatMessage('🔑 วิธีเข้าสู่ระบบ / สมัครสมาชิก')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      🔑 วิธีเข้าสู่ระบบ / สมัครสมาชิก
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('🍇 สอบถามข้อมูลสินค้าของสวน')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      🍇 สอบถามข้อมูลสินค้าของสวน
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('📞 ติดต่อแอดมินสวนโดยตรง')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      📞 ติดต่อแอดมินสวนโดยตรง
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendChatMessage('🔥 สอบถามสินค้าขายดี')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      🔥 สอบถามสินค้าขายดี
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('💰 สอบถามราคาของสินค้า')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      💰 สอบถามราคาของสินค้า
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('🚚 วิธีการจัดส่งและชำระเงิน')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      🚚 วิธีการจัดส่งและชำระเงิน
                    </button>
                    <button
                      onClick={() => handleSendChatMessage('📞 ติดต่อแอดมินสวนโดยตรง')}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#166534] font-bold px-2.5 py-1.5 rounded-full border border-emerald-150 transition-all cursor-pointer"
                    >
                      📞 ติดต่อแอดมินสวนโดยตรง
                    </button>
                  </>
                )}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="p-3 bg-white border-t border-stone-100 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="พิมพ์ข้อความคุยกับสวน..."
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-600 font-semibold text-stone-850"
                />
                <button
                  type="submit"
                  className="bg-[#166534] hover:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  ส่ง
                </button>
              </form>
            </div>
          )}

          {/* Floating Bubble Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-14 h-14 bg-[#166534] hover:bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 duration-200 focus:outline-none cursor-pointer relative"
            title="คุยกับแอดมินสวน"
          >
            <span className="text-2xl">💬</span>
            {!isChatOpen && activeThread.messages.length === 1 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-yellow-400 border-2 border-[#166534] rounded-full animate-ping"></span>
            )}
          </button>
        </div>
      )}

      {/* Custom Alert Modal */}

      {customAlert && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-stone-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {customAlert.type === 'success' ? (
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100 shadow-sm animate-bounce">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4 border border-amber-100 shadow-sm animate-bounce">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-extrabold text-stone-900 mb-2">
              {customAlert.title || (customAlert.type === 'success' ? 'สำเร็จ' : 'แจ้งเตือน')}
            </h3>
            <p className="text-xs font-semibold text-stone-600 leading-relaxed mb-6 whitespace-pre-line font-sans">
              {customAlert.message}
            </p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full bg-[#166534] hover:bg-emerald-800 text-white font-extrabold py-3 rounded-full transition-colors shadow-md text-xs cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
