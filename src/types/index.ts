export interface IProduct {
  id: string;
  description: string;
  image: string;
  title: string;
  category: string;
  price: number | null;
}

export interface IContactForm {
  email: string;
  phone: string;
}

export interface IDeliveryForm {
  payment: string;
  address: string;
}

export interface IOrder extends IDeliveryForm, IContactForm {
  total: number;
  items: string[];
}

export type FormErrors = Partial<Record<keyof IOrder, string>>;

export interface IAppState {
  catalog: IProduct[];
  basket: IProduct[];
  preview: string | null;
  order: IOrder;
  loading: boolean;
}