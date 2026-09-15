// src/app/core/services/ai-chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private apiUrl = `${environment.apiUrl}/ai/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: ChatMessage[]): Observable<ChatResponse> {
    const historyPayload = history.map(m => ({ role: m.role, text: m.text }));
    return this.http.post<ChatResponse>(this.apiUrl, { message, history: historyPayload });
  }
}
