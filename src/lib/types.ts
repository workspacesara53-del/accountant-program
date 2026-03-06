export type OrderStatus = 'new' | 'ordered_from_supplier' | 'partially_received' | 'fully_received' | 'unavailable' | 'completed';

export interface Order {
  id?: string;
  date: number;
  customerName: string;
  productName: string;
  supplierName: string;
  wholesalePrice: number;
  salePrice: number;
  quantityOrdered: number;
  quantityReceived: number;
  quantityDelivered: number;
  status: OrderStatus;
  customerPaid: number;
  supplierPaid: number;
  note: string;
  userId: string;
}

export interface UserSettings {
  initialCapital: number;
}
