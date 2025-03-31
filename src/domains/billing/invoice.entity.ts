export interface Invoice {
    id: string;
    tenantId: string;
    invoiceNumber: string;
    status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    amount: number;
    currency: string;
    dueDate: Date;
    paidDate?: Date;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    items: InvoiceItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    type: 'SUBSCRIPTION' | 'OVERAGE' | 'ONE_TIME' | 'DISCOUNT';
} 