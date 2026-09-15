// src/app/shared/ai-assistant/ai-assistant.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, ChatMessage } from '@core/services/ai-chat.service';
import { marked } from 'marked';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  isOpen = false;
  userInput = '';
  messages: (ChatMessage & { htmlContent?: string })[] = [];
  isTyping = false;
  errorMessage: string | null = null;
  isListening = false;
  private recognition: any = null;
  private shouldScrollToBottom = false;

  // Quick action suggestions
  readonly suggestions = [
    'How much did I spend this month?',
    'What is my highest expense category?',
    'Suggest ways to save money.',
    'How can I reduce my tax?',
    'Give me budget advice.',
  ];

  constructor(private chatService: AiChatService) {}

  ngOnInit(): void {
    // Init welcome message
    this.addBotMessage('👋 Hi! I\'m **TaxPal AI**, your personal finance assistant.\n\nI have access to your recent transactions and can help you with spending analysis, savings tips, and tax advice. How can I help?');
    this.initVoiceRecognition();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScrollToBottom = true;
      setTimeout(() => this.inputEl?.nativeElement?.focus(), 200);
    }
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isTyping) return;

    this.addUserMessage(text);
    this.userInput = '';
    this.errorMessage = null;
    this.isTyping = true;
    this.shouldScrollToBottom = true;

    const history = this.messages.slice(0, -1); // exclude the current user message
    this.chatService.sendMessage(text, history).subscribe({
      next: (res) => {
        this.isTyping = false;
        if (res.success && res.reply) {
          this.addBotMessage(res.reply);
        } else {
          this.errorMessage = res.message || 'AI is temporarily unavailable.';
        }
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.isTyping = false;
        this.errorMessage = 'Could not reach the AI assistant. Please try again.';
        this.shouldScrollToBottom = true;
      }
    });
  }

  onSuggestionClick(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.messages = [];
    this.errorMessage = null;
    this.addBotMessage('Chat cleared! How can I help you with your finances?');
  }

  copyMessage(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  toggleVoice(): void {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.recognition.start();
      this.isListening = true;
    }
  }

  private addUserMessage(text: string): void {
    this.messages.push({ role: 'user', text, timestamp: new Date() });
  }

  private addBotMessage(text: string): void {
    const htmlContent = this.renderMarkdown(text);
    this.messages.push({ role: 'model', text, htmlContent, timestamp: new Date() });
  }

  private renderMarkdown(text: string): string {
    try {
      return marked.parse(text, { async: false }) as string;
    } catch {
      return text;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  private initVoiceRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-IN';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        this.userInput = transcript;
        this.sendMessage();
      }
    };

    this.recognition.onend = () => { this.isListening = false; };
    this.recognition.onerror = () => { this.isListening = false; };
  }

  get hasVoice(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  get unreadCount(): number {
    return 0; // Not tracking unread in this implementation
  }
}
