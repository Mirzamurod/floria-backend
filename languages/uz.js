const uz = {
  seebouquets: "Buketlarni ko'rish",
  orderdone: orderNumber => `Sizning #No${orderNumber} raqamli zakazingiz tayyor bo'ldi.`,
  ordercancelled: orderNumber => `Sizning #No${orderNumber} raqamli zakazingiz bekor bo'ldi.`,
  pickuporder: 'Zakazingizni pastdagi manzildan olib ketishingiz mumkin.',
  location: location =>
    `Zakazingizni <a href='${location}'>shu yerdan</a> olib ketishingiz mumkin.`,
  seebouquetsmore: "Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin.",
  deliveredsoon: 'Tez orada manzilingizga yetkazib beriladi.',
  successpayment: orderNumber =>
    `Sizning #No${orderNumber} raqamli zakazingizga qilgan to'lovingiz qabul qilindi.\nZakazingiz tayyor bo'lishi bilan sizga xabar beramiz.`,
  cancelledpayment2: orderNumber =>
    `Sizning #No${orderNumber} raqamli zakazingizga qilgan ikkinchi marta to'lovingiz qabul qilinmadi va zakazingiz bekor qilindi.`,
  cancelledorder: orderNumber => `\`${orderNumber}\` raqamli zakaz bekor qilindi.`,
  cancelledpayment: orderNumber =>
    `Sizning #No${orderNumber} raqamli zakazingizga qilgan to'lovingiz qabul qilinmadi.`,
  warningpayment:
    "To'g'ri to'lov rasmini tashlang yoki zakazingizni bekor qiling.\n\nAgar zakazingizni bekor qilmoqchi bo'lsangiz Menuni bosib \"Zakazni bekor qilish\" ni tanlab zakazingizni bekor qiling.",
  asknumber: orderNumber =>
    `Sotuvchi sizdan #No${orderNumber} raqamli zakazingizni oldingizmi deb so'rayapti?`,
  yes: 'Ha',
  no: "Yo'q",
  paymentreminder: date =>
    `${date} gacha to'lov qilishingiz kerak, aks holda telegram botingiz bloklanadi.`,
  blockedbot: "Sizning telegram botingiz bloklandi, sababi to'lov qilishingiz kerak.",
  reasoncancelled: (orderNumber, text) =>
    text === 1
      ? `Sizning #No${orderNumber} raqamli zakazing bekor qilindi, sababi oldindan to'lov qilishingiz kerak bo'lgan.`
      : `Sizning #No${orderNumber} raqamli zakazing bekor qilindi, sababi manzilingizni yuborishingiz kerak bo'lgan.`,
  receiveorder: orderNumber => `Siz #No${orderNumber} raqamli zakazingizni oldingizmi?`,
  pastduedate: orderNumber =>
    `\`${orderNumber}\` raqamli zakaz tayyor bo'lish sanasidan o'tib ketdi.`,
  sendlocation: '📍 Manzilingizni yuborish',
  platform: first_name => `${first_name} platformasiga xush kelibsiz.`,
  askPhone: 'Buket zakaz qilishdan oldin telefon raqamingizni jo‘nating:',
  sendContact: "📲 Kontakt jo'natish",
  none: 'Hech qaysi',
  whichorder: 'Qaysi zakazni bekor qilmoqchisiz?',
  noorders: 'Hech qanday zakaz topilmadi.',
  namephone: (userName, userPhone) => `Ismi: ${userName}\nTelefon raqami: ${userPhone}`,
  cardnumber: (card_number, card_name) =>
    `Karta raqami: \`${card_number}\`\nKarta egasining ismi: ${card_name}`,
  sentpicture: "Rasm adminga jo'natildi. Tez orada sizga xabar beramiz.",
  repayment: orderNumber =>
    `\`${orderNumber}\` raqamli zakazga qayta to'lov qilindi: [zakazni ko'rish]`,
  neworder: "Yangi zakaz: [zakazni ko'rish]",
  acceptedphone: first_name =>
    `✅ Raqamingiz qabul qilindi: ${first_name}. Buketlarni ko'rish knopkasini bosib, buket va gullarni ko'rishingiz mumkin.`,
  listorders: orderNumber =>
    `#No${orderNumber} raqamli zakazingiz qabul qilindi.\nSiz zakaz bergan buketlar ro'yxati:`,
  custombouquet: 'Maxsus buket:',
  price: 'Narxi',
  totalbouquets: 'Buketlar umumiy soni',
  totalprice: 'Buketlar umumiy narxi',
  sendaddress: 'Buketlarni yetkazib berish uchun manzilingizni yuboring.',
  payment: (card_number, card_name) =>
    `Pastdagi karta raqamiga to'lov qilishingiz va rasmini bizga yuborishingiz kerak, biz to'lovni tekshirib sizga xabar beramiz.\n\n\`${card_number}\`\n${card_name}`,
  acceptedorder: "Zakazingiz qabul qilindi. Tayyor bo'lishi bilan sizga xabar beramiz.",
  acceptedlocationsendpayment: (card_number, card_name) =>
    `Manzilingiz qabul qilindi.\n\nPastdagi karta raqamiga to'lov qilishingiz va rasmini bizga yuborishingiz kerak, biz to'lovni tekshirib sizga xabar beramiz.\n\n\`${card_number}\`\n${card_name}`,
  acceptedlocation:
    "Manzilingiz qabul qilindi. Buket tayyor bo'lishi bilan manzilingizga yetkazib beramiz.",
  thanks: 'Javobingiz uchun rahmat.',
  askseller: (userName, userPhone) =>
    `Sotuvchiga telefon qilib gaplashing, nega buketingiz tayyor bo'lmaganligi haqida.\n\nIsmi: ${userName}\nTelefon raqami: ${userPhone}`,
  acceptedclientorder: orderNumber => `Mijoz \`${orderNumber}\` raqamli zakazni qabul qildi.`,
}

export default uz
