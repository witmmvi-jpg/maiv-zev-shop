-- 1. Create Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Member', 'User')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Products Table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    benefits TEXT, -- added product benefits
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Orders Table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Order Details Table
CREATE TABLE order_details (
    detail_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

-- 5. Create Product Reviews Table
CREATE TABLE product_reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    media_url TEXT,
    media_type VARCHAR(10) CHECK (media_type IN ('image', 'video', 'none')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (Optional) Insert some initial seed data for family business
INSERT INTO users (username, email, password, phone, role) VALUES
('grandma_garden', 'admin@example.com', 'hashed_password_admin_123', '0812345678', 'Admin'),
('somchai_member', 'somchai@example.com', 'hashed_password_member_123', '0898765432', 'Member'),
('general_user', 'user@example.com', 'hashed_password_user_123', '0855555555', 'User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (product_name, description, benefits, price, stock, image_url) VALUES
('องุ่นไร้เมล็ด', 'องุ่นดำไร้เมล็ด หวานกรอบ สดใหม่จากสวนคุณยาย', 'มีสารต้านอนุมูลอิสระสูง เช่น เรสเวอราทรอล (Resveratrol) ช่วยบำรุงสายตา บำรุงผิวพรรณ ช่วยลดคอเลสเตอรอล และเสริมสร้างการทำงานของระบบสมองและหัวใจได้อย่างมีประสิทธิภาพ รสชาติหวานกรอบ อร่อยทานง่ายไร้เมล็ด', 120.00, 50, '/images/black_grapes.png'),
('องุ่นแดง', 'องุ่นแดงหวานกรอบ รสชาติดี มีประโยชน์', 'อุดมไปด้วยวิตามินซีและสารฟลาโวนอยด์ ช่วยสร้างภูมิคุ้มกันร่างกาย ป้องกันการเกิดริ้วรอยก่อนวัย ชะลอความเสื่อมของเซลล์ บำรุงระบบหมุนเวียนโลหิต และช่วยลดความดันโลหิตสูง', 100.00, 30, '/images/red_grapes.png'),
('ข้าวหอมมะลิ', 'ข้าวหอมมะลิแท้ 100% หอม นุ่ม เมล็ดเรียงสวย ปลูกวิถีธรรมชาติ', 'คัดจากทุ่งกว้างวิถีธรรมชาติ ข้าวเมล็ดยาวเรียวสวย หอม นุ่ม ละมุนลิ้น อุดมไปด้วยวิตามินบี 1 บี 2 ป้องกันโรคเหน็บชา บำรุงสมองและประสาท ให้พลังงานที่สะอาดและดีต่อระบบขับถ่าย', 40.00, 100, '/images/jasmine_rice.png'),
('ข้าวเหนียว', 'ข้าวเหนียวเขี้ยวงู เมล็ดขาว นุ่ม เหนียวอร่อย เคี้ยวมัน', 'คัดพิเศษ เมล็ดขาวนุ่ม อิ่มท้องนาน ให้พลังงานสูง เหมาะสำหรับเป็นแหล่งพลังงานของผู้ใช้แรงงานและนักกีฬา มีวิตามินอีบำรุงผิวพรรณ ช่วยเพิ่มการเจริญอาหาร และช่วยซ่อมแซมกล้ามเนื้อ', 45.00, 80, '/images/sticky_rice.png')
ON CONFLICT DO NOTHING;
