import { Pipe, PipeTransform } from '@angular/core';
import { ChatMessage } from './chat-message';

@Pipe({ name: 'cmpipe' })
export class ChatMessagePipe implements PipeTransform {
  constructor() {}
  transform(chatMessage : ChatMessage) {
    let userMessage: String = `<div class="message-row-container">
    <div class="userid-container"> <span> {{chatMessage.user.userName}} </span><img
        *ngIf="chatMessage.user.admin" src="assets/star.svg" class="star-img"> </div>
    <div class="text-container">
      <div class="text-container-message"> {{chatMessage.messageText}}</div>
      <div class="timestamp"> <span> {{chatMessage.timestamp}} </span></div>
    </div>
  </div>`;
  return userMessage;
    

  }
} 