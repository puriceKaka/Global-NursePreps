const now = new Date().toISOString();

export const seedInventoryProducts = [
  {
    id: 'prd-phone-001',
    productType: 'phone',
    productModel: 'Samsung A15',
    serialNumber: '356789123456789',
    chassisNumber: '356789123456780',
    imei1: '356789123456789',
    imei2: '356789123456780',
    lockerId: 'LCK-9001',
    branch: 'Nairobi CBD',
    status: 'available',
    assignedCustomerId: null,
    assignedAgentId: 'agent-001',
    assignedAgentCode: 'AG-001',
    storageGb: 128,
    ramGb: 6,
    color: 'Midnight Black',
    simSlotCount: 2,
    lockerSyncStatus: 'synced',
    createdAt: now
  },
  {
    id: 'prd-bike-001',
    productType: 'bike',
    productModel: 'TVS HLX 150',
    serialNumber: 'TVS-HLX-2026-010',
    chassisNumber: 'MD625MF54P1A90841',
    engineNumber: 'EN-150-001',
    frameNumber: 'FR-150-001',
    registrationNumber: 'KMC 123A',
    trackerId: 'TRK-4501',
    color: 'Red',
    odometerKm: 1240,
    serviceDueDate: '2026-07-30',
    mechanicalStatus: 'ready',
    branch: 'Mombasa Road',
    status: 'assigned',
    assignedCustomerId: 'cus-001',
    assignedAgentId: 'agent-001',
    assignedAgentCode: 'AG-001',
    createdAt: now
  }
];

export const seedCustomers = [
  {
    id: 'cus-001',
    customerName: 'John Mwangi',
    customerPhone: '+254700000111',
    agentName: 'Amina Yusuf',
    agentId: 'AG-001',
    productType: 'bike',
    productModel: 'TVS HLX 150',
    bikeModel: 'TVS HLX 150',
    chassisNumber: 'MD625MF54P1A90841',
    serialNumber: 'TVS-HLX-2026-010',
    totalPayable: 30000,
    paidAmount: 5000,
    balance: 25000,
    dueDate: '2026-06-25',
    lastPaymentDate: '2026-06-20',
    status: 'active',
    overdueDays: 0,
    registrationStatus: 'registered'
  },
  {
    id: 'cus-002',
    customerName: 'Grace Wanjiku',
    customerPhone: '+254700000222',
    agentName: 'Amina Yusuf',
    agentId: 'AG-001',
    productType: 'phone',
    productModel: 'Samsung A15',
    bikeModel: 'Samsung A15',
    chassisNumber: '356789123456780',
    serialNumber: '356789123456789',
    totalPayable: 18000,
    paidAmount: 3000,
    balance: 15000,
    dueDate: '2026-06-24',
    lastPaymentDate: '2026-06-23',
    status: 'active',
    overdueDays: 1,
    registrationStatus: 'registered'
  }
];

export const seedPayments = [
  {
    id: 'pay-001',
    customerName: 'John Mwangi',
    customerPhone: '+254700000111',
    agentName: 'Amina Yusuf',
    agentId: 'AG-001',
    bikeModel: 'TVS HLX 150',
    productType: 'bike',
    productModel: 'TVS HLX 150',
    chassisNumber: 'MD625MF54P1A90841',
    serialNumber: 'TVS-HLX-2026-010',
    totalPayable: 30000,
    paidAmount: 5000,
    balance: 25000,
    dueDate: '2026-06-25',
    registrationStatus: 'registered',
    depositCredit: 5000,
    paygoPayment: 1000,
    dailyTarget: 1000,
    date: '2026-06-24T08:15:00.000Z',
    receipt: 'RCPT-1001',
    status: 'paid',
    overdueDays: 0,
    paygoState: 'on_track',
    followUp: 'No follow up needed',
    sourcePortal: 'finance'
  },
  {
    id: 'pay-002',
    customerName: 'Grace Wanjiku',
    customerPhone: '+254700000222',
    agentName: 'Amina Yusuf',
    agentId: 'AG-001',
    bikeModel: 'Samsung A15',
    productType: 'phone',
    productModel: 'Samsung A15',
    chassisNumber: '356789123456780',
    serialNumber: '356789123456789',
    totalPayable: 18000,
    paidAmount: 3000,
    balance: 15000,
    dueDate: '2026-06-24',
    registrationStatus: 'registered',
    depositCredit: 3000,
    paygoPayment: 500,
    dailyTarget: 500,
    date: '2026-06-23T14:20:00.000Z',
    receipt: 'RCPT-1002',
    status: 'unpaid',
    overdueDays: 1,
    paygoState: 'follow_up',
    followUp: 'Call customer and confirm payment',
    sourcePortal: 'finance'
  }
];

export const seedCommissions = [
  {
    id: 'com-001',
    agentName: 'Amina Yusuf',
    agentCode: 'AG-001',
    agentPhone: '+254711000111',
    customerName: 'John Mwangi',
    productType: 'bike',
    productModel: 'TVS HLX 150',
    chassisNumber: 'MD625MF54P1A90841',
    serialNumber: 'TVS-HLX-2026-010',
    type: 'sale_activation_commission',
    amount: 1200,
    status: 'earned',
    earnedAt: '2026-06-24T08:30:00.000Z',
    paymentPercentage: 42,
    commissionRate: 4,
    notificationMessage: 'Activation commission pending payout',
    earnedMonth: '2026-06',
    customerPaymentStatus: 'partial'
  }
];

export const seedNotifications = [
  {
    id: 'note-001',
    type: 'payment_due',
    title: 'Payment due today',
    message: 'Grace Wanjiku has a payment due today for Samsung A15.',
    customerName: 'Grace Wanjiku',
    customerPhone: '+254700000222',
    agentName: 'Amina Yusuf',
    agentCode: 'AG-001',
    amount: 500,
    balance: 15000,
    overdueDays: 1,
    sourcePortal: 'backend',
    createdAt: now,
    isRead: false
  }
];

export const seedAdminPortal = {
  admin: {
    id: 'admin-seed',
    email: 'admin@bumu.local',
    fullName: 'Bumu Admin',
    role: 'admin'
  },
  summary: {
    agents: 1,
    customers: 2,
    pendingApplications: 1,
    activeProducts: 2,
    totalBalance: 40000,
    todayCollections: 6000,
    pendingCommissions: 1
  },
  agents: [
    {
      id: 'agent-001',
      agentCode: 'AG-001',
      name: 'Amina Yusuf',
      nationalId: '12345678',
      email: 'amina@bumu.local',
      phone: '+254711000111',
      region: 'Nairobi',
      role: 'field_agent',
      status: 'active',
      totalCustomers: 2,
      commissionBalance: 1200
    }
  ],
  customers: seedCustomers.map((customer) => ({
    id: customer.id,
    name: customer.customerName,
    nationalId: customer.nationalId || '',
    phone: customer.customerPhone,
    email: `${customer.customerName.toLowerCase().replace(/\s+/g, '.')}@bumu.local`,
    dateOfBirth: '1995-01-01',
    gender: 'Not set',
    location: 'Nairobi',
    occupation: 'Trader',
    agentId: customer.agentId,
    agentName: customer.agentName,
    nextOfKin: {
      name: 'Next of kin',
      phone: '+254700009999',
      relationship: 'Sibling',
      nationalId: '98765432',
      gender: 'Not set',
      location: 'Nairobi',
      occupation: 'Trader'
    },
    productType: customer.productType,
    productModel: customer.productModel,
    balance: customer.balance,
    applicationStatus: customer.status,
    repaymentStatus: customer.status,
    status: customer.status,
    createdAt: customer.lastPaymentDate
  })),
  products: seedInventoryProducts,
  payments: seedPayments.map((payment) => ({
    id: payment.id,
    customerId: payment.id === 'pay-001' ? 'cus-001' : 'cus-002',
    agentId: payment.agentId,
    customerName: payment.customerName,
    amount: payment.depositCredit + payment.paygoPayment,
    receipt: payment.receipt,
    status: payment.status,
    reconciliationStatus: 'matched',
    paidAt: payment.date,
    date: payment.date
  })),
  commissions: seedCommissions.map((commission) => ({
    id: commission.id,
    agentName: commission.agentName,
    customerName: commission.customerName,
    amount: commission.amount,
    status: commission.status
  })),
  financeUsers: [
    {
      id: 'finance-001',
      email: 'finance@bumu.local',
      name: 'Finance Officer',
      phone: '+254700001111',
      role: 'finance',
      status: 'active',
      createdAt: now
    }
  ],
  applications: [
    {
      id: 'app-001',
      customerId: 'cus-002',
      customerName: 'Grace Wanjiku',
      phone: '+254700000222',
      nationalId: '33445566',
      agentName: 'Amina Yusuf',
      agentId: 'agent-001',
      bikeId: 'prd-phone-001',
      productType: 'phone',
      productModel: 'Samsung A15',
      depositAmount: 3000,
      installmentPlan: 'Daily repayment',
      nextOfKin: {
        name: 'Rose Wanjiku',
        phone: '+254700008888',
        relationship: 'Sister',
        nationalId: '55667788',
        gender: 'Female',
        location: 'Nairobi',
        occupation: 'Teacher'
      },
      customerOtpVerified: true,
      nextOfKinOtpVerified: true,
      duplicateNationalId: false,
      documents: [],
      verification: {},
      status: 'pending_screening',
      reason: '',
      reviewedAt: '',
      reviewedBy: '',
      submittedAt: now,
      createdAt: '24 Jun 2026'
    }
  ],
  notifications: seedNotifications,
  audits: [
    {
      id: 'audit-001',
      actorEmail: 'admin@bumu.local',
      action: 'product_created',
      targetTable: 'inventory_products',
      targetId: 'prd-phone-001',
      createdAt: now,
      ipAddress: 'client-session'
    }
  ]
};

export const seedAgentPortal = {
  agent: {
    name: 'Amina Yusuf',
    profileName: 'Amina Yusuf',
    code: 'AG-001',
    region: 'Nairobi'
  },
  summary: {
    assignedCustomers: 2,
    overdueCustomers: 1,
    assignedBalance: 40000,
    paidCommissions: 1200,
    pendingCommissions: 1800,
    openTasks: 2
  },
  customers: seedAdminPortal.customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    productType: customer.productType,
    productModel: customer.productModel,
    balance: customer.balance,
    status: customer.status,
    phone: customer.phone,
    email: customer.email,
    alternatePhones: '',
    alternateEmails: '',
    serialNumber: customer.productType === 'phone' ? 'SMA15-9001' : 'TVS-HLX-2026-010',
    chassisNumber: customer.productType === 'phone' ? '356789123456789' : 'MD625MF54P1A90841',
    nextOfKinName: customer.nextOfKin.name,
    nextOfKinPhone: customer.nextOfKin.phone
  })),
  products: seedInventoryProducts,
  commissions: seedCommissions,
  notifications: seedNotifications,
  tasks: [
    { id: 'task-001', title: 'Collect payment from Grace', note: 'Follow up on the phone account', dueLabel: 'Today', status: 'open' },
    { id: 'task-002', title: 'Check bike locker status', note: 'Confirm device sync with locker API', dueLabel: 'Today', status: 'open' }
  ]
};
