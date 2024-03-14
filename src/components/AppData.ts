import {Model} from './base/Model';
import {IProduct, IOrder, IDeliveryForm, IAppState, FormErrors, IContactForm} from '../types';

export type CatalogChangeEvent = {
	catalog: IProduct[];
};

export class ProductItem extends Model<IProduct> {
	id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
}

export class AppState extends Model<IAppState> {
	catalog: ProductItem[];
	basket: ProductItem[] = [];
	preview: string | null;
	order: IOrder = {
		email: '',
		phone: '',
		payment: 'cash',
		address: '',
		items: [],
		total: 0,
	};
	formErrors: FormErrors = {};

	clearBasket() {
		this.basket = [];
		this.updateBasket();
	}

	setCatalog(items: IProduct[]) {
		this.catalog = items.map((item) => new ProductItem(item, this.events));
		this.emitChanges('items:changed', { catalog: this.catalog });
	}

	setPreview(item: ProductItem) {
		this.preview = item.id;
		this.emitChanges('preview:changed', item);
	}

	getTotal(): number {
        return this.basket.reduce((a, b) => { return a + b.price }, 0)
    }

	updateBasket() {
		this.emitChanges('counter:changed', this.basket);
		this.emitChanges('basket:changed', this.basket);
	}

	addToBasket(item: ProductItem) {
		if (this.basket.indexOf(item) <= 0) {
			this.basket.push(item);
			this.updateBasket();
		}
	}

	removeFromBasket(item: ProductItem) {
		this.basket = this.basket.filter((element) => element != item);
		this.updateBasket();
	}

	setDeliveryField(field: keyof IDeliveryForm, value: string) {
		this.order[field] = value;
		if (this.validateDelivery()) {
			this.events.emit('order:ready', this.order);
		}
	}

	validateDelivery() {
		const errors: typeof this.formErrors = {};
		if (!this.order.address) {
			errors.address = 'Необходимо указать адрес';
		}
		this.formErrors = errors;
		this.events.emit('formErrors:change', this.formErrors);
		return Object.keys(errors).length === 0;
	}

	setContactField(field: keyof IContactForm, value: string) {
		this.order[field] = value;
		if (this.validateContact()) {
			this.events.emit('contacts:ready', this.order);
		}
	}

	validateContact() {
		const errors: typeof this.formErrors = {};
		if (!this.order.email) {
			errors.email = 'Необходимо указать email';
		}
		if (!this.order.phone) {
			errors.phone = 'Необходимо указать телефон';
		}
		this.formErrors = errors;
		this.events.emit('formErrors:change', this.formErrors);
		return Object.keys(errors).length === 0;
	}
}