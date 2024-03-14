import {Form} from './common/Form';
import {IEvents} from './base/events';
import {ensureElement} from '../utils/utils';
import {IDeliveryForm, IActions} from '../types';

export class DeliveryForm extends Form<IDeliveryForm> {
	protected _buttonCard: HTMLButtonElement;
	protected _buttonCash: HTMLButtonElement;

	constructor(
		container: HTMLFormElement, events: IEvents, actions?: IActions) {
		super(container, events);

		this._buttonCard = ensureElement<HTMLButtonElement>('button[name="card"]', container);
		this._buttonCash = ensureElement<HTMLButtonElement>('button[name="cash"]',container);
		this._buttonCash.classList.add('button_alt-active');

		if (actions?.onClick) {
			this._buttonCard.addEventListener('click', actions.onClick);
			this._buttonCash.addEventListener('click', actions.onClick);
		}
	}

	toggleButtons(target: HTMLElement) {
		this._buttonCard.classList.toggle('button_alt-active');
		this._buttonCash.classList.toggle('button_alt-active');
	}

	set address(value: string) {
		(this.container.elements.namedItem('address') as HTMLInputElement).value = value;
	}
}