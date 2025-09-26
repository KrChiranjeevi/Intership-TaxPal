// budget.model.ts

export interface Budget {
    id: number;
    category: string;
    amount: number;
    month: Date;
    description?: string;
    userId: number;
}
