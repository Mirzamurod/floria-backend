const ru = {
  seebouquets: 'Посмотреть букеты',
  orderdone: orderNumber => `Ваш цифровой заказ #No${orderNumber} готов.`,
  ordercancelled: orderNumber => `Ваш цифровой заказ #No${orderNumber} был отменен.`,
  pickuporder: 'Вы можете забрать свой заказ по указанному ниже адресу.',
  location: location => `Вы можете забрать свой заказ <a href='${location}'>здесь</a>.`,
  seebouquetsmore: 'Посмотреть букеты и цветы можно нажав кнопку посмотреть букеты.',
  deliveredsoon: 'Скоро он будет доставлен по вашему адресу.',
  successpayment: orderNumber =>
    `Ваш платеж за #No${orderNumber} получен.\nМы сообщим вам, как только ваш заказ будет готов.`,
  cancelledpayment2: orderNumber =>
    `Ваш второй платеж за #No${orderNumber} не был принят, и ваш заказ был отменен.`,
  cancelledorder: orderNumber => `Заказ номер \`${orderNumber}\` был отменен.`,
  cancelledpayment: orderNumber => `Ваш платеж за #No${orderNumber} не принят.`,
  warningpayment:
    'Загрузите действительное изображение платежа или отмените заказ.\n\nЕсли вы хотите отменить заказ, нажмите Меню и выберите "Отменить заказ", чтобы отменить заказ.',
  asknumber: orderNumber => `Продавец спрашивает, получили ли вы заказ №No${orderNumber}?`,
  yes: 'Да',
  no: 'Нет',
  paymentreminder: date =>
    `Вы должны оплатить до ${date}, иначе ваш бот Telegram будет заблокирован.`,
  blockedbot: 'Ваш телеграм-бот заблокирован, так как вам нужно заплатить.',
  reasoncancelled: (orderNumber, text) =>
    text === 1
      ? `Ваш заказ #No${orderNumber} был отменен из-за предоплаты.`
      : `Ваш заказ #No${orderNumber} был отменен, поскольку вам необходимо отправить свой адрес.`,
  receiveorder: orderNumber => `Вы получили свой заказ #No${orderNumber}?`,
  pastduedate: orderNumber => `Срок доступности заказа \`${orderNumber}\` истек.`,
  sendlocation: '📍 Отправьте свой адрес',
  platform: first_name => `Добро пожаловать на платформу ${first_name}.`,
  askPhone: 'Перед заказом букета отправьте свой номер телефона:',
  sendContact: '📲 Отправить контакт',
  none: 'Ни один',
  whichorder: 'Какой заказ вы хотите отменить?',
  noorders: 'Заказов не найдено.',
  namephone: (userName, userPhone) => `Имя: ${userName}\nНомер телефона: ${userPhone}`,
  cardnumber: (card_number, card_name) =>
    `Номер карты: \`${card_number}\`\nИмя владельца карты: ${card_name}`,
  sentpicture: 'Изображение отправлено администратору. Мы сообщим вам в ближайшее время.',
  repayment: orderNumber =>
    `Заказ с номером \`${orderNumber}\` был повторно оплачен: [просмотреть заказ]`,
  neworder: 'Новый заказ: [просмотреть заказ]',
  acceptedphone: first_name =>
    `✅ Ваш номер принят: ${first_name}. Посмотреть букеты и цветы можно нажав кнопку Посмотреть букеты.`,
  listorders: orderNumber =>
    `Ваш #No${orderNumber} заказ получен.\nСписок заказанных вами букетов:`,
  custombouquet: 'Специальный букет:',
  price: 'Цена',
  totalbouquets: 'Общее количество букетов',
  totalprice: 'Общая стоимость букетов',
  sendaddress: 'Отправьте свой адрес для доставки букетов.',
  payment: (card_number, card_name) =>
    `Вам необходимо произвести оплату на указанный номер карты и отправить нам его фото. После проверки платежа мы вам сообщим.\n\n\`${card_number}\`\n${card_name}`,
  acceptedorder: 'Ваш заказ принят. Мы сообщим вам, как только он будет готов.',
  acceptedlocationsendpayment: (card_number, card_name) =>
    `Ваш адрес принят.\n\nВам необходимо произвести оплату на указанный номер карты и отправить нам его фото. После проверки платежа мы вам сообщим.\n\n\`${card_number}\`\n${card_name}`,
  acceptedlocation:
    'Ваш адрес принят. Букет будет доставлен по указанному адресу, как только будет готов.',
  thanks: 'Спасибо за ваш ответ.',
  askseller: (userName, userPhone) =>
    `Позвоните продавцу и уточните, почему ваш букет еще не готов.\n\nИмя: ${userName}\nТелефон: ${userPhone}`,
  acceptedclientorder: orderNumber => `Клиент принял заказ с номером \`${orderNumber}\`.`,
  changelang: 'Выберите язык',
}

export default ru
