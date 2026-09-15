// src/api/modules/goals/goals.model.ts
export interface CreateGoalDto {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  category?: string;
  deadline: string | Date;
}

export interface UpdateGoalDto {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  category?: string;
  deadline?: string | Date;
  completed?: boolean;
}

export interface ContributeGoalDto {
  amount: number;
}
