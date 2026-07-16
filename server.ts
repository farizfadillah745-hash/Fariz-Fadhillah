import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, Store, Product, Queue, Order, Review, SystemStats,
  UserRole, StoreStatus, ProductCategory, QueueStatus, OrderStatus 
} from "./src/types.js";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

// Helper function to read/write JSON database
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = getInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, resetting to seed data:", err);
    const initialData = getInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getInitialSeedData() {
  const users: User[] = [
    { id: "admin-1", name: "Super Admin", email: "admin@fashcollab.com", role: "admin", isEmailVerified: true },
    { id: "owner-zara", name: "Zara Manager", email: "zara@fashcollab.com", role: "store_owner", isEmailVerified: true, storeId: "store-zara" },
    { id: "owner-hm", name: "H&M Manager", email: "hm@fashcollab.com", role: "store_owner", isEmailVerified: true, storeId: "store-hm" },
    { id: "owner-uniqlo", name: "Uniqlo Manager", email: "uniqlo@fashcollab.com", role: "store_owner", isEmailVerified: true, storeId: "store-uniqlo" },
    { id: "owner-adidas", name: "Adidas Manager", email: "adidas@fashcollab.com", role: "store_owner", isEmailVerified: true, storeId: "store-adidas" },
    { id: "owner-elizabeth", name: "Elizabeth Manager", email: "elizabeth@fashcollab.com", role: "store_owner", isEmailVerified: true, storeId: "store-elizabeth" },
    { id: "owner-button", name: "Buttonscarves Manager", email: "buttonscarves@fashcollab.com", role: "store_owner", isEmailVerified: true, storeId: "store-button" },
    { id: "cust-fariz", name: "Fariz Fadillah", email: "farizfadillah745@gmail.com", role: "customer", isEmailVerified: true },
    { id: "cust-budi", name: "Budi Santoso", email: "budi@gmail.com", role: "customer", isEmailVerified: true },
    { id: "cust-ani", name: "Ani Wijaya", email: "ani@gmail.com", role: "customer", isEmailVerified: true }
  ];

  // User credentials (plain text or simple hash)
  const credentials = {
    "admin@fashcollab.com": "admin123",
    "zara@fashcollab.com": "zara123",
    "hm@fashcollab.com": "hm123",
    "uniqlo@fashcollab.com": "uniqlo123",
    "adidas@fashcollab.com": "adidas123",
    "elizabeth@fashcollab.com": "elizabeth123",
    "buttonscarves@fashcollab.com": "button123",
    "farizfadillah745@gmail.com": "password123",
    "budi@gmail.com": "password123",
    "ani@gmail.com": "password123"
  };

  const stores: Store[] = [
    {
      id: "store-zara",
      name: "Zara Grand Indonesia",
      ownerId: "owner-zara",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      address: "Grand Indonesia Mall, East Mall, Lantai G, Jl. M.H. Thamrin No.1",
      category: "all",
      status: "approved",
      description: "Merek fashion global Spanyol terkemuka yang menawarkan tren pakaian, sepatu, dan aksesoris terkini untuk pria, wanita, dan anak-anak.",
      logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 10,
      avgServiceTimeMinutes: 15,
      currentQueueCount: 3,
      rating: 4.8,
      reviewCount: 24,
      latitude: -6.1951,
      longitude: 106.8208,
      openingHours: {
        monday: "10:00-22:00",
        tuesday: "10:00-22:00",
        wednesday: "10:00-22:00",
        thursday: "10:00-22:00",
        friday: "10:00-22:00",
        saturday: "10:00-22:00",
        sunday: "10:00-22:00"
      },
      isOpen: true
    },
    {
      id: "store-hm",
      name: "H&M Paris Van Java",
      ownerId: "owner-hm",
      city: "Bandung",
      province: "Jawa Barat",
      address: "Paris Van Java Mall, Resort Level, Jl. Sukajadi No.131-139",
      category: "baju",
      status: "approved",
      description: "Fashion & kualitas dengan harga terbaik dengan cara yang berkelanjutan. Menawarkan koleksi pakaian kasual, formal, dan olahraga yang bervariasi.",
      logo: "https://images.unsplash.com/photo-1524282745852-a463fa495977?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 15,
      avgServiceTimeMinutes: 12,
      currentQueueCount: 1,
      rating: 4.5,
      reviewCount: 18,
      latitude: -6.8893,
      longitude: 107.5959,
      openingHours: {
        monday: "10:00-21:30",
        tuesday: "10:00-21:30",
        wednesday: "10:00-21:30",
        thursday: "10:00-21:30",
        friday: "10:00-22:00",
        saturday: "10:00-22:00",
        sunday: "10:00-21:30"
      },
      isOpen: true
    },
    {
      id: "store-uniqlo",
      name: "Uniqlo Tunjungan Plaza",
      ownerId: "owner-uniqlo",
      city: "Surabaya",
      province: "Jawa Timur",
      address: "Tunjungan Plaza 6, Lantai 2, Jl. Embong Malang No.32-36",
      category: "all",
      status: "approved",
      description: "Pakaian LifeWear kasual Jepang berkualitas tinggi, sangat fungsional, dan esensial untuk kenyamanan aktivitas sehari-hari.",
      logo: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 20,
      avgServiceTimeMinutes: 10,
      currentQueueCount: 0,
      rating: 4.9,
      reviewCount: 42,
      latitude: -7.2625,
      longitude: 112.7383,
      openingHours: {
        monday: "10:00-22:00",
        tuesday: "10:00-22:00",
        wednesday: "10:00-22:00",
        thursday: "10:00-22:00",
        friday: "10:00-22:00",
        saturday: "10:00-22:00",
        sunday: "10:00-22:00"
      },
      isOpen: true
    },
    {
      id: "store-adidas",
      name: "Adidas Sun Plaza",
      ownerId: "owner-adidas",
      city: "Medan",
      province: "Sumatera Utara",
      address: "Sun Plaza Mall, Lantai 1, Jl. H. Zainul Arifin No.7",
      category: "sepatu",
      status: "approved",
      description: "Outlet olahraga dan gaya hidup global. Menjual sepatu running, pakaian olahraga, jersey, dan aksesoris orisinal dengan teknologi mutakhir.",
      logo: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 8,
      avgServiceTimeMinutes: 20,
      currentQueueCount: 0,
      rating: 4.7,
      reviewCount: 12,
      latitude: 3.5852,
      longitude: 98.6716,
      openingHours: {
        monday: "10:00-21:00",
        tuesday: "10:00-21:00",
        wednesday: "10:00-21:00",
        thursday: "10:00-21:00",
        friday: "10:00-22:00",
        saturday: "09:00-22:00",
        sunday: "09:00-21:00"
      },
      isOpen: true
    },
    {
      id: "store-elizabeth",
      name: "Elizabeth Beachwalk",
      ownerId: "owner-elizabeth",
      city: "Badung (Kuta)",
      province: "Bali",
      address: "Beachwalk Shopping Center, Lantai 2, Jl. Pantai Kuta",
      category: "aksesori",
      status: "approved",
      description: "Merek lokal kebanggaan Indonesia sejak 1963. Terkenal dengan tas wanita, clutch, aksesoris, sepatu, dan pakaian formal berkualitas tinggi.",
      logo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 12,
      avgServiceTimeMinutes: 15,
      currentQueueCount: 0,
      rating: 4.6,
      reviewCount: 15,
      latitude: -8.7185,
      longitude: 115.1685,
      openingHours: {
        monday: "10:00-22:00",
        tuesday: "10:00-22:00",
        wednesday: "10:00-22:00",
        thursday: "10:00-22:00",
        friday: "10:00-23:00",
        saturday: "10:00-23:00",
        sunday: "10:00-22:00"
      },
      isOpen: true
    },
    {
      id: "store-button",
      name: "Buttonscarves Trans Studio",
      ownerId: "owner-button",
      city: "Makassar",
      province: "Sulawesi Selatan",
      address: "Trans Studio Mall, Ground Floor, Jl. Metro Tanjung Bunga",
      category: "aksesori",
      status: "pending",
      description: "Merek fashion mewah Indonesia yang mengkhususkan diri pada hijab scarf berkualitas premium, tas, bros, parfum, dan aksesoris elegan.",
      logo: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 10,
      avgServiceTimeMinutes: 15,
      currentQueueCount: 0,
      rating: 0,
      reviewCount: 0,
      latitude: -5.1581,
      longitude: 119.3970,
      openingHours: {
        monday: "10:00-22:00",
        tuesday: "10:00-22:00",
        wednesday: "10:00-22:00",
        thursday: "10:00-22:00",
        friday: "10:00-22:00",
        saturday: "10:00-22:00",
        sunday: "10:00-22:00"
      },
      isOpen: true
    }
  ];

  const products: Product[] = [
    // Zara Products
    { id: "prod-zara-1", storeId: "store-zara", name: "Premium Wool Classic Blazer", category: "baju", price: 1499000, stock: 15, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80", barcode: "8991234567012" },
    { id: "prod-zara-2", storeId: "store-zara", name: "Slim Fit Stretch Chinos", category: "baju", price: 699000, stock: 25, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80", barcode: "8991234567029" },
    { id: "prod-zara-3", storeId: "store-zara", name: "Genuine Leather Derby Shoes", category: "sepatu", price: 1899000, stock: 8, image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&q=80", barcode: "8991234567036" },
    { id: "prod-zara-4", storeId: "store-zara", name: "Minimalist Buckle Leather Belt", category: "aksesori", price: 399000, stock: 40, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80", barcode: "8991234567043" },

    // H&M Products
    { id: "prod-hm-1", storeId: "store-hm", name: "Heavyweight Oversized Hoodie", category: "baju", price: 449000, stock: 30, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80", barcode: "8992234567011" },
    { id: "prod-hm-2", storeId: "store-hm", name: "Relaxed Fit Denim Jeans", category: "baju", price: 549000, stock: 20, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80", barcode: "8992234567028" },
    { id: "prod-hm-3", storeId: "store-hm", name: "Canvas High-Top Unisex Sneakers", category: "sepatu", price: 349000, stock: 15, image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80", barcode: "8992234567035" },

    // Uniqlo Products
    { id: "prod-uni-1", storeId: "store-uniqlo", name: "Airism Cotton Oversized T-Shirt", category: "baju", price: 199000, stock: 120, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80", barcode: "8993234567010" },
    { id: "prod-uni-2", storeId: "store-uniqlo", name: "Ultra Light Down Premium Jacket", category: "baju", price: 1099000, stock: 18, image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500&q=80", barcode: "8993234567027" },
    { id: "prod-uni-3", storeId: "store-uniqlo", name: "Airism Comfort Socks 3-Pack", category: "aksesori", price: 149000, stock: 80, image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=500&q=80", barcode: "8993234567034" },

    // Adidas Products
    { id: "prod-adi-1", storeId: "store-adidas", name: "Ultraboost Light Running Shoes", category: "sepatu", price: 3300000, stock: 12, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80", barcode: "8994234567019" },
    { id: "prod-adi-2", storeId: "store-adidas", name: "Stan Smith Classic Sneakers", category: "sepatu", price: 1700000, stock: 22, image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&q=80", barcode: "8994234567026" },

    // Elizabeth Products
    { id: "prod-elz-1", storeId: "store-elizabeth", name: "Saffiano Premium Leather Tote Bag", category: "aksesori", price: 499000, stock: 10, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80", barcode: "8995234567018" },
    { id: "prod-elz-2", storeId: "store-elizabeth", name: "Textured Evening Clutch Bag", category: "aksesori", price: 329000, stock: 15, image: "https://images.unsplash.com/photo-1566150905458-1bf1fc15a6a0?w=500&q=80", barcode: "8995234567025" }
  ];

  const queues: Queue[] = [
    {
      id: "q-1",
      storeId: "store-zara",
      storeName: "Zara Grand Indonesia",
      userId: "cust-budi",
      userName: "Budi Santoso",
      queueNumber: "A-001",
      status: "waiting",
      scheduledHour: "10:00 - 11:00",
      date: "2026-07-15",
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes: 15
    },
    {
      id: "q-2",
      storeId: "store-zara",
      storeName: "Zara Grand Indonesia",
      userId: "cust-ani",
      userName: "Ani Wijaya",
      queueNumber: "A-002",
      status: "checked-in",
      scheduledHour: "10:00 - 11:00",
      date: "2026-07-15",
      createdAt: new Date().toISOString(),
      checkInTime: new Date().toISOString(),
      estimatedWaitMinutes: 30
    }
  ];

  // Past orders for beautiful stats reports!
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const orders: Order[] = [
    {
      id: "order-1",
      userId: "cust-budi",
      userName: "Budi Santoso",
      storeId: "store-zara",
      storeName: "Zara Grand Indonesia",
      items: [
        { productId: "prod-zara-1", name: "Premium Wool Classic Blazer", price: 1499000, quantity: 1, category: "baju" },
        { productId: "prod-zara-4", name: "Minimalist Buckle Leather Belt", price: 399000, quantity: 1, category: "aksesori" }
      ],
      subtotal: 1898000,
      commission: 94900,
      total: 1992900,
      paymentMethod: "va",
      paymentStatus: "completed",
      vaNumber: "8806081234567890",
      createdAt: threeDaysAgo + "T14:32:00Z"
    },
    {
      id: "order-2",
      userId: "cust-ani",
      userName: "Ani Wijaya",
      storeId: "store-hm",
      storeName: "H&M Paris Van Java",
      items: [
        { productId: "prod-hm-1", name: "Heavyweight Oversized Hoodie", price: 449000, quantity: 2, category: "baju" }
      ],
      subtotal: 898000,
      commission: 44900,
      total: 942900,
      paymentMethod: "qris",
      paymentStatus: "completed",
      createdAt: yesterday + "T11:15:00Z"
    },
    {
      id: "order-3",
      userId: "cust-fariz",
      userName: "Fariz Fadillah",
      storeId: "store-uniqlo",
      storeName: "Uniqlo Tunjungan Plaza",
      items: [
        { productId: "prod-uni-1", name: "Airism Cotton Oversized T-Shirt", price: 199000, quantity: 3, category: "baju" },
        { productId: "prod-uni-3", name: "Airism Comfort Socks 3-Pack", price: 149000, quantity: 1, category: "aksesori" }
      ],
      subtotal: 746000,
      commission: 37300,
      total: 783300,
      paymentMethod: "cc",
      paymentStatus: "completed",
      createdAt: fiveDaysAgo + "T16:45:00Z"
    },
    {
      id: "order-4",
      userId: "cust-fariz",
      userName: "Fariz Fadillah",
      storeId: "store-adidas",
      storeName: "Adidas Sun Plaza",
      items: [
        { productId: "prod-adi-1", name: "Ultraboost Light Running Shoes", price: 3300000, quantity: 1, category: "sepatu" }
      ],
      subtotal: 3300000,
      commission: 165000,
      total: 3465000,
      paymentMethod: "va",
      paymentStatus: "paid",
      vaNumber: "8806085544332211",
      createdAt: today + "T09:15:00Z"
    }
  ];

  const reviews: Review[] = [
    { id: "rev-1", storeId: "store-zara", userId: "cust-budi", userName: "Budi Santoso", rating: 5, comment: "Sangat terbantu dengan antrian virtual FashCollab! Gak perlu capek nunggu berdiri di depan toko. Begitu dapet giliran langsung masuk, scan baju kesukaan, dan check-out mandiri.", createdAt: threeDaysAgo + "T15:00:00Z" },
    { id: "rev-2", storeId: "store-zara", userId: "cust-ani", userName: "Ani Wijaya", rating: 4, comment: "Koleksinya lengkap. Sistem scan and go bekerja dengan lancar. Tinggal bayar pake QRIS dan serahkan bukti bayar pas keluar toko.", createdAt: yesterday + "T12:00:00Z" },
    { id: "rev-3", storeId: "store-hm", userId: "cust-ani", userName: "Ani Wijaya", rating: 5, comment: "Beli hoodie di H&M pvj lancar jaya, no ribet antri di kasir!", createdAt: yesterday + "T11:45:00Z" }
  ];

  const config = {
    commissionPercent: 5
  };

  return { users, credentials, stores, products, queues, orders, reviews, config };
}

const app = express();
app.use(express.json());

// API Auth Endpoints
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  const db = readDb();
  
  if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "Email sudah terdaftar" });
  }

  const userId = `user-${Date.now()}`;
  let storeId = undefined;

  // If registering as a store owner, automatically prepare a draft store or let them create one
  if (role === "store_owner") {
    storeId = `store-${Date.now()}`;
    const newStore: Store = {
      id: storeId,
      name: `${name} Store`,
      ownerId: userId,
      city: "Jakarta",
      province: "DKI Jakarta",
      address: "Alamat Toko Belum Ditentukan",
      category: "all",
      status: "pending", // Must be approved by Admin
      description: "Toko fashion baru di FashCollab.",
      logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop&q=80",
      queueQuotaPerHour: 10,
      avgServiceTimeMinutes: 15,
      currentQueueCount: 0,
      rating: 0,
      reviewCount: 0
    };
    db.stores.push(newStore);
  }

  const newUser: User = {
    id: userId,
    name,
    email,
    role: role as UserRole,
    isEmailVerified: false, // Verification required as requested
    storeId
  };

  db.users.push(newUser);
  db.credentials[email] = password || "password123";
  writeDb(db);

  res.json({ success: true, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();

  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "Email atau password salah" });
  }

  const savedPassword = db.credentials[email];
  if (savedPassword !== password) {
    return res.status(400).json({ error: "Email atau password salah" });
  }

  res.json({ success: true, user });
});

app.post("/api/auth/google-login", (req, res) => {
  const { email, name } = req.body;
  const db = readDb();

  let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Register Google user automatically as Customer
    const userId = `user-${Date.now()}`;
    user = {
      id: userId,
      name,
      email,
      role: "customer",
      isEmailVerified: true // Google accounts are pre-verified
    };
    db.users.push(user);
    db.credentials[email] = `google-${Date.now()}`;
    writeDb(db);
  }

  res.json({ success: true, user });
});

app.post("/api/auth/verify-email", (req, res) => {
  const { userId } = req.body;
  const db = readDb();
  const user = db.users.find((u: any) => u.id === userId);
  if (user) {
    user.isEmailVerified = true;
    writeDb(db);
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: "User tidak ditemukan" });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email } = req.body;
  const db = readDb();
  if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.json({ success: true, message: "Link reset password telah dikirim ke email Anda" });
  }
  res.status(400).json({ error: "Email tidak ditemukan" });
});

// API Stores Endpoints
app.get("/api/stores", (req, res) => {
  const db = readDb();
  // Filter only approved stores for customers, but return everything for Admin
  const { all } = req.query;
  if (all === "true") {
    return res.json(db.stores);
  }
  const approvedStores = db.stores.filter((s: Store) => s.status === "approved");
  res.json(approvedStores);
});

app.post("/api/stores/update", (req, res) => {
  const { id, name, city, province, address, category, description, queueQuotaPerHour, avgServiceTimeMinutes } = req.body;
  const db = readDb();
  const idx = db.stores.findIndex((s: Store) => s.id === id);
  if (idx !== -1) {
    db.stores[idx] = {
      ...db.stores[idx],
      name,
      city,
      province,
      address,
      category,
      description,
      queueQuotaPerHour: Number(queueQuotaPerHour) || 10,
      avgServiceTimeMinutes: Number(avgServiceTimeMinutes) || 15
    };
    writeDb(db);
    return res.json({ success: true, store: db.stores[idx] });
  }
  res.status(404).json({ error: "Toko tidak ditemukan" });
});

app.post("/api/stores/action", (req, res) => {
  const { id, status } = req.body; // status: approved, suspended, deleted
  const db = readDb();
  
  if (status === "deleted") {
    db.stores = db.stores.filter((s: Store) => s.id !== id);
    writeDb(db);
    return res.json({ success: true });
  }

  const store = db.stores.find((s: Store) => s.id === id);
  if (store) {
    store.status = status;
    writeDb(db);
    return res.json({ success: true, store });
  }
  res.status(404).json({ error: "Toko tidak ditemukan" });
});

// API Products Endpoints
app.get("/api/products", (req, res) => {
  const { storeId, barcode } = req.query;
  const db = readDb();
  
  if (barcode) {
    const product = db.products.find((p: Product) => p.barcode === barcode);
    if (!product) {
      return res.status(404).json({ error: "Produk dengan barcode ini tidak ditemukan di platform" });
    }
    const store = db.stores.find((s: Store) => s.id === product.storeId);
    return res.json({ product, store });
  }

  if (storeId) {
    const storeProducts = db.products.filter((p: Product) => p.storeId === storeId);
    return res.json(storeProducts);
  }

  res.json(db.products);
});

app.post("/api/products/add", (req, res) => {
  const { storeId, name, category, price, stock, image, barcode } = req.body;
  const db = readDb();

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    storeId,
    name,
    category,
    price: Number(price),
    stock: Number(stock),
    image: image || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80",
    barcode: barcode || `BC-${Date.now().toString().slice(-6)}`
  };

  db.products.push(newProduct);
  writeDb(db);
  res.json({ success: true, product: newProduct });
});

app.post("/api/products/edit", (req, res) => {
  const { id, name, category, price, stock, image, barcode } = req.body;
  const db = readDb();

  const idx = db.products.findIndex((p: Product) => p.id === id);
  if (idx !== -1) {
    db.products[idx] = {
      ...db.products[idx],
      name,
      category,
      price: Number(price),
      stock: Number(stock),
      image,
      barcode
    };
    writeDb(db);
    return res.json({ success: true, product: db.products[idx] });
  }
  res.status(404).json({ error: "Produk tidak ditemukan" });
});

app.post("/api/products/delete", (req, res) => {
  const { id } = req.body;
  const db = readDb();
  db.products = db.products.filter((p: Product) => p.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// API Queues Endpoints
app.get("/api/queues", (req, res) => {
  const { storeId, userId } = req.query;
  const db = readDb();

  let filtered = db.queues;
  if (storeId) {
    filtered = filtered.filter((q: Queue) => q.storeId === storeId);
  }
  if (userId) {
    filtered = filtered.filter((q: Queue) => q.userId === userId);
  }
  res.json(filtered);
});

app.post("/api/queues/join", (req, res) => {
  const { storeId, userId, userName, scheduledHour } = req.body;
  const db = readDb();

  const store = db.stores.find((s: Store) => s.id === storeId);
  if (!store) {
    return res.status(404).json({ error: "Toko tidak ditemukan" });
  }

  // Check if user already has an active waiting/checked-in queue for this store
  const existingActive = db.queues.find(
    (q: Queue) => q.userId === userId && q.storeId === storeId && ["waiting", "checked-in"].includes(q.status)
  );
  if (existingActive) {
    return res.status(400).json({ error: "Anda sudah memiliki antrian aktif di toko ini" });
  }

  // Calculate queue number
  const today = new Date().toISOString().split("T")[0];
  const todayStoreQueues = db.queues.filter((q: Queue) => q.storeId === storeId && q.date === today);
  const nextNum = todayStoreQueues.length + 1;
  const queueNumber = `A-${String(nextNum).padStart(3, "0")}`;

  // Estimate waiting time based on current waiting people
  const waitingPeopleCount = todayStoreQueues.filter((q: Queue) => q.status === "waiting").length;
  const estimatedWaitMinutes = (waitingPeopleCount + 1) * store.avgServiceTimeMinutes;

  const newQueue: Queue = {
    id: `q-${Date.now()}`,
    storeId,
    storeName: store.name,
    userId,
    userName,
    queueNumber,
    status: "waiting",
    scheduledHour: scheduledHour || "10:00 - 11:00",
    date: today,
    createdAt: new Date().toISOString(),
    estimatedWaitMinutes
  };

  db.queues.push(newQueue);
  
  // Update store queue counts
  store.currentQueueCount = db.queues.filter((q: Queue) => q.storeId === storeId && ["waiting", "checked-in"].includes(q.status)).length;

  writeDb(db);
  res.json({ success: true, queue: newQueue });
});

app.post("/api/queues/update", (req, res) => {
  const { id, status } = req.body; // status: checked-in, served, completed, cancelled
  const db = readDb();

  const queue = db.queues.find((q: Queue) => q.id === id);
  if (!queue) {
    return res.status(404).json({ error: "Antrian tidak ditemukan" });
  }

  queue.status = status as QueueStatus;
  if (status === "checked-in") {
    queue.checkInTime = new Date().toISOString();
  }

  // Re-calculate queue counts for the store
  const store = db.stores.find((s: Store) => s.id === queue.storeId);
  if (store) {
    store.currentQueueCount = db.queues.filter(
      (q: Queue) => q.storeId === store.id && ["waiting", "checked-in"].includes(q.status)
    ).length;
  }

  writeDb(db);
  res.json({ success: true, queue });
});

// API Orders Endpoints
app.get("/api/orders", (req, res) => {
  const { userId, storeId } = req.query;
  const db = readDb();

  let filtered = db.orders;
  if (userId) {
    filtered = filtered.filter((o: Order) => o.userId === userId);
  }
  if (storeId) {
    filtered = filtered.filter((o: Order) => o.storeId === storeId);
  }
  res.json(filtered);
});

app.post("/api/orders/create", (req, res) => {
  const { userId, userName, storeId, items, paymentMethod } = req.body;
  const db = readDb();

  const store = db.stores.find((s: Store) => s.id === storeId);
  if (!store) {
    return res.status(404).json({ error: "Toko tidak ditemukan" });
  }

  // Calculate prices and deduct stock
  let subtotal = 0;
  const itemsWithPricing = items.map((item: any) => {
    const product = db.products.find((p: Product) => p.id === item.productId);
    if (!product) {
      throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Stok produk ${product.name} tidak mencukupi (Tersedia: ${product.stock})`);
    }
    
    // Deduct stock
    product.stock -= item.quantity;
    subtotal += product.price * item.quantity;

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      category: product.category
    };
  });

  const commissionRate = db.config?.commissionPercent || 5;
  const commission = Math.round((subtotal * commissionRate) / 100);
  const total = subtotal + commission;

  let vaNumber = undefined;
  let qrisUrl = undefined;

  if (paymentMethod === "va") {
    vaNumber = `880608${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  } else if (paymentMethod === "qris") {
    qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=FashCollab_Payment_${Date.now()}`;
  }

  const newOrder: Order = {
    id: `order-${Date.now()}`,
    userId,
    userName,
    storeId,
    storeName: store.name,
    items: itemsWithPricing,
    subtotal,
    commission,
    total,
    paymentMethod,
    paymentStatus: "pending",
    vaNumber,
    qrisUrl,
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  writeDb(db);
  res.json({ success: true, order: newOrder });
});

app.post("/api/orders/pay", (req, res) => {
  const { orderId } = req.body;
  const db = readDb();

  const order = db.orders.find((o: Order) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan" });
  }

  order.paymentStatus = "paid";
  writeDb(db);
  res.json({ success: true, order });
});

app.post("/api/orders/update-status", (req, res) => {
  const { id, status } = req.body; // status: processing, ready, completed
  const db = readDb();

  const order = db.orders.find((o: Order) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan" });
  }

  order.paymentStatus = status as OrderStatus;
  writeDb(db);
  res.json({ success: true, order });
});

// API Reviews Endpoints
app.get("/api/reviews", (req, res) => {
  const { storeId } = req.query;
  const db = readDb();

  if (storeId) {
    const storeReviews = db.reviews.filter((r: Review) => r.storeId === storeId);
    return res.json(storeReviews);
  }
  res.json(db.reviews);
});

app.post("/api/reviews/add", (req, res) => {
  const { storeId, userId, userName, rating, comment } = req.body;
  const db = readDb();

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    storeId,
    userId,
    userName,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  db.reviews.push(newReview);

  // Recalculate store rating
  const store = db.stores.find((s: Store) => s.id === storeId);
  if (store) {
    const storeReviews = db.reviews.filter((r: Review) => r.storeId === storeId);
    const totalRating = storeReviews.reduce((sum: number, r: Review) => sum + r.rating, 0);
    store.rating = Number((totalRating / storeReviews.length).toFixed(1));
    store.reviewCount = storeReviews.length;
  }

  writeDb(db);
  res.json({ success: true, review: newReview });
});

// Admin endpoints
app.get("/api/admin/stats", (req, res) => {
  const db = readDb();
  
  const totalSales = db.orders
    .filter((o: Order) => o.paymentStatus !== "pending")
    .reduce((sum: number, o: Order) => sum + o.subtotal, 0);

  const totalCommission = db.orders
    .filter((o: Order) => o.paymentStatus !== "pending")
    .reduce((sum: number, o: Order) => sum + o.commission, 0);

  const totalTransactions = db.orders.filter((o: Order) => o.paymentStatus !== "pending").length;
  const totalStores = db.stores.length;
  const totalQueues = db.queues.length;

  // Group sales by date
  const salesMap: { [key: string]: { amount: number; commission: number } } = {};
  db.orders
    .filter((o: Order) => o.paymentStatus !== "pending")
    .forEach((o: Order) => {
      const date = o.createdAt.split("T")[0];
      if (!salesMap[date]) {
        salesMap[date] = { amount: 0, commission: 0 };
      }
      salesMap[date].amount += o.subtotal;
      salesMap[date].commission += o.commission;
    });

  const salesByDate = Object.keys(salesMap)
    .sort()
    .map(date => ({
      date,
      amount: salesMap[date].amount,
      commission: salesMap[date].commission
    }));

  // Group sales by category
  const categoryMap: { [key: string]: number } = { baju: 0, sepatu: 0, aksesori: 0 };
  db.orders
    .filter((o: Order) => o.paymentStatus !== "pending")
    .forEach((o: Order) => {
      o.items.forEach(item => {
        categoryMap[item.category] = (categoryMap[item.category] || 0) + (item.price * item.quantity);
      });
    });

  const salesByCategory = Object.keys(categoryMap).map(category => ({
    category,
    amount: categoryMap[category]
  }));

  const stats: SystemStats = {
    totalSales,
    totalCommission,
    totalTransactions,
    totalStores,
    totalQueues,
    salesByDate,
    salesByCategory
  };

  res.json({ stats, commissionPercent: db.config?.commissionPercent || 5 });
});

app.post("/api/admin/commission", (req, res) => {
  const { commissionPercent } = req.body;
  const db = readDb();
  if (!db.config) {
    db.config = {};
  }
  db.config.commissionPercent = Number(commissionPercent) || 5;
  writeDb(db);
  res.json({ success: true, commissionPercent: db.config.commissionPercent });
});

// Setup Vite & static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

start();
