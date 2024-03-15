import './scss/styles.scss';

import {WebLarekAPI} from './components/LarekAPI';
import {API_URL, CDN_URL} from './utils/constants';
import {EventEmitter} from './components/base/events';
import {cloneTemplate, ensureElement} from './utils/utils';
import {AppState, CatalogChangeEvent, ProductItem} from './components/AppData';
import {Page} from './components/Page';
import {IOrder, IContactForm, IDeliveryForm} from './types';
import {Card} from './components/Card';
import {Modal} from './components/common/Modal';
import {Basket} from './components/common/Basket';
import {DeliveryForm} from './components/DeliveryForm';
import {ContactForm} from './components/ContactForm';
import {Success} from './components/common/Success';

const events = new EventEmitter();
const api = new WebLarekAPI(CDN_URL, API_URL);

// Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Модель данных приложения
const appData = new AppState({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

// Переиспользуемые части интерфейса
const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new DeliveryForm(cloneTemplate(orderTemplate), events, {onClick: (evt: Event) => events.emit('payment:toggle', evt.target)});
const contacts = new ContactForm(cloneTemplate(contactsTemplate), events);

const PaymentMethods: Record<string, string> = {
	card: 'card',
	cash: 'cash',
};

api.getProductList()
	.then(appData.setCatalog.bind(appData))
	.catch((error) => {
		console.error(error);
});

events.on('basket:open', () => {
	modal.render({
		content: basket.render({}),
	});
});

events.on<CatalogChangeEvent>('items:changed', () => {
    page.catalog = appData.catalog.map(item => {
        const card = new Card(cloneTemplate(cardCatalogTemplate), {
            onClick: () => events.emit('card:select', item)
        });
        return card.render({
            title: item.title,
            image: item.image,
            category: item.category,
            price: item.price,
        });
    });
})

events.on('card:select', (item: ProductItem) => {
	appData.setPreview(item);
});

events.on('preview:changed', (item: ProductItem) => {
	
	const card = new Card(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			events.emit('product:toggle', item);

			if (appData.buttonText === 'Добавить') {
				events.emit('product:add', item);
				card.button = appData.getButtonName(item.title);
			} else {
				events.emit('product:delete', item);
				card.button = appData.getButtonName(item.title);
			}

		},
	});
	modal.render({
		content: card.render({
			title: item.title,
			description: item.description,
			image: item.image,
			price: item.price,
			category: item.category,
			buttonText:appData.getButtonName(item.title),
		}),
	});
});

events.on('product:add', (item: ProductItem) => {
	appData.addToBasket(item);
});

events.on('product:delete', (item: ProductItem) => {
	appData.removeFromBasket(item);
});

events.on('counter:changed', (item: string[]) => {
	page.counter = appData.basket.length;
  })

events.on('basket:changed', (items: ProductItem[]) => {
	basket.items = items.map((item, index) => {
		const card = new Card(cloneTemplate(cardBasketTemplate), {
			onClick: () => {
				events.emit('product:delete', item);
			},
		});
		return card.render({
			index: (index + 1).toString(),
			title: item.title,
			price: item.price,
		});
	});
	basket.total = appData.getTotal();
	appData.order.total = appData.getTotal();
});

events.on('order:open', () => {
	modal.render({
		content: order.render({
			payment: '',
			address: '',
			valid: false,
			errors: [],
		}),
	});
	appData.order.items = appData.basket.map((item) => item.id);
});

events.on('payment:toggle', (target: HTMLElement) => {
	if (!target.classList.contains('button_alt-active')) {
		order.toggleButtons(target);
		appData.order.payment = PaymentMethods[target.getAttribute('name')];
	}
});

events.on('order:submit', () => {
	modal.render({
		content: contacts.render({
			email: '',
			phone: '',
			valid: false,
			errors: [],
		}),
	});
});

events.on('formErrors:change', (errors: Partial<IOrder>) => {
	const {payment, address, email, phone} = errors;
	order.valid = !payment && !address;
	order.errors = Object.values({payment, address}).filter((i) => !!i).join('; ');
	contacts.valid = !email && !phone;
	contacts.errors = Object.values({phone, email}).filter((i) => !!i).join('; ');
});

events.on('contacts:submit', () => {
	api.orderProducts(appData.order)
		.then((result) => {
			appData.clearBasket();
			const success = new Success(cloneTemplate(successTemplate), {
				onClick: () => {
					modal.close();
				},
			});
			modal.render ({
				content: success.render({}),
			});
			success.total = `Списано ${result.total} синапсов`;
		})
		.catch((error) => {
			console.error(error);
		});
});

events.on(/^order\..*:change/, (data: {field: keyof IDeliveryForm; value: string}) => {
	appData.setDeliveryField(data.field, data.value);
});

events.on(/^contacts\..*:change/, (data: {field: keyof IContactForm; value: string}) => {
appData.setContactField(data.field, data.value);
});

events.on('modal:open', () => {
	page.locked = true;
});

events.on('modal:close', () => {
	page.locked = false;
});